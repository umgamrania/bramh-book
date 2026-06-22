"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { submitQuestion } from "@/lib/brahmbook.functions";
import { FieldsPicker } from "@/components/fields-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AskForm({ fields }: { fields: { id: string; name: string }[] }) {
  const [query_text, setQ] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fieldIds, setFieldIds] = useState<string[]>([]);
  const [newFieldNames, setNew] = useState<string[]>([]);
  const [hp, setHp] = useState("");
  const [challenge, setCh] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    try {
      await submitQuestion({
        data: {
          query_text,
          name,
          phone,
          email,
          fieldIds,
          hp,
          challenge,
        },
      });
      setDone(true);
      toast.success("Your question has been submitted.");
    } catch (error: any) {
      toast.error(error?.message ?? "Submission failed");
    } finally {
      setIsPending(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-3xl font-semibold">Question received</h1>
        <p className="mt-3 text-muted-foreground">
          Thanks — the BB community has been notified. We'll be in touch via the details you
          provided.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/experts">Browse experts</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 space-y-6 rounded-2xl border border-border bg-card p-6 md:p-8"
    >
      <div className="space-y-1.5">
        <Label>Your question *</Label>
        <Textarea
          rows={6}
          value={query_text}
          onChange={(e) => setQ(e.target.value.slice(0, 2000))}
          required
          minLength={10}
          placeholder="Describe your question in detail…"
        />
        <div className="text-right text-xs text-muted-foreground">{query_text.length} / 2000</div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label>Phone *</Label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="+91 …"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Relevant field(s)</Label>
        <FieldsPicker
          fields={fields}
          selectedIds={fieldIds}
          onChangeSelected={setFieldIds}
          newFieldNames={newFieldNames}
          onChangeNew={setNew}
          allowCreate={false}
        />
      </div>

      <input
        type="text"
        name="website"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />
      <div className="space-y-1.5">
        <Label>What is 3 + 4? *</Label>
        <Input
          value={challenge}
          onChange={(e) => setCh(e.target.value)}
          required
          className="max-w-[120px]"
        />
      </div>

      <Button type="submit" disabled={isPending} size="lg">
        {isPending ? "Submitting…" : "Submit question"}
      </Button>
    </form>
  );
}
