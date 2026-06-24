"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { listExperts } from "@/lib/brahmbook.functions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MapPin, GraduationCap, Briefcase, Search } from "lucide-react";

const ANY = "__any__";

type Field = { id: string; name: string };
type Expert = {
  id?: string;
  name: string;
  occupation: string | null;
  city: string | null;
  state: string | null;
  education: string | null;
  fields: { id: string; name: string }[];
};

export function ExpertsListClient({
  fields,
  opts,
  initialExperts,
}: {
  fields: Field[];
  opts: { cities: string[]; states: string[]; educations: string[] };
  initialExperts: Expert[];
}) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [city, setCity] = useState<string>(ANY);
  const [state, setState] = useState<string>(ANY);
  const [education, setEducation] = useState<string>(ANY);
  const [fieldIds, setFieldIds] = useState<string[]>([]);
  const [quickField, setQuickField] = useState<string>(ANY);

  const [experts, setExperts] = useState<Expert[]>(initialExperts);
  const [isLoading, setIsLoading] = useState(false);

  const effectiveFieldIds = useMemo(
    () => (quickField !== ANY ? [quickField] : fieldIds),
    [quickField, fieldIds],
  );

  const filteredFields = useMemo(() => {
    return fields.filter((f) => f.name.toLowerCase().includes(fieldSearch.toLowerCase()));
  }, [fields, fieldSearch]);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search]);

  // Fetch filtered experts when query states change
  useEffect(() => {
    let active = true;
    const fetchFiltered = async () => {
      setIsLoading(true);
      try {
        const res = await listExperts({
          data: {
            search: debouncedSearch || undefined,
            city: city !== ANY ? city : undefined,
            state: state !== ANY ? state : undefined,
            education: education !== ANY ? education : undefined,
            fieldIds: effectiveFieldIds.length ? effectiveFieldIds : undefined,
          },
        });
        if (active) {
          setExperts(res.experts as Expert[]);
        }
      } catch (err) {
        console.error("Error fetching filtered experts:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchFiltered();

    return () => {
      active = false;
    };
  }, [debouncedSearch, city, state, education, effectiveFieldIds]);

  const toggleField = (id: string) =>
    setFieldIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const reset = () => {
    setSearch("");
    setFieldSearch("");
    setCity(ANY);
    setState(ANY);
    setEducation(ANY);
    setFieldIds([]);
    setQuickField(ANY);
  };

  return (
    <div className="bb-container py-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl font-semibold">Community experts</h1>
          <p className="mt-2 text-muted-foreground">
            Browse members of the BB community who've offered to help.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[260px_1fr]">
        {/* Filters */}
        <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 h-fit md:sticky md:top-20">
          <div className="space-y-1.5">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Name or occupation"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <Filter label="City" value={city} onChange={setCity} options={opts.cities} />
          <Filter label="State" value={state} onChange={setState} options={opts.states} />
          <Filter
            label="Education"
            value={education}
            onChange={setEducation}
            options={opts.educations}
          />

          <div className="space-y-2">
            <Label>Fields</Label>
            <Input
              placeholder="Search fields..."
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              className="text-xs h-8"
            />
            <div className="flex flex-wrap gap-1.5 max-h-60 overflow-auto pt-1">
              {filteredFields.length === 0 ? (
                <span className="text-xs text-muted-foreground pt-1">No fields found.</span>
              ) : (
                filteredFields.map((f) => {
                  const sel = fieldIds.includes(f.id);
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => toggleField(f.id)}
                      className={`rounded-full border px-2.5 py-1 text-xs cursor-pointer transition-all ${
                        sel
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-border text-foreground"
                      }`}
                    >
                      {f.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Button variant="outline" className="w-full cursor-pointer" onClick={reset}>
            Reset filters
          </Button>
        </aside>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : experts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <p className="font-display text-xl">No experts match these filters.</p>
              <p className="text-muted-foreground mt-2">
                Try clearing some filters, or invite someone to register.
              </p>
              <Button asChild className="mt-4 cursor-pointer">
                <Link href="/experts/register">Register an expert</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-3">
                {experts.length} expert{experts.length === 1 ? "" : "s"}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {experts.map((e) => (
                  <Link
                    key={e.id!}
                    href={`/experts/${e.id}`}
                    className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-display font-semibold text-lg">
                        {(e.name ?? "?").slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate group-hover:text-primary">
                          {e.name}
                        </div>
                        {e.occupation && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3.5 w-3.5" /> {e.occupation}
                          </div>
                        )}
                        {(e.city || e.state) && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3.5 w-3.5" />{" "}
                            {[e.city, e.state].filter(Boolean).join(", ")}
                          </div>
                        )}
                        {e.education && (
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <GraduationCap className="h-3.5 w-3.5" /> {e.education}
                          </div>
                        )}
                      </div>
                    </div>
                    {e.fields.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {e.fields.slice(0, 4).map((f) => (
                          <Badge key={f.id} variant="secondary">
                            {f.name}
                          </Badge>
                        ))}
                        {e.fields.length > 4 && (
                          <Badge variant="outline">+{e.fields.length - 4}</Badge>
                        )}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Any ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any {label.toLowerCase()}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
