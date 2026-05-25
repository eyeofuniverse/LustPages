"use client";

import { useState, useMemo } from "react";
import { Search, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { TIER_LABELS } from "@/lib/tag-library";

export interface TagEntry {
  id: string;
  name: string;
  slug: string;
  tier: number;
  description?: string | null;
}

interface Props {
  availableTags: TagEntry[];
  value: string[];
  onChange: (ids: string[]) => void;
  onRequestTag?: (name: string, tier: number) => void;
}

const TIER_COLORS: Record<number, { bg: string; border: string; color: string }> = {
  1: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", color: "#6366f1" },
  2: { bg: "rgba(196,66,106,0.12)", border: "rgba(196,66,106,0.35)", color: "#c4426a" },
  3: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#f59e0b" },
};

function TierSection({
  tier,
  tags,
  selected,
  onToggle,
  onRequest,
}: {
  tier: number;
  tags: TagEntry[];
  selected: string[];
  onToggle: (id: string) => void;
  onRequest: (name: string, tier: number) => void;
}) {
  const [open, setOpen] = useState(tier <= 2);
  const [query, setQuery] = useState("");
  const label = TIER_LABELS[tier];
  const colors = TIER_COLORS[tier];
  const selectedCount = tags.filter((t) => selected.includes(t.id)).length;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return q ? tags.filter((t) => t.name.toLowerCase().includes(q) || t.slug.includes(q)) : tags;
  }, [tags, query]);

  const noResults = query.trim() !== "" && filtered.length === 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--border)", background: "var(--card)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
          >
            Tier {tier}
          </span>
          <div>
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {label.title}
            </span>
            <span className="text-xs ml-2" style={{ color: "var(--muted-foreground)" }}>
              {label.subtitle}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: colors.bg, color: colors.color }}
            >
              {selectedCount}/{label.max}
            </span>
          )}
          {tier <= 2 && label.min > 0 && selectedCount < label.min && (
            <span className="text-xs" style={{ color: "#ef4444" }}>
              required
            </span>
          )}
          {open
            ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
            : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
        </div>
      </button>

      {open && (
        <div className="p-4">
          <div className="relative mb-3">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--muted-foreground)" }}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.title.toLowerCase()}…`}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>

          {selectedCount > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags
                .filter((t) => selected.includes(t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggle(t.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                    style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
                  >
                    {t.name}
                    <X size={10} />
                  </button>
                ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {filtered
              .filter((t) => !selected.includes(t.id))
              .map((t) => {
                const atLimit = selectedCount >= label.max;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => !atLimit && onToggle(t.id)}
                    title={t.description ?? undefined}
                    disabled={atLimit}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "var(--muted)",
                      color: "var(--muted-foreground)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
          </div>

          {noResults && (
            <div className="mt-3 flex items-center gap-2">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                &ldquo;{query}&rdquo; not in library
              </p>
              <button
                type="button"
                onClick={() => { onRequest(query, tier); setQuery(""); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
              >
                <Plus size={11} /> Request tag
              </button>
            </div>
          )}

          {selectedCount >= label.max && label.max > 0 && (
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
              Max {label.max} for this tier.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function TierTagSelector({ availableTags, value, onChange, onRequestTag }: Props) {
  const byTier = useMemo(() => {
    const map: Record<number, TagEntry[]> = { 1: [], 2: [], 3: [] };
    for (const t of availableTags) {
      if (map[t.tier]) map[t.tier].push(t);
    }
    return map;
  }, [availableTags]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="space-y-3">
      {([1, 2, 3] as const).map((tier) => (
        <TierSection
          key={tier}
          tier={tier}
          tags={byTier[tier] ?? []}
          selected={value}
          onToggle={toggle}
          onRequest={(name, t) => onRequestTag?.(name, t)}
        />
      ))}
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Tier 1: 1–2 required · Tier 2: 2–4 required · Tier 3: up to 5 optional
      </p>
    </div>
  );
}
