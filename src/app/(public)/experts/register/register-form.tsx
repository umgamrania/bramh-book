"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { registerExpert, getMathChallenge } from "@/lib/brahmbook.functions";
import { FieldsPicker } from "@/components/fields-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type State = {
  name: string;
  age: string;
  gender: "" | "male" | "female" | "other";
  phone: string;
  email: string;
  blood_group: string;
  education: string;
  occupation: string;
  address: string;
  city: string;
  state: string;
  what_i_can_offer: string;
  what_i_expect: string;
  hobbies_interests: string;
  digital_identity: string;
  special_notes: string;
  fieldIds: string[];
  newFieldNames: string[];
  hp: string;
  captchaToken: string;
  captchaValue: string;
};

const empty: State = {
  name: "",
  age: "",
  gender: "",
  phone: "",
  email: "",
  blood_group: "",
  education: "",
  occupation: "",
  address: "",
  city: "",
  state: "",
  what_i_can_offer: "",
  what_i_expect: "",
  hobbies_interests: "",
  digital_identity: "",
  special_notes: "",
  fieldIds: [],
  newFieldNames: [],
  hp: "",
  captchaToken: "",
  captchaValue: "",
};

export function RegisterForm({ fields }: { fields: { id: string; name: string }[] }) {
  const router = useRouter();
  const [s, setS] = useState<State>(empty);
  const [isPending, setIsPending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [captchaQuestion, setCaptchaQuestion] = useState<string>("");

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));

  const refreshChallenge = useCallback(async () => {
    try {
      const res = await getMathChallenge();
      set("captchaToken", res.token);
      set("captchaValue", "");
      setCaptchaQuestion(res.question);
    } catch (err) {
      toast.error("Failed to load security challenge. Please refresh the page.");
    }
  }, []);

  useEffect(() => {
    refreshChallenge();
  }, [refreshChallenge]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);

    const ageNum = Number(s.age);

    try {
      await registerExpert({
        data: {
          name: s.name,
          age: ageNum,
          gender: s.gender || (undefined as any),
          phone: s.phone,
          email: s.email,
          blood_group: s.blood_group || (undefined as any),
          education: s.education || undefined,
          occupation: s.occupation || undefined,
          address: s.address || undefined,
          city: s.city || undefined,
          state: s.state || undefined,
          what_i_can_offer: s.what_i_can_offer || undefined,
          what_i_expect: s.what_i_expect || undefined,
          hobbies_interests: s.hobbies_interests || undefined,
          digital_identity: s.digital_identity || undefined,
          special_notes: s.special_notes || undefined,
          fieldIds: s.fieldIds,
          newFieldNames: s.newFieldNames,
          hp: s.hp,
          captchaToken: s.captchaToken,
          captchaValue: s.captchaValue,
        },
      });
      setSubmitted(true);
      toast.success("Profile submitted. Thank you!");
    } catch (error: any) {
      toast.error(error?.message ?? "Submission failed");
      refreshChallenge();
    } finally {
      setIsPending(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-3xl font-semibold">Thank you!</h1>
        <p className="mt-3 text-muted-foreground">
          Your profile has been added to the BrahmBook community directory.
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
    <form onSubmit={submit} className="mt-10 space-y-10">
      <Section title="Personal details">
        <Grid>
          <Field label="Name *">
            <Input
              value={s.name}
              onChange={(e) => set("name", e.target.value)}
              required
              minLength={2}
            />
          </Field>
          <Field label="Age *">
            <Input
              type="number"
              min={1}
              max={129}
              value={s.age}
              onChange={(e) => set("age", e.target.value)}
              required
            />
          </Field>
          <Field label="Gender *">
            <Select value={s.gender} onValueChange={(v) => set("gender", v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Blood group">
            <Select value={s.blood_group} onValueChange={(v) => set("blood_group", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", "Unknown"].map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Phone *">
            <Input
              value={s.phone}
              onChange={(e) => set("phone", e.target.value)}
              required
              placeholder="+91 …"
            />
          </Field>
          <Field label="Email *">
            <Input
              type="email"
              value={s.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Background">
        <Grid>
          <Field label="Education">
            <Input
              value={s.education}
              onChange={(e) => set("education", e.target.value)}
              placeholder="e.g. B.E. Mechanical, GTU"
            />
          </Field>
          <Field label="Occupation">
            <Input value={s.occupation} onChange={(e) => set("occupation", e.target.value)} />
          </Field>
          <Field label="City">
            <Input value={s.city} onChange={(e) => set("city", e.target.value)} />
          </Field>
          <Field label="State">
            <Input value={s.state} onChange={(e) => set("state", e.target.value)} />
          </Field>
          <Field label="Address" full>
            <Input value={s.address} onChange={(e) => set("address", e.target.value)} />
          </Field>
        </Grid>
      </Section>

      <Section
        title="Fields of expertise *"
        desc="Pick all that apply. Don't see your field? Add a new one."
      >
        <FieldsPicker
          fields={fields}
          selectedIds={s.fieldIds}
          onChangeSelected={(ids) => set("fieldIds", ids)}
          newFieldNames={s.newFieldNames}
          onChangeNew={(n) => set("newFieldNames", n)}
        />
      </Section>

      <Section title="Community contribution">
        <Field label="What I can do for the BB community">
          <Textarea
            rows={4}
            value={s.what_i_can_offer}
            onChange={(e) => set("what_i_can_offer", e.target.value)}
          />
        </Field>
        <Field label="What I expect from the BB community">
          <Textarea
            rows={3}
            value={s.what_i_expect}
            onChange={(e) => set("what_i_expect", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="A little more about you">
        <Field label="Hobbies / interests">
          <Input
            value={s.hobbies_interests}
            onChange={(e) => set("hobbies_interests", e.target.value)}
            placeholder="e.g. reading, trekking, classical music"
          />
        </Field>
        <Field label="Digital identity">
          <Textarea
            rows={2}
            value={s.digital_identity}
            onChange={(e) => set("digital_identity", e.target.value)}
            placeholder="WhatsApp group links, Instagram / Facebook handles, website…"
          />
        </Field>
        <Field label="Special notes">
          <Textarea
            rows={2}
            value={s.special_notes}
            onChange={(e) => set("special_notes", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Quick check">
        {/* Honeypot */}
        <input
          type="text"
          name="website"
          value={s.hp}
          onChange={(e) => set("hp", e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
        />
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="captcha-input">{captchaQuestion || "Loading question..."} *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="captcha-input"
                value={s.captchaValue}
                onChange={(e) => set("captchaValue", e.target.value)}
                required
                className="max-w-[120px] text-center font-semibold"
                autoComplete="off"
                disabled={!captchaQuestion}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={refreshChallenge}
                className="h-10 w-10 shrink-0"
                title="Get new question"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending} size="lg">
          {isPending ? "Submitting…" : "Submit profile"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
      <h2 className="font-display text-2xl font-semibold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-muted-foreground">{desc}</p>}
      <div className="mt-6 space-y-5">{children}</div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "md:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
