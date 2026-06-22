import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getExpert } from "@/lib/brahmbook.functions";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Briefcase,
  Droplet,
  Heart,
  Link2,
  Info,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  try {
    const expert = await getExpert({ data: { id: resolvedParams.id } });
    if (!expert) return { title: "Expert Not Found — BrahmBook" };

    const title = `${expert.name} — BrahmBook Expert`;
    const desc = expert.occupation
      ? `${expert.name}, ${expert.occupation}${expert.city ? ` from ${expert.city}` : ""} — volunteer expert on BrahmBook.`
      : "A volunteer community expert on BrahmBook.";

    return {
      title,
      description: desc,
      openGraph: {
        title,
        description: desc,
      },
    };
  } catch (error) {
    return {
      title: "Community Expert — BrahmBook",
    };
  }
}

export default async function ExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  let expert = null;

  try {
    expert = await getExpert({ data: { id: resolvedParams.id } });
  } catch (error) {
    console.error("Failed to load expert details:", error);
  }

  if (!expert) {
    notFound();
  }

  const loc = [expert.city, expert.state].filter(Boolean).join(", ");

  return (
    <div className="bb-container py-10 max-w-4xl">
      <Link
        href="/experts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      <header className="mt-6 flex flex-col md:flex-row md:items-center gap-6">
        <div className="h-20 w-20 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display text-3xl font-semibold">
          {(expert.name ?? "?").slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-4xl font-semibold">{expert.name}</h1>
          {expert.occupation && (
            <p className="mt-1 text-lg text-muted-foreground">{expert.occupation}</p>
          )}
          {expert.fields && expert.fields.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {expert.fields.map((f: any) => (
                <Badge key={f.id}>{f.name}</Badge>
              ))}
            </div>
          )}
        </div>
      </header>

      <section className="mt-10 grid gap-8 md:grid-cols-[260px_1fr]">
        <aside className="space-y-5 rounded-2xl border border-border bg-card p-6 h-fit">
          {loc && <Row icon={<MapPin className="h-4 w-4" />} label="Location" value={loc} />}
          {expert.education && (
            <Row
              icon={<GraduationCap className="h-4 w-4" />}
              label="Education"
              value={expert.education}
            />
          )}
          {expert.occupation && (
            <Row
              icon={<Briefcase className="h-4 w-4" />}
              label="Occupation"
              value={expert.occupation}
            />
          )}
          {expert.blood_group && (
            <Row
              icon={<Droplet className="h-4 w-4" />}
              label="Blood group"
              value={expert.blood_group}
            />
          )}
          {expert.hobbies_interests && (
            <Row
              icon={<Heart className="h-4 w-4" />}
              label="Hobbies & interests"
              value={expert.hobbies_interests}
            />
          )}
          {expert.digital_identity && (
            <Row
              icon={<Link2 className="h-4 w-4" />}
              label="Digital identity"
              value={expert.digital_identity}
            />
          )}
        </aside>

        <div className="space-y-8">
          <Block title="What I can offer" value={expert.what_i_can_offer} />
          <Block title="What I expect" value={expert.what_i_expect} />
          {expert.address && <Block title="Address" value={expert.address} />}
          {expert.special_notes && (
            <div className="rounded-2xl border border-border bg-accent/40 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Info className="h-4 w-4" /> Notes
              </div>
              <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
                {expert.special_notes}
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            Contact details are kept private. To reach this expert, coordinate through the BB
            community organizers.
          </div>
        </div>
      </section>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-foreground">{value}</div>
      </div>
    </div>
  );
}

function Block({ title, value }: { title: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}
