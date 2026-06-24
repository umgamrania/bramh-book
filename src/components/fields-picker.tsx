import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Check } from "lucide-react";

export type Field = { id: string; name: string };

export function FieldsPicker({
  fields,
  selectedIds,
  onChangeSelected,
  newFieldNames,
  onChangeNew,
  allowCreate = true,
}: {
  fields: Field[];
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  newFieldNames: string[];
  onChangeNew: (names: string[]) => void;
  allowCreate?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [allNewFieldNames, setAllNewFieldNames] = useState<string[]>(newFieldNames);

  useEffect(() => {
    if (newFieldNames.length === 0) {
      setAllNewFieldNames([]);
    } else {
      setAllNewFieldNames((prev) => {
        const merged = [...prev];
        let changed = false;
        for (const n of newFieldNames) {
          if (!merged.includes(n)) {
            merged.push(n);
            changed = true;
          }
        }
        return changed ? merged : prev;
      });
    }
  }, [newFieldNames]);

  const filtered = fields.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));
  const filteredNew = allNewFieldNames.filter((n) => n.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    onChangeSelected(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  };

  const addNew = () => {
    const name = draft.trim();
    if (!name) return;
    if (
      allNewFieldNames.includes(name) ||
      fields.some((f) => f.name.toLowerCase() === name.toLowerCase())
    ) {
      setDraft("");
      setAdding(false);
      return;
    }
    setAllNewFieldNames([...allNewFieldNames, name]);
    onChangeNew([...newFieldNames, name]);
    setDraft("");
    setAdding(false);
  };

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search fields…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        {filtered.map((f) => {
          const selected = selectedIds.includes(f.id);
          return (
            <button
              type="button"
              key={f.id}
              onClick={() => toggle(f.id)}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors cursor-pointer ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border text-foreground"}`}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
              {f.name}
            </button>
          );
        })}
        {filteredNew.map((n) => {
          const selected = newFieldNames.includes(n);
          return (
            <div
              key={n}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors ${
                selected
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-accent"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onChangeNew(
                    selected ? newFieldNames.filter((x) => x !== n) : [...newFieldNames, n],
                  );
                }}
                className="inline-flex items-center gap-1.5 cursor-pointer"
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                <span>{n}</span>
                <span className="text-xs opacity-70">(new)</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setAllNewFieldNames(allNewFieldNames.filter((x) => x !== n));
                  onChangeNew(newFieldNames.filter((x) => x !== n));
                }}
                className={`ml-1.5 rounded-full p-0.5 hover:bg-muted/20 cursor-pointer ${
                  selected
                    ? "text-primary-foreground/80 hover:text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Remove field"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
      {allowCreate && (
        <div className="flex items-center gap-2">
          {adding ? (
            <>
              <Input
                autoFocus
                placeholder="New field name"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addNew();
                  }
                }}
                className="max-w-xs"
              />
              <Button type="button" size="sm" onClick={addNew}>
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add new field
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
