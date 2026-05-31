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

export interface CustomTag { name: string; tier: number; }

interface Props {
  availableTags: TagEntry[];
  value: string[];
  onChange: (ids: string[]) => void;
  allowFreeForm?: boolean;
  customTags?: CustomTag[];
  onAddCustomTag?: (name: string, tier: number) => void;
  onRemoveCustomTag?: (name: string) => void;
  showPendingBadge?: boolean;
  /** When false, renders a single flat search input instead of per-tier sections. Default: true */
  showTierSections?: boolean;
  onRequestTag?: (name: string, tier: number) => void;
}

const TIER_COLORS: Record<number, { bg: string; border: string; color: string }> = {
  1: { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", color: "#6366f1" },
  2: { bg: "rgba(196,66,106,0.12)", border: "rgba(196,66,106,0.35)", color: "#c4426a" },
  3: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#f59e0b" },
};

function FlatTagSearch({
  tags, selected, onToggle, allowFreeForm, onAddCustomTag,
}: {
  tags: TagEntry[];
  selected: string[];
  onToggle: (id: string) => void;
  allowFreeForm?: boolean;
  onAddCustomTag?: (name: string, tier: number) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return tags.filter((t) => t.name.toLowerCase().includes(q) || t.slug.includes(q));
  }, [tags, query]);

  const noResults = query.trim() !== "" && filtered.length === 0;

  function handleAdd() {
    const name = query.trim();
    if (!name || !allowFreeForm || !onAddCustomTag) return;
    onAddCustomTag(name, 2);
    setQuery("");
  }

  const selectedTags = tags.filter((t) => selected.includes(t.id));

  return (
    <div
      className="rounded-xl overflow-hidden p-4 space-y-3"
      style={{ border: "1px solid var(--border)", background: "var(--card)" }}
    >
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (noResults) handleAdd();
            }
          }}
          placeholder="Search tags or type a new one…"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
          style={{
            background: "var(--muted)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            outline: "none",
          }}
        />
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => {
            const c = TIER_COLORS[t.tier] ?? TIER_COLORS[2];
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
              >
                {t.name}
                <X size={10} />
              </button>
            );
          })}
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filtered
            .filter((t) => !selected.includes(t.id))
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id)}
                title={t.description ?? undefined}
                className="px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: "var(--muted)",
                  color: "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {t.name}
              </button>
            ))}
        </div>
      )}

      {noResults && (
        <div className="flex items-center gap-2">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            &ldquo;{query}&rdquo; not in library
          </p>
          {allowFreeForm && (
            <button
              type="button"
              onClick={handleAdd}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
              style={{
                background: TIER_COLORS[2].bg,
                color: TIER_COLORS[2].color,
                border: `1px solid ${TIER_COLORS[2].border}`,
              }}
            >
              <Plus size={11} />
              Add &quot;{query}&quot;
            </button>
          )}
        </div>
      )}

      {!query.trim() && selectedTags.length === 0 && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Type to search the tag library
        </p>
      )}
    </div>
  );
}

function TierSection({
  tier, tags, selected, onToggle,
  allowFreeForm, onAddCustomTag, onRequestTag,
}: {
  tier: number;
  tags: TagEntry[];
  selected: string[];
  onToggle: (id: string) => void;
  allowFreeForm?: boolean;
  onAddCustomTag?: (name: string, tier: number) => void;
  onRequestTag?: (name: string, tier: number) => void;
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

  function handleAdd() {
    const name = query.trim();
    if (!name) return;
    if (allowFreeForm && onAddCustomTag) {
      onAddCustomTag(name, tier);
    } else if (onRequestTag) {
      onRequestTag(name, tier);
    }
    setQuery("");
  }

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
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (noResults) handleAdd(); } }}
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
                onClick={handleAdd}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
              >
                <Plus size={11} />
                {allowFreeForm ? `Add "${query}"` : "Request tag"}
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

export function TierTagSelector({
  availableTags, value, onChange,
  allowFreeForm, customTags, onAddCustomTag, onRemoveCustomTag, showPendingBadge,
  showTierSections = true,
  onRequestTag,
}: Props) {
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
      {showTierSections ? (
        ([1, 2, 3] as const).map((tier) => (
          <TierSection
            key={tier}
            tier={tier}
            tags={byTier[tier] ?? []}
            selected={value}
            onToggle={toggle}
            allowFreeForm={allowFreeForm}
            onAddCustomTag={onAddCustomTag}
            onRequestTag={(name, t) => onRequestTag?.(name, t)}
          />
        ))
      ) : (
        <FlatTagSearch
          tags={availableTags}
          selected={value}
          onToggle={toggle}
          allowFreeForm={allowFreeForm}
          onAddCustomTag={onAddCustomTag}
        />
      )}

      {customTags && customTags.length > 0 && (
        <div
          className="p-3 rounded-xl space-y-2"
          style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
            Custom tags{showPendingBadge ? " · pending admin review" : ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {customTags.map(({ name, tier }) => {
              const colors = showTierSections ? (TIER_COLORS[tier] ?? TIER_COLORS[2]) : null;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onRemoveCustomTag?.(name)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80"
                  style={
                    colors
                      ? { background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }
                      : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
                  }
                >
                  {name}
                  {showPendingBadge && (
                    <span
                      className="ml-0.5 w-1.5 h-1.5 rounded-full inline-block"
                      style={{ background: "#f59e0b" }}
                      title="Pending admin review"
                    />
                  )}
                  <X size={10} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showTierSections && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Tier 1: 1–2 required · Tier 2: 2–4 required · Tier 3: up to 5 optional
          {allowFreeForm && " · Type a tag name and press Enter or click Add to use a custom tag"}
        </p>
      )}
    </div>
  );
}
