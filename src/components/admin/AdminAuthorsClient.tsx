"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Edit2, Trash2, Check, X, ExternalLink, BookOpen, Coins } from "lucide-react";

interface Author {
  id: string;
  name: string;
  slug: string;
  bio: string | null;
  image: string | null;
  website: string | null;
  coinEarnings: number;
  createdAt: string;
  _count: { stories: number };
  user: { email: string } | null;
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

const EMPTY = { name: "", slug: "", bio: "", image: "", website: "" };

export function AdminAuthorsClient({ initial }: { initial: Author[] }) {
  const [authors, setAuthors] = useState<Author[]>(initial);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY);
  const [editForm, setEditForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ── Create ────────────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!createForm.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/authors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, slug: createForm.slug || makeSlug(createForm.name) }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to create"); return; }
    setAuthors((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setCreating(false);
    setCreateForm(EMPTY);
  }

  // ── Edit ──────────────────────────────────────────────────────────────────
  function startEdit(a: Author) {
    setEditingId(a.id);
    setEditForm({ name: a.name, slug: a.slug, bio: a.bio ?? "", image: a.image ?? "", website: a.website ?? "" });
    setError("");
  }

  async function handleUpdate(id: string) {
    if (!editForm.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const res = await fetch(`/api/admin/authors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Failed to update"); return; }
    setAuthors((prev) => prev.map((a) => (a.id === id ? data : a)).sort((a, b) => a.name.localeCompare(b.name)));
    setEditingId(null);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(a: Author) {
    if (!confirm(`Delete author "${a.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/authors/${a.id}`, { method: "DELETE" });
    if (!res.ok) { const d = await res.json(); setError(d.error || "Delete failed"); return; }
    setAuthors((prev) => prev.filter((x) => x.id !== a.id));
  }

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div
          className="flex items-start justify-between gap-3 p-3 rounded-xl text-sm"
          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
        >
          <span>{error}</span>
          <button type="button" onClick={() => setError("")} className="shrink-0 opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Create form / button */}
      {creating ? (
        <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>New Author</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Name *</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value, slug: makeSlug(e.target.value) }))}
                placeholder="Jane Doe"
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
                placeholder="jane-doe"
                className="w-full px-3 py-2 rounded-xl text-sm font-mono"
                style={INPUT}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Bio</label>
              <textarea
                value={createForm.bio}
                onChange={(e) => setCreateForm((p) => ({ ...p, bio: e.target.value }))}
                placeholder="Short author bio…"
                rows={2}
                className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                style={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Profile Image URL</label>
              <input
                type="url"
                value={createForm.image}
                onChange={(e) => setCreateForm((p) => ({ ...p, image: e.target.value }))}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Website</label>
              <input
                type="url"
                value={createForm.website}
                onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
                placeholder="https://…"
                className="w-full px-3 py-2 rounded-xl text-sm"
                style={INPUT}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setCreating(false); setCreateForm(EMPTY); setError(""); }}
              className="px-4 py-2 rounded-xl text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#c4426a", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Creating…" : "Create Author"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => { setCreating(true); setError(""); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#c4426a" }}
        >
          <Plus size={15} /> New Author
        </button>
      )}

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {authors.length === 0 ? (
          <p className="p-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
            No authors yet — create one above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Author", "Slug", "Stories", "Earnings", "Linked Email", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {authors.map((author) =>
                  editingId === author.id ? (
                    <tr key={author.id} style={{ borderBottom: "1px solid var(--border)", background: "rgba(196,66,106,0.03)" }}>
                      <td className="px-4 py-4" colSpan={6}>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                            placeholder="Name *"
                            className="px-3 py-1.5 rounded-lg text-sm"
                            style={INPUT}
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editForm.slug}
                            onChange={(e) => setEditForm((p) => ({ ...p, slug: e.target.value }))}
                            placeholder="slug"
                            className="px-3 py-1.5 rounded-lg text-sm font-mono"
                            style={INPUT}
                          />
                          <textarea
                            value={editForm.bio}
                            onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                            placeholder="Bio"
                            rows={2}
                            className="col-span-2 px-3 py-1.5 rounded-lg text-sm resize-none"
                            style={INPUT}
                          />
                          <input
                            type="url"
                            value={editForm.image}
                            onChange={(e) => setEditForm((p) => ({ ...p, image: e.target.value }))}
                            placeholder="Profile image URL"
                            className="px-3 py-1.5 rounded-lg text-sm"
                            style={INPUT}
                          />
                          <input
                            type="url"
                            value={editForm.website}
                            onChange={(e) => setEditForm((p) => ({ ...p, website: e.target.value }))}
                            placeholder="Website URL"
                            className="px-3 py-1.5 rounded-lg text-sm"
                            style={INPUT}
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            <X size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdate(author.id)}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: "#c4426a", opacity: saving ? 0.6 : 1 }}
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={author.id} className="hover:opacity-90 transition-opacity" style={{ borderBottom: "1px solid var(--border)" }}>
                      {/* Author */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {author.image ? (
                            <img
                              src={author.image}
                              alt={author.name}
                              className="w-8 h-8 rounded-full object-cover shrink-0"
                              onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                              style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}
                            >
                              {author.name[0].toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate" style={{ color: "var(--foreground)" }}>{author.name}</p>
                            {author.bio && (
                              <p className="text-xs line-clamp-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>{author.bio}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Slug */}
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {author.slug}
                      </td>
                      {/* Stories */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <BookOpen size={11} /> {author._count.stories}
                        </span>
                      </td>
                      {/* Earnings */}
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: author.coinEarnings > 0 ? "#f59e0b" : "var(--muted-foreground)" }}>
                          <Coins size={11} /> {author.coinEarnings}
                        </span>
                      </td>
                      {/* Linked email */}
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {author.user?.email ?? <span className="opacity-40">—</span>}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/authors/${author.slug}`}
                            target="_blank"
                            title="View public profile"
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            <ExternalLink size={13} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => startEdit(author)}
                            title="Edit"
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
                            style={{ color: "#c4426a" }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(author)}
                            title="Delete"
                            className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
                            style={{ color: "var(--muted-foreground)" }}
                          >
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
