import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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

  const filtered = fields.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()));

  const toggle = (id: string) => {
    onChangeSelected(
      selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id],
    );
  };

  const addNew = () => {
    const name = draft.trim();
    if (!name) return;
    if (
      newFieldNames.includes(name) ||
      fields.some((f) => f.name.toLowerCase() === name.toLowerCase())
    ) {
      setDraft("");
      setAdding(false);
      return;
    }
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
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${selected ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-accent border-border"}`}
            >
              {selected && <Check className="h-3.5 w-3.5" />}
              {f.name}
            </button>
          );
        })}
        {newFieldNames.map((n) => (
          <Badge key={n} variant="secondary" className="gap-1">
            {n} <span className="text-xs opacity-70">(new)</span>
            <button type="button" onClick={() => onChangeNew(newFieldNames.filter((x) => x !== n))}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
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
