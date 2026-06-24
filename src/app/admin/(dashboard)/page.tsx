import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import {
  getDashboardStatsAdmin,
  listAllExpertsAdmin,
  listAllQuestionsAdmin,
  listAllFieldsAdmin,
} from "@/lib/admin.functions";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin Dashboard — BrahmBook Console",
  description: "Manage BrahmBook experts, questions, and fields of expertise.",
};

// Force dynamic execution for data freshness
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (!session || !(await verifySession(session))) {
    redirect("/admin/login");
  }

  let stats = {
    experts: { total: 0, pending: 0, approved: 0 },
    questions: { total: 0, new: 0, in_review: 0 },
    fields: { total: 0, pending: 0 },
  };
  let experts: any[] = [];
  let questions: any[] = [];
  let fields: any[] = [];
  let errorMsg = "";

  try {
    const [statsData, expertsData, questionsData, fieldsData] = await Promise.all([
      getDashboardStatsAdmin(),
      listAllExpertsAdmin(),
      listAllQuestionsAdmin(),
      listAllFieldsAdmin(),
    ]);

    stats = statsData;
    experts = expertsData;
    questions = questionsData;
    fields = fieldsData;
  } catch (error) {
    console.error("Error loading admin dashboard page data:", error);
    errorMsg = error instanceof Error ? error.message : "Failed to load dashboard data.";
  }

  if (errorMsg) {
    return (
      <div className="bb-container py-12">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
          <h2 className="font-display text-2xl font-bold">Failed to load admin console</h2>
          <p className="mt-2 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminDashboardClient
      initialStats={stats}
      initialExperts={experts}
      initialQuestions={questions}
      initialFields={fields}
    />
  );
}
