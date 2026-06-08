"use client";

import React, { useState, useMemo } from "react";
import { Search, Plus, Trash2, Edit2, Check, X, Tag, ChevronDown, ChevronUp, GitMerge, Layers } from "lucide-react";
import { TagSearchPicker } from "./TagSearchPicker";

interface TagAlias { id: string; alias: string; }
interface TagRef { id: string; name: string; slug: string; }
interface ParentRelation { id: string; parent: TagRef; }
interface ChildRelation { id: string; child: TagRef; }
interface AdminTag {
  id: string;
  name: string;
  slug: string;
  tier: number;
  description: string | null;
  isApproved: boolean;
  _count: { stories: number };
  aliases: TagAlias[];
  parentRelations: ParentRelation[];
  childRelations: ChildRelation[];
}

interface Props {
  initialTags: AdminTag[];
  allTags: AdminTag[];
}

const TIER_COLORS: Record<number, { bg: string; border: string; color: string; label: string }> = {
  1: { bg: "rgba(99,102,241,0.1)", border: "rgba(99,102,241,0.3)", color: "#6366f1", label: "Subgenre" },
  2: { bg: "rgba(196,66,106,0.1)", border: "rgba(196,66,106,0.3)", color: "#c4426a", label: "Trope" },
  3: { bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.3)", color: "#f59e0b", label: "Content" },
};

function slugifyDisplay(slug: string) {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function AdminTagsClient({ initialTags, allTags }: Props) {
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
  const [mergeTargetId, setMergeTargetId] = useState<Record<string, string>>({});

  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState("");
  const [addTier, setAddTier] = useState(2);
  const [addDesc, setAddDesc] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [showBulkMerge, setShowBulkMerge] = useState(false);
  const [bulkKeyword, setBulkKeyword] = useState("");
  const [bulkTargetId, setBulkTargetId] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  const [addParentId, setAddParentId] = useState<Record<string, string>>({});

  const filtered = useMemo(() => tags.filter((t) => {
    const matchSearch = !search.trim() || t.name.toLowerCase().includes(search.toLowerCase()) || t.slug.includes(search.toLowerCase());
    const matchTier = tierFilter === null || t.tier === tierFilter;
    return matchSearch && matchTier;
  }), [tags, search, tierFilter]);

  const bulkMatches = useMemo(() => {
    if (!bulkKeyword.trim()) return [];
    const kw = bulkKeyword.trim().toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(kw) && t.id !== bulkTargetId);
  }, [tags, bulkKeyword, bulkTargetId]);

  async function handleBulkMerge() {
    if (!bulkKeyword.trim() || !bulkTargetId || bulkMatches.length === 0) return;
    const target = tags.find((t) => t.id === bulkTargetId);
    if (!confirm(`Merge ${bulkMatches.length} tag${bulkMatches.length > 1 ? "s" : ""} into "${target?.name}"?\n\n${bulkMatches.map((t) => `• ${t.name}`).join("\n")}\n\nEach becomes an alias of "${target?.name}". This cannot be undone.`)) return;
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/tags/bulk-merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: bulkKeyword.trim(), targetTagId: bulkTargetId }),
      });
      const data = await res.json();
      if (res.ok) {
        const mergedIds = new Set(bulkMatches.map((t) => t.id));
        setTags((prev) => prev.filter((t) => !mergedIds.has(t.id)));
        setBulkKeyword("");
        setBulkTargetId("");
        setShowBulkMerge(false);
        alert(`Merged ${data.merged} tag${data.merged !== 1 ? "s" : ""} into "${data.targetName}".`);
      } else {
        alert(data.error ?? "Bulk merge failed");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setBulkLoading(false);
    }
  }

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
    try {
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
    } catch {
      alert("Network error — please try again");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleSave(id: string) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, tier: editTier, description: editDesc || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setTags((prev) => prev.map((t) => t.id === id ? { ...t, ...data, _count: t._count, aliases: t.aliases } : t));
        setEditId(null);
      } else {
        alert(data.error ?? "Error saving");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setSaving(null);
    }
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

  async function handleMerge(tag: AdminTag) {
    const targetId = mergeTargetId[tag.id];
    if (!targetId) return;
    const target = tags.find((t) => t.id === targetId);
    if (!confirm(`Merge "${tag.name}" into "${target?.name}"?\n\n"${tag.name}" becomes an alias of "${target?.name}". All ${tag._count.stories} stories are re-assigned. This cannot be undone.`)) return;
    setSaving(tag.id + "merge");
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mergeInto", targetTagId: targetId }),
      });
      if (res.ok) {
        setTags((prev) => prev.filter((t) => t.id !== tag.id));
        setExpandedId(null);
        setMergeTargetId((prev) => { const n = { ...prev }; delete n[tag.id]; return n; });
      } else {
        const d = await res.json();
        alert(d.error ?? "Error merging tag");
      }
    } catch {
      alert("Network error — please try again");
    } finally {
      setSaving(null);
    }
  }

  async function handleAddParent(tagId: string) {
    const parentId = addParentId[tagId];
    if (!parentId) return;
    const res = await fetch("/api/admin/tag-relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, childId: tagId }),
    });
    const data = await res.json();
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tagId
        ? { ...t, parentRelations: [...t.parentRelations, { id: data.id, parent: data.parent }] }
        : t));
      setAddParentId((prev) => ({ ...prev, [tagId]: "" }));
    } else {
      alert(data.error ?? "Error adding parent");
    }
  }

  async function handleRemoveParent(tagId: string, relId: string) {
    const res = await fetch(`/api/admin/tag-relationships/${relId}`, { method: "DELETE" });
    if (res.ok) {
      setTags((prev) => prev.map((t) => t.id === tagId
        ? { ...t, parentRelations: t.parentRelations.filter((r) => r.id !== relId) }
        : t));
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
        <button
          onClick={() => setShowBulkMerge(!showBulkMerge)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold shrink-0 transition-all"
          style={{
            background: showBulkMerge ? "rgba(99,102,241,0.15)" : "var(--card)",
            border: `1px solid ${showBulkMerge ? "rgba(99,102,241,0.5)" : "var(--border)"}`,
            color: showBulkMerge ? "#6366f1" : "var(--muted-foreground)",
          }}
        >
          <Layers size={14} /> Bulk Merge
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

      {/* Bulk merge panel */}
      {showBulkMerge && (
        <div
          className="p-4 rounded-2xl mb-6"
          style={{ background: "var(--card)", border: "1px solid rgba(99,102,241,0.35)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "#6366f1" }}>Bulk Merge by Keyword</p>
          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
            Every approved tag whose name contains the keyword will be merged into the target tag — each becomes an alias and its stories are re-assigned. Irreversible.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input
                value={bulkKeyword}
                onChange={(e) => setBulkKeyword(e.target.value)}
                placeholder="Keyword to match tag names…"
                style={{ ...inputStyle, paddingLeft: "30px", width: "100%" }}
              />
            </div>
            <div className="flex-1">
              <TagSearchPicker
                options={tags}
                excludeId=""
                value={bulkTargetId}
                onChange={setBulkTargetId}
                placeholder="Merge all matches into…"
              />
            </div>
          </div>

          {/* Live preview */}
          {bulkKeyword.trim() && (
            <div
              className="rounded-xl p-3 mb-4"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            >
              {bulkMatches.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>No tags match &ldquo;{bulkKeyword}&rdquo;</p>
              ) : (
                <>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                    {bulkMatches.length} tag{bulkMatches.length !== 1 ? "s" : ""} will be merged:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {bulkMatches.map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                        style={{
                          background: TIER_COLORS[t.tier]?.bg,
                          color: TIER_COLORS[t.tier]?.color,
                          border: `1px solid ${TIER_COLORS[t.tier]?.border}`,
                        }}
                      >
                        {t.name}
                        <span style={{ opacity: 0.6 }}>· {t._count.stories}</span>
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowBulkMerge(false); setBulkKeyword(""); setBulkTargetId(""); }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: "var(--muted-foreground)" }}
            >
              Cancel
            </button>
            <button
              onClick={handleBulkMerge}
              disabled={bulkLoading || bulkMatches.length === 0 || !bulkTargetId}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all"
              style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.4)" }}
            >
              <GitMerge size={12} />
              {bulkLoading
                ? "Merging…"
                : bulkMatches.length > 0
                  ? `Merge ${bulkMatches.length} tag${bulkMatches.length !== 1 ? "s" : ""}`
                  : "Merge"}
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
        {filtered.length} of {tags.length} tags
        {tags.length === 0 && ' — click "Seed Library" to load the initial tag set'}
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
                      <div className="px-4 pb-4 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                        {tag.description && (
                          <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{tag.description}</p>
                        )}

                        {/* Aliases */}
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
                              {slugifyDisplay(a.alias)}
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
                        <div className="flex gap-2 mb-5">
                          <input
                            value={newAlias[tag.id] ?? ""}
                            onChange={(e) => setNewAlias((prev) => ({ ...prev, [tag.id]: e.target.value }))}
                            placeholder="e.g. billionaires"
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAlias(tag.id); } }}
                            style={{ ...inputStyle, flex: 1, fontSize: "12px", padding: "5px 10px" }}
                          />
                          <button
                            onClick={() => handleAddAlias(tag.id)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
                          >
                            <Plus size={11} /> Add alias
                          </button>
                        </div>

                        {/* Parent Tags section */}
                        <div className="pt-4 mb-5" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                            Parent Tags
                          </p>
                          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                            This tag appears under these parents on the tag list page.
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {tag.parentRelations.map((r) => (
                              <span
                                key={r.id}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                              >
                                {r.parent.name}
                                <button
                                  onClick={() => handleRemoveParent(tag.id, r.id)}
                                  className="opacity-60 hover:opacity-100"
                                  title="Remove parent"
                                >
                                  <X size={10} />
                                </button>
                              </span>
                            ))}
                            {tag.parentRelations.length === 0 && (
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>None — standalone tag</span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <TagSearchPicker
                                options={allTags.filter((t) => t.id !== tag.id && !tag.parentRelations.some((r) => r.parent.id === t.id))}
                                excludeId={tag.id}
                                value={addParentId[tag.id] ?? ""}
                                onChange={(id) => setAddParentId((prev) => ({ ...prev, [tag.id]: id }))}
                                placeholder="Search tags to add as parent…"
                              />
                            </div>
                            <button
                              onClick={() => handleAddParent(tag.id)}
                              disabled={!addParentId[tag.id]}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all shrink-0"
                              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                            >
                              <Plus size={11} /> Add Parent
                            </button>
                          </div>
                        </div>

                        {/* Child Tags section */}
                        {tag.childRelations.length > 0 && (
                          <div className="pb-4 mb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                            <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted-foreground)" }}>
                              Child Tags ({tag.childRelations.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {tag.childRelations.map((r) => (
                                <span
                                  key={r.id}
                                  className="px-2 py-0.5 rounded-full text-xs"
                                  style={{ background: "rgba(196,66,106,0.08)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
                                >
                                  {r.child.name}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Merge section */}
                        <div className="pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                          <p className="text-xs font-semibold mb-1" style={{ color: "var(--muted-foreground)" }}>
                            Merge into another tag
                          </p>
                          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
                            &ldquo;{tag.name}&rdquo; becomes an alias of the target. All {tag._count.stories} stories re-assigned. Irreversible.
                          </p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <TagSearchPicker
                              options={tags}
                              excludeId={tag.id}
                              value={mergeTargetId[tag.id] ?? ""}
                              onChange={(id) => setMergeTargetId((prev) => ({ ...prev, [tag.id]: id }))}
                              placeholder="Search tags to merge into…"
                            />
                            <button
                              onClick={() => handleMerge(tag)}
                              disabled={!mergeTargetId[tag.id] || saving === tag.id + "merge"}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all hover:opacity-90 shrink-0"
                              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                            >
                              <GitMerge size={12} />
                              {saving === tag.id + "merge" ? "Merging…" : "Merge"}
                            </button>
                          </div>
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
