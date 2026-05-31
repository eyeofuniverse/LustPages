"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit2, Check, X, Tag, ChevronDown, ChevronUp, GitMerge, Clock } from "lucide-react";

interface TagAlias { id: string; alias: string; }
interface AdminTag {
  id: string;
  name: string;
  slug: string;
  tier: number;
  description: string | null;
  isApproved: boolean;
  _count: { stories: number };
  aliases: TagAlias[];
}

interface Props {
  initialTags: AdminTag[];
}

const TIER_COLORS: Record<number, { bg: string; border: string; color: string; label: string }> = {
  1: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", color: "#6366f1", label: "Subgenre" },
  2: { bg: "rgba(196,66,106,0.1)", border: "rgba(196,66,106,0.3)", color: "#c4426a", label: "Trope" },
  3: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Content" },
};

function slugifyDisplay(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function AdminTagsClient({ initialTags }: Props) {
  const [tags, setTags] = useState(initialTags);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editTier, setEditTier] = useState(2);
  const [editDesc, setEditDesc] = useState("");
  const [newAlias, setNewAlias] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  // New tag form
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addTier, setAddTier] = useState(2);
  const [addDesc, setAddDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const pendingTags = useMemo(() => tags.filter((t) => !t.isApproved), [tags]);
  const approvedTags = useMemo(() => tags.filter((t) => t.isApproved), [tags]);

  const [pendingMergeTarget, setPendingMergeTarget] = useState<Record<string, string>>({});
  const [pendingApproveTier, setPendingApproveTier] = useState<Record<string, number>>({});
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function handleApprove(tag: AdminTag) {
    const tier = pendingApproveTier[tag.id] ?? tag.tier;
    setPendingAction(tag.id + "approve");
    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true, tier }),
    });
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tag.id ? { ...t, isApproved: true, tier } : t));
    } else {
      const d = await res.json();
      alert(d.error ?? "Error approving tag");
    }
    setPendingAction(null);
  }

  async function handleMergeInto(tag: AdminTag) {
    const targetId = pendingMergeTarget[tag.id];
    if (!targetId) return;
    if (!confirm(`Merge "${tag.name}" into the selected tag? All ${tag._count.stories} stories will be updated. This cannot be undone.`)) return;
    setPendingAction(tag.id + "merge");
    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mergeInto", targetTagId: targetId }),
    });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
      setPendingMergeTarget((prev) => { const n = { ...prev }; delete n[tag.id]; return n; });
    } else {
      const d = await res.json();
      alert(d.error ?? "Error merging tag");
    }
    setPendingAction(null);
  }

  const filtered = approvedTags.filter((t) => {
    const matchSearch = !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase());
    const matchTier = tierFilter === null || t.tier === tierFilter;
    return matchSearch && matchTier;
  });

  async function handleSeed() {
    const res = await fetch("/api/admin/tags", { method: "PUT" });
    const data = await res.json();
    if (res.ok) {
      window.location.reload();
    } else {
      alert(data.message ?? data.error ?? "Error");
    }
  }

  async function handleAdd() {
    if (!addName.trim()) return;
    setAddLoading(true);
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: addName.trim(), tier: addTier, description: addDesc || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setTags((prev) => [...prev, { ...data, _count: { stories: 0 }, aliases: [] }]);
      setAddName(""); setAddTier(2); setAddDesc(""); setShowAdd(false);
    } else {
      alert(data.error ?? "Error creating tag");
    }
    setAddLoading(false);
  }

  async function handleSave(id: string) {
    setSaving(id);
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, tier: editTier, description: editDesc || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === id ? { ...t, ...data, _count: t._count } : t));
      setEditId(null);
    } else {
      alert(data.error ?? "Error saving");
    }
    setSaving(null);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete tag "${name}"? This removes it from all stories.`)) return;
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" });
    if (res.ok) setTags((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleToggleApprove(tag: AdminTag) {
    const res = await fetch(`/api/admin/tags/${tag.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: !tag.isApproved }),
    });
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tag.id ? { ...t, isApproved: !t.isApproved } : t));
    }
  }

  async function handleAddAlias(tagId: string) {
    const alias = newAlias[tagId]?.trim();
    if (!alias) return;
    const res = await fetch(`/api/admin/tags/${tagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addAlias: alias }),
    });
    const data = await res.json();
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tagId ? { ...t, aliases: data.aliases } : t));
      setNewAlias((prev) => ({ ...prev, [tagId]: "" }));
    } else {
      alert(data.error ?? "Error adding alias");
    }
  }

  async function handleRemoveAlias(tagId: string, aliasId: string) {
    const res = await fetch(`/api/admin/tags/${tagId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeAliasId: aliasId }),
    });
    const data = await res.json();
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tagId ? { ...t, aliases: data.aliases } : t));
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    borderRadius: "10px",
    fontSize: "13px",
    padding: "6px 10px",
    outline: "none",
  };

  return (
    <div>
      {/* Pending Tags Section */}
      {pendingTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}
            >
              Pending Approval
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{pendingTags.length} tag{pendingTags.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {pendingTags.map((tag) => (
              <div
                key={tag.id}
                className="p-4 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{tag.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}>
                        pending
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/{tag.slug}</span>
                    </div>
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <Clock size={10} />
                      {tag._count.stories} {tag._count.stories === 1 ? "story" : "stories"} using this tag
                    </p>
                  </div>
                  <button onClick={() => handleDelete(tag.id, tag.name)} className="opacity-40 hover:opacity-100 transition-opacity shrink-0">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Approve with tier picker */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={pendingApproveTier[tag.id] ?? tag.tier}
                      onChange={(e) => setPendingApproveTier((prev) => ({ ...prev, [tag.id]: Number(e.target.value) }))}
                      className="px-2 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                    >
                      <option value={1}>Tier 1 — Subgenre</option>
                      <option value={2}>Tier 2 — Trope</option>
                      <option value={3}>Tier 3 — Content</option>
                    </select>
                    <button
                      onClick={() => handleApprove(tag)}
                      disabled={pendingAction === tag.id + "approve"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: "#22c55e" }}
                    >
                      <Check size={12} />
                      {pendingAction === tag.id + "approve" ? "Approving…" : "Approve"}
                    </button>
                  </div>

                  {/* Merge into existing */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={pendingMergeTarget[tag.id] ?? ""}
                      onChange={(e) => setPendingMergeTarget((prev) => ({ ...prev, [tag.id]: e.target.value }))}
                      className="px-2 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                    >
                      <option value="">— Merge into existing tag —</option>
                      {approvedTags.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} (T{t.tier})</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleMergeInto(tag)}
                      disabled={!pendingMergeTarget[tag.id] || pendingAction === tag.id + "merge"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                    >
                      <GitMerge size={11} />
                      {pendingAction === tag.id + "merge" ? "Merging…" : "Merge"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags…"
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
          />
        </div>
        <div className="flex rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid var(--border)" }}>
          {[null, 1, 2, 3].map((t) => (
            <button
              key={String(t)}
              onClick={() => setTierFilter(t)}
              className="px-3 py-2 text-xs font-semibold transition-all"
              style={{
                background: tierFilter === t ? "#c4426a" : "var(--card)",
                color: tierFilter === t ? "white" : "var(--muted-foreground)",
              }}
            >
              {t === null ? "All" : `Tier ${t}`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#c4426a" }}
        >
          <Plus size={14} /> Add Tag
        </button>
        {tags.length === 0 && (
          <button
            onClick={handleSeed}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shrink-0"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          >
            Seed Library
          </button>
        )}
      </div>

      {/* Add tag form */}
      {showAdd && (
        <div
          className="p-4 rounded-2xl mb-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>New Tag</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              placeholder="Tag name…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <select
              value={addTier}
              onChange={(e) => setAddTier(Number(e.target.value))}
              style={{ ...inputStyle, cursor: "pointer" }}
            >
              <option value={1}>Tier 1 — Subgenre</option>
              <option value={2}>Tier 2 — Trope</option>
              <option value={3}>Tier 3 — Content</option>
            </select>
            <input
              value={addDesc}
              onChange={(e) => setAddDesc(e.target.value)}
              placeholder="Description (optional)…"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleAdd}
              disabled={addLoading || !addName.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
              style={{ background: "#c4426a" }}
            >
              {addLoading ? "Adding…" : "Add"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        {filtered.length} of {approvedTags.length} approved tags
        {approvedTags.length === 0 && " — click \"Seed Library\" to load the initial tag set"}
      </p>

      {/* Tag list grouped by tier */}
      {([1, 2, 3] as const).map((tier) => {
        const tierTags = filtered.filter((t) => t.tier === tier);
        if (tierTags.length === 0) return null;
        const colors = TIER_COLORS[tier];
        return (
          <div key={tier} className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: colors.bg, color: colors.color, border: `1px solid ${colors.border}` }}
              >
                Tier {tier} — {colors.label}
              </span>
              <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tierTags.length} tags</span>
            </div>
            <div className="space-y-2">
              {tierTags.map((tag) => {
                const isEditing = editId === tag.id;
                const isExpanded = expandedId === tag.id;
                return (
                  <div
                    key={tag.id}
                    className="rounded-xl overflow-hidden"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-center gap-3 px-4 py-3">
                      {isEditing ? (
                        <>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <select
                            value={editTier}
                            onChange={(e) => setEditTier(Number(e.target.value))}
                            style={{ ...inputStyle, cursor: "pointer" }}
                          >
                            <option value={1}>Tier 1</option>
                            <option value={2}>Tier 2</option>
                            <option value={3}>Tier 3</option>
                          </select>
                          <input
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Description…"
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            onClick={() => handleSave(tag.id)}
                            disabled={saving === tag.id}
                            className="text-green-500 hover:opacity-75 transition-opacity"
                          >
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditId(null)} className="opacity-50 hover:opacity-100 transition-opacity">
                            <X size={16} style={{ color: "var(--muted-foreground)" }} />
                          </button>
                        </>
                      ) : (
                        <>
                          <Tag size={14} style={{ color: colors.color, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                              {tag.name}
                            </span>
                            <span className="text-xs ml-2" style={{ color: "var(--muted-foreground)" }}>
                              /{tag.slug}
                            </span>
                            {!tag.isApproved && (
                              <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                                hidden
                              </span>
                            )}
                            {tag.aliases.length > 0 && (
                              <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                                +{tag.aliases.length} alias{tag.aliases.length > 1 ? "es" : ""}
                              </span>
                            )}
                          </div>
                          <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
                            {tag._count.stories} stories
                          </span>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : tag.id)}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                          >
                            {isExpanded
                              ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
                              : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
                          </button>
                          <button
                            onClick={() => { setEditId(tag.id); setEditName(tag.name); setEditTier(tag.tier); setEditDesc(tag.description ?? ""); }}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <Edit2 size={14} style={{ color: "var(--muted-foreground)" }} />
                          </button>
                          <button
                            onClick={() => handleToggleApprove(tag)}
                            title={tag.isApproved ? "Hide from authors" : "Show to authors"}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                          >
                            {tag.isApproved
                              ? <Check size={14} className="text-green-500" />
                              : <X size={14} className="text-red-400" />}
                          </button>
                          <button
                            onClick={() => handleDelete(tag.id, tag.name)}
                            className="opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </>
                      )}
                    </div>

                    {isExpanded && !isEditing && (
                      <div className="px-4 pb-4 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
                        {tag.description && (
                          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{tag.description}</p>
                        )}
                        <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                          Aliases (auto-redirect synonyms)
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {tag.aliases.map((a) => (
                            <span
                              key={a.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                            >
                              {a.alias}
                              <button
                                onClick={() => handleRemoveAlias(tag.id, a.id)}
                                className="opacity-60 hover:opacity-100"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))}
                          {tag.aliases.length === 0 && (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>None yet</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={newAlias[tag.id] ?? ""}
                            onChange={(e) => setNewAlias((prev) => ({ ...prev, [tag.id]: e.target.value }))}
                            placeholder="e.g. billionares"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAlias(tag.id); } }}
                            style={{ ...inputStyle, flex: 1 }}
                          />
                          <button
                            onClick={() => handleAddAlias(tag.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
                          >
                            <Plus size={11} /> Add alias
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && tags.length > 0 && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Tag size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p style={{ color: "var(--muted-foreground)" }}>No tags match your search.</p>
        </div>
      )}
    </div>
  );
}
