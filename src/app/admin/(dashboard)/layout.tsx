import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { AdminHeader } from "./admin-header";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (!session || !(await verifySession(session))) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <main className="pb-16">{children}</main>
    </div>
  );
}
