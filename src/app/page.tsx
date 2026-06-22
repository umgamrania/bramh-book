import Link from "next/link";
import { getStats } from "@/lib/brahmbook.functions";
import { Users, MessageCircleQuestion, Search, Sparkles } from "lucide-react";

export const revalidate = 60; // Revalidate stats every minute

export default async function HomePage() {
  let stats = { experts: 0, fields: 0 };
  try {
    stats = await getStats();
  } catch (error) {
    console.error("Failed to load homepage stats:", error);
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background" />
        <div className="absolute -top-32 -right-32 -z-10 h-96 w-96 rounded-full bg-saffron/20 blur-3xl" />
        <div className="bb-container py-20 md:py-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-saffron" /> A community resource — by BB, for BB
          </div>
          <h1 className="mt-6 max-w-3xl font-display text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.05]">
            A community of experts, <span className="text-primary">open to help.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            BrahmBook is a friendly directory of community members who volunteer their knowledge —
            and a simple way to ask the community for guidance when you need it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/experts"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
            >
              <Search className="h-4 w-4" /> Browse Experts
            </Link>
            <Link
              href="/experts/register"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-medium hover:bg-accent transition-all"
            >
              <Users className="h-4 w-4" /> Register as Expert
            </Link>
            <Link
              href="/ask"
              className="inline-flex items-center gap-2 rounded-md bg-saffron px-5 py-3 text-sm font-medium text-saffron-foreground hover:opacity-90 transition-all"
            >
              <MessageCircleQuestion className="h-4 w-4" /> Ask a Question
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            <Stat label="Community Experts" value={stats.experts} />
            <Stat label="Fields Covered" value={stats.fields} />
            <Stat label="Hours, freely given" value="∞" />
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="bb-container py-20 grid gap-10 md:grid-cols-3">
        <Card
          title="A directory of experts"
          body="Doctors, lawyers, engineers, teachers, CAs, artists and more — community members listing what they're happy to help with."
        />
        <Card
          title="A place to ask"
          body="Submit a question along with the relevant field. The community routes it to the right people for review."
        />
        <Card
          title="Built on trust"
          body="No fees, no algorithms — just neighbours helping neighbours. Phone & email are shared only when an expert is contacted."
        />
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="font-display text-4xl font-semibold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="font-display text-2xl font-semibold">{title}</h3>
      <p className="mt-3 text-muted-foreground leading-relaxed">{body}</p>
    </div>
  );
}
