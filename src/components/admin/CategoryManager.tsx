"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Edit2, Trash2, Check, X, GitMerge, ListChecks, Search, Loader2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  _count: { stories: number };
}

interface StoryRow {
  id: string;
  title: string;
  inCategory: boolean;
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

const INPUT: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  outline: "none",
};

const EMPTY = { name: "", slug: "", description: "", color: "#c4426a" };

type ActiveTool = "merge" | "bulk" | null;

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", color: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Tools
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  // Merge state
  const [mergeSrc, setMergeSrc] = useState("");
  const [mergeDst, setMergeDst] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

  // Bulk assign state
  const [bulkCatId, setBulkCatId] = useState("");
  const [bulkStories, setBulkStories] = useState<StoryRow[]>([]);
  const [bulkOriginal, setBulkOriginal] = useState<Set<string>>(new Set());
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkSearch, setBulkSearch] = useState("");
  const [bulkFetching, setBulkFetching] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  const sorted = (arr: Category[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name));

  function openTool(tool: ActiveTool) {
    setActiveTool((prev) => (prev === tool ? null : tool));
    setError("");
    setMergeSrc(""); setMergeDst("");
    setBulkCatId(""); setBulkStories([]); setBulkSearch("");
    setBulkSelected(new Set()); setBulkOriginal(new Set());
  }

  useEffect(() => {
    if (!bulkCatId) return;
    setBulkFetching(true);
    setBulkStories([]);
    fetch(`/api/admin/categories/${bulkCatId}/stories`)
      .then((r) => r.json())
      .then((data: StoryRow[]) => {
        setBulkStories(data);
        const inCat = new Set(data.filter((s) => s.inCategory).map((s) => s.id));
        setBulkOriginal(inCat);
        setBulkSelected(new Set(inCat));
      })
      .finally(() => setBulkFetching(false));
  }, [bulkCatId]);

  const mergeSourceCat = categories.find((c) => c.id === mergeSrc);
  const filteredBulkStories = useMemo(() => {
    if (!bulkSearch.trim()) return bulkStories;
    const q = bulkSearch.toLowerCase();
    return bulkStories.filter((s) => s.title.toLowerCase().includes(q));
  }, [bulkStories, bulkSearch]);

  async function handleMerge() {
    if (!mergeSrc || !mergeDst || mergeSrc === mergeDst) return;
    const srcName = categories.find((c) => c.id === mergeSrc)?.name;
    const dstName = categories.find((c) => c.id === mergeDst)?.name;
    if (!confirm(`Move all stories from "${srcName}" into "${dstName}" and permanently delete "${srcName}"?`)) return;
    setMergeLoading(true); setError("");
    try {
      const res = await fetch(`/api/admin/categories/${mergeSrc}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: mergeDst }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Merge failed."); return; }
      setCategories((prev) =>
        sorted(prev.filter((c) => c.id !== mergeSrc).map((c) => (c.id === mergeDst ? data.category : c)))
      );
      setActiveTool(null);
    } catch {
      setError("Network error.");
    } finally {
      setMergeLoading(false);
    }
  }

  async function handleBulkSave() {
    if (!bulkCatId) return;
    const add = [...bulkSelected].filter((id) => !bulkOriginal.has(id));
    const remove = [...bulkOriginal].filter((id) => !bulkSelected.has(id));
    if (!add.length && !remove.length) { setActiveTool(null); return; }
    setBulkSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/categories/${bulkCatId}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ add, remove }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      setCategories((prev) => sorted(prev.map((c) => (c.id === bulkCatId ? data.category : c))));
      setActiveTool(null);
    } catch {
      setError("Network error.");
    } finally {
      setBulkSaving(false);
    }
  }

  async function handleCreate() {
    if (!createForm.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, slug: createForm.slug || makeSlug(createForm.name) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to create"); return; }
    setCategories((prev) => sorted([...prev, data]));
    setCreating(false);
    setCreateForm(EMPTY);
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", color: cat.color });
    setError("");
  }

  async function handleUpdate(id: string) {
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to update"); return; }
    setCategories((prev) => sorted(prev.map((c) => (c.id === id ? data : c))));
    setEditingId(null);
  }

  async function handleDelete(cat: Category) {
    if (cat._count.stories > 0) {
      setError(`Cannot delete "${cat.name}": ${cat._count.stories} ${cat._count.stories === 1 ? "story uses" : "stories use"} it. Use "Merge Categories" or reassign them first.`);
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }

  const bulkAddCount = [...bulkSelected].filter((id) => !bulkOriginal.has(id)).length;
  const bulkRemoveCount = [...bulkOriginal].filter((id) => !bulkSelected.has(id)).length;

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl text-sm"
          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap gap-2">
        {!creating && (
          <button type="button" onClick={() => { setCreating(true); setActiveTool(null); setError(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}>
            <Plus size={15} /> New Category
          </button>
        )}
        <button
          type="button"
          onClick={() => openTool("merge")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: activeTool === "merge" ? "rgba(99,102,241,0.15)" : "var(--card)",
            border: "1px solid var(--border)",
            color: activeTool === "merge" ? "#6366f1" : "var(--foreground)",
          }}
        >
          <GitMerge size={15} /> Merge Categories
        </button>
        <button
          type="button"
          onClick={() => openTool("bulk")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: activeTool === "bulk" ? "rgba(34,197,94,0.12)" : "var(--card)",
            border: "1px solid var(--border)",
            color: activeTool === "bulk" ? "#22c55e" : "var(--foreground)",
          }}
        >
          <ListChecks size={15} /> Bulk Assign Stories
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>New Category</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Name *</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value, slug: makeSlug(e.target.value) }))}
                placeholder="Romance"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Slug</label>
              <input
                type="text"
                value={createForm.slug}
                onChange={(e) => setCreateForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="romance"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Description</label>
              <input
                type="text"
                value={createForm.description}
                onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional description shown on category page"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
              />
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--foreground)" }}>
              <input
                type="color"
                value={createForm.color}
                onChange={(e) => setCreateForm((p) => ({ ...p, color: e.target.value }))}
                className="w-8 h-8 rounded-lg cursor-pointer"
                style={{ border: "2px solid var(--border)", padding: 0 }}
              />
              Accent color
            </label>
            <div className="flex gap-2 ml-auto">
              <button type="button" onClick={() => { setCreating(false); setCreateForm(EMPTY); setError(""); }}
                className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted-foreground)" }}>
                Cancel
              </button>
              <button type="button" onClick={handleCreate} disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#c4426a", opacity: saving ? 0.6 : 1 }}>
                {saving ? "Creating…" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge tool panel */}
      {activeTool === "merge" && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Merge Categories</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Moves all stories from one category into another, then permanently deletes the source category.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>From (will be deleted)</label>
              <select
                value={mergeSrc}
                onChange={(e) => { setMergeSrc(e.target.value); if (e.target.value === mergeDst) setMergeDst(""); }}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
              >
                <option value="">Select source…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c._count.stories} stories)</option>
                ))}
              </select>
            </div>
            <div className="text-center pb-2 text-lg" style={{ color: "var(--muted-foreground)" }}>→</div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Into (keeps all stories)</label>
              <select
                value={mergeDst}
                onChange={(e) => setMergeDst(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
              >
                <option value="">Select target…</option>
                {categories.filter((c) => c.id !== mergeSrc).map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c._count.stories} stories)</option>
                ))}
              </select>
            </div>
          </div>
          {mergeSrc && mergeDst && (
            <div className="p-3 rounded-xl text-xs"
              style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", color: "var(--muted-foreground)" }}>
              <strong style={{ color: "#eab308" }}>Warning:</strong>{" "}
              {mergeSourceCat?._count.stories} {mergeSourceCat?._count.stories === 1 ? "story" : "stories"} from{" "}
              <strong style={{ color: "var(--foreground)" }}>{mergeSourceCat?.name}</strong> will be added to{" "}
              <strong style={{ color: "var(--foreground)" }}>{categories.find((c) => c.id === mergeDst)?.name}</strong>.{" "}
              The <strong style={{ color: "var(--foreground)" }}>{mergeSourceCat?.name}</strong> category will be permanently deleted.
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setActiveTool(null)}
              className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted-foreground)" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMerge}
              disabled={!mergeSrc || !mergeDst || mergeSrc === mergeDst || mergeLoading}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#6366f1", opacity: (!mergeSrc || !mergeDst || mergeLoading) ? 0.5 : 1 }}
            >
              {mergeLoading ? "Merging…" : "Merge & Delete Source"}
            </button>
          </div>
        </div>
      )}

      {/* Bulk assign panel */}
      {activeTool === "bulk" && (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Bulk Assign Stories to Category</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Check stories to add them to a category. Uncheck to remove. Stories already in the category are pre-checked.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Category</label>
            <select
              value={bulkCatId}
              onChange={(e) => { setBulkCatId(e.target.value); setBulkSearch(""); }}
              className="w-full px-3 py-2 rounded-xl text-sm"
              style={INPUT}
            >
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c._count.stories} stories)</option>
              ))}
            </select>
          </div>

          {bulkFetching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={20} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
            </div>
          )}

          {!bulkFetching && bulkStories.length > 0 && (
            <>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  value={bulkSearch}
                  onChange={(e) => setBulkSearch(e.target.value)}
                  placeholder="Search stories…"
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-sm"
                  style={INPUT}
                />
              </div>
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                <span>{bulkSelected.size} / {bulkStories.length} selected</span>
                {(bulkAddCount > 0 || bulkRemoveCount > 0) && (
                  <span style={{ color: "#6366f1" }}>
                    {bulkAddCount > 0 && `+${bulkAddCount} to add`}
                    {bulkAddCount > 0 && bulkRemoveCount > 0 && " · "}
                    {bulkRemoveCount > 0 && `−${bulkRemoveCount} to remove`}
                  </span>
                )}
              </div>
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", maxHeight: 288, overflowY: "auto" }}>
                {filteredBulkStories.length === 0 ? (
                  <p className="p-4 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>No stories match.</p>
                ) : (
                  filteredBulkStories.map((story, i) => (
                    <label
                      key={story.id}
                      className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        borderBottom: i < filteredBulkStories.length - 1 ? "1px solid var(--border)" : undefined,
                        background: bulkSelected.has(story.id) ? "rgba(99,102,241,0.05)" : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSelected.has(story.id)}
                        onChange={(e) => {
                          setBulkSelected((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(story.id); else next.delete(story.id);
                            return next;
                          });
                        }}
                        className="rounded shrink-0"
                      />
                      <span className="text-sm" style={{ color: "var(--foreground)" }}>{story.title}</span>
                    </label>
                  ))
                )}
              </div>
            </>
          )}

          {!bulkFetching && bulkCatId && bulkStories.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>No stories found.</p>
          )}

          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setActiveTool(null)}
              className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted-foreground)" }}>
              Cancel
            </button>
            {bulkCatId && !bulkFetching && (
              <button
                type="button"
                onClick={handleBulkSave}
                disabled={bulkSaving || (bulkAddCount === 0 && bulkRemoveCount === 0)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "#22c55e", opacity: bulkSaving || (bulkAddCount === 0 && bulkRemoveCount === 0) ? 0.5 : 1 }}
              >
                {bulkSaving ? "Saving…" : `Save Changes${bulkAddCount + bulkRemoveCount > 0 ? ` (${bulkAddCount + bulkRemoveCount})` : ""}`}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            No categories yet — create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Category", "Slug", "Stories", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) =>
                  editingId === cat.id ? (
                    <tr key={cat.id} style={{ borderBottom: "1px solid var(--border)", background: "rgba(196,66,106,0.03)" }}>
                      <td className="px-4 py-3" colSpan={4}>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <input type="text" value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            className="px-3 py-1.5 rounded-lg text-sm" style={INPUT} placeholder="Name" autoFocus />
                          <input type="text" value={editForm.slug}
                            onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))}
                            className="px-3 py-1.5 rounded-lg text-sm font-mono" style={INPUT} placeholder="slug" />
                          <input type="text" value={editForm.description}
                            onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                            className="col-span-2 px-3 py-1.5 rounded-lg text-sm" style={INPUT} placeholder="Description (optional)" />
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--foreground)" }}>
                            <input type="color" value={editForm.color}
                              onChange={(e) => setEditForm((p) => ({ ...p, color: e.target.value }))}
                              className="w-7 h-7 rounded cursor-pointer" style={{ border: "2px solid var(--border)", padding: 0 }} />
                            Color
                          </label>
                          <div className="flex gap-2 ml-auto">
                            <button type="button" onClick={() => setEditingId(null)}
                              className="p-1.5 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
                              <X size={15} />
                            </button>
                            <button type="button" onClick={() => handleUpdate(cat.id)} disabled={saving}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                              style={{ background: "#c4426a", opacity: saving ? 0.6 : 1 }}>
                              <Check size={12} /> Save
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={cat.id} className="hover:opacity-90 transition-opacity"
                      style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                          <div>
                            <p className="font-medium" style={{ color: "var(--foreground)" }}>{cat.name}</p>
                            {cat.description && (
                              <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{cat.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{cat.slug}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {cat._count.stories}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => startEdit(cat)}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                            <Edit2 size={14} />
                          </button>
                          <button type="button" onClick={() => handleDelete(cat)}
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
