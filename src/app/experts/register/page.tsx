import type { Metadata } from "next";
import { listFields } from "@/lib/brahmbook.functions";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Register as a Community Expert — BrahmBook",
  description:
    "Share what you can help the BB community with — register your profile in the BrahmBook expert directory.",
  openGraph: {
    title: "Register as a Community Expert — BrahmBook",
    description: "Join the BrahmBook community of volunteer experts.",
  },
};

export const revalidate = 60; // Revalidate list of fields every minute

export default async function RegisterPage() {
  let fields: { id: string; name: string }[] = [];
  try {
    fields = await listFields();
  } catch (error) {
    console.error("Failed to load fields for registration form:", error);
  }

  return (
    <div className="bb-container py-12 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold">Register as an expert</h1>
      <p className="mt-2 text-muted-foreground">
        Tell the community a bit about yourself and how you'd like to help. Fields marked * are
        required.
      </p>
      <RegisterForm fields={fields} />
    </div>
  );
}
