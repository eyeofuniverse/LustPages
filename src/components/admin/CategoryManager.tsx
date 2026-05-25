"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  _count: { stories: number };
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

export function CategoryManager({ initial }: { initial: Category[] }) {
  const [categories, setCategories] = useState<Category[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY);
  const [editForm, setEditForm] = useState({ name: "", slug: "", description: "", color: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sorted = (arr: Category[]) => [...arr].sort((a, b) => a.name.localeCompare(b.name));

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
      setError(`Cannot delete "${cat.name}": ${cat._count.stories} ${cat._count.stories === 1 ? "story uses" : "stories use"} it. Reassign them first.`);
      return;
    }
    if (!confirm(`Delete "${cat.name}"?`)) return;
    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-start justify-between gap-3 p-3 rounded-xl text-sm"
          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Create form / button */}
      {creating ? (
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
      ) : (
        <button type="button" onClick={() => { setCreating(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#c4426a" }}>
          <Plus size={15} /> New Category
        </button>
      )}

      {/* Table */}
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
