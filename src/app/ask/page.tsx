import type { Metadata } from "next";
import { listFields } from "@/lib/brahmbook.functions";
import { AskForm } from "./ask-form";

export const metadata: Metadata = {
  title: "Ask the Community — BrahmBook",
  description:
    "Submit a question to the BrahmBook community. We'll route it to volunteer experts in the right field.",
  openGraph: {
    title: "Ask the Community — BrahmBook",
    description: "Get help from volunteer community experts.",
  },
};

export const revalidate = 60; // Revalidate list of fields every minute

export default async function AskPage() {
  let fields: { id: string; name: string }[] = [];
  try {
    fields = await listFields();
  } catch (error) {
    console.error("Failed to load fields for ask page:", error);
  }

  return (
    <div className="bb-container py-12 max-w-2xl">
      <h1 className="font-display text-4xl font-semibold">Ask the community</h1>
      <p className="mt-2 text-muted-foreground">
        Write your question clearly, choose the right field(s), and we'll route it to community
        experts.
      </p>
      <AskForm fields={fields} />
    </div>
  );
}
