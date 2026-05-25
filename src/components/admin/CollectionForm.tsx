"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, Trash2, Plus, GripVertical, X, Info } from "lucide-react";

interface StoryEntry {
  id: string;
  position: number;
  editorialNote: string | null;
  story: {
    id: string;
    title: string;
    slug: string;
    author: { name: string };
    _count: { likes: number };
  };
}

interface Props {
  mode: "create" | "edit";
  collectionId?: string;
  initial?: {
    slug: string;
    title: string;
    description: string;
    metaDescription: string;
    coverImage: string;
    type: string;
    featured: boolean;
    published: boolean;
    sortOrder: number;
    stories: StoryEntry[];
  };
}

const inputStyle: React.CSSProperties = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "10px",
  fontSize: "14px",
  width: "100%",
  padding: "8px 12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted-foreground)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</h2>
      {children}
    </div>
  );
}

export function CollectionForm({ mode, collectionId, initial }: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [metaDescription, setMetaDescription] = useState(initial?.metaDescription ?? "");
  const [coverImage, setCoverImage] = useState(initial?.coverImage ?? "");
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [published, setPublished] = useState(initial?.published ?? true);
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));

  const [stories, setStories] = useState<StoryEntry[]>(initial?.stories ?? []);
  const [storySearch, setStorySearch] = useState("");
  const [searchResults, setSearchResults] = useState<StoryEntry["story"][]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Auto-slug from title on create
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!isEdit) {
      setSlug(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
    }
  };

  // Story search
  const searchStories = useCallback(async (q: string) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/stories?q=${encodeURIComponent(q)}&take=8`);
      const data = await res.json();
      const existing = new Set(stories.map((e) => e.story.id));
      setSearchResults((data.stories ?? []).filter((s: StoryEntry["story"]) => !existing.has(s.id)));
    } finally {
      setSearching(false);
    }
  }, [stories]);

  const addStory = async (story: StoryEntry["story"]) => {
    if (!collectionId) return;
    const res = await fetch(`/api/admin/collections/${collectionId}/stories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: story.id }),
    });
    if (res.ok) {
      const entry = await res.json();
      setStories((prev) => [...prev, { ...entry, story }]);
      setSearchResults((prev) => prev.filter((s) => s.id !== story.id));
      setStorySearch("");
    }
  };

  const removeStory = async (storyId: string) => {
    if (!collectionId) return;
    await fetch(`/api/admin/collections/${collectionId}/stories/${storyId}`, { method: "DELETE" });
    setStories((prev) => prev.filter((e) => e.story.id !== storyId));
  };

  const updateNote = async (storyId: string, note: string) => {
    if (!collectionId) return;
    await fetch(`/api/admin/collections/${collectionId}/stories/${storyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editorialNote: note }),
    });
    setStories((prev) => prev.map((e) => e.story.id === storyId ? { ...e, editorialNote: note } : e));
  };

  async function handleSave() {
    if (!slug || !title) { setError("Slug and title are required."); return; }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const payload = { slug, title, description, metaDescription, coverImage, featured, published, sortOrder: parseInt(sortOrder) || 0 };
      const res = isEdit
        ? await fetch(`/api/admin/collections/${collectionId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
        : await fetch("/api/admin/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
      if (!isEdit) {
        router.push(`/meminhaj/collections/${data.id}/edit`);
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!collectionId || !confirm("Delete this collection? Stories will not be deleted.")) return;
    setDeleting(true);
    await fetch(`/api/admin/collections/${collectionId}`, { method: "DELETE" });
    router.push("/meminhaj/collections");
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main settings */}
      <div className="lg:col-span-2 space-y-5">
        <Card title="Collection Info">
          <div>
            <label style={labelStyle}>Title *</label>
            <input value={title} onChange={(e) => handleTitleChange(e.target.value)} style={inputStyle} placeholder="Best BDSM Stories" />
          </div>
          <div>
            <label style={labelStyle}>Slug *</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} placeholder="best-bdsm-stories" />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
              URL: /collections/{slug || "…"}
            </p>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Editorial context shown on the collection page..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Meta Description (SEO)</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              placeholder="Up to 160 characters for search engines..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <p className="text-xs mt-1" style={{ color: metaDescription.length > 160 ? "#ef4444" : "var(--muted-foreground)" }}>
              {metaDescription.length}/160
            </p>
          </div>
          <div>
            <label style={labelStyle}>Cover Image URL</label>
            <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} style={inputStyle} placeholder="https://..." />
          </div>
        </Card>

        {/* Story management — only in edit mode after collection is created */}
        {isEdit && (
          <Card title={`Stories (${stories.length})`}>
            <div
              className="flex items-start gap-2 p-3 rounded-xl"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <Info size={13} className="shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Stories are shown in position order on the collection page. Add an editorial note to give context for each pick.
              </p>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                value={storySearch}
                onChange={(e) => { setStorySearch(e.target.value); searchStories(e.target.value); }}
                style={inputStyle}
                placeholder="Search stories to add..."
              />
              {searching && (
                <span className="absolute right-3 top-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Searching…
                </span>
              )}
              {searchResults.length > 0 && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-lg"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addStory(s)}
                      className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:opacity-75"
                      style={{ color: "var(--foreground)", borderBottom: "1px solid var(--border)" }}
                    >
                      <span className="font-medium">{s.title}</span>
                      <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>by {s.author.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Story list */}
            <div className="space-y-2">
              {stories.length === 0 && (
                <p className="text-sm text-center py-6" style={{ color: "var(--muted-foreground)" }}>
                  No stories yet. Search above to add some.
                </p>
              )}
              {stories.map((entry, idx) => (
                <div
                  key={entry.id}
                  className="rounded-xl p-3 space-y-2"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical size={14} style={{ color: "var(--muted-foreground)" }} className="shrink-0" />
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {entry.story.title}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        by {entry.story.author.name} · {entry.story._count.likes} likes
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeStory(entry.story.id)}
                      className="shrink-0 p-1 rounded-lg transition-opacity hover:opacity-75"
                      style={{ color: "#ef4444" }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <input
                    defaultValue={entry.editorialNote ?? ""}
                    onBlur={(e) => updateNote(entry.story.id, e.target.value)}
                    placeholder="Editorial note (optional)..."
                    className="text-xs"
                    style={{ ...inputStyle, fontSize: "12px", padding: "6px 10px" }}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isEdit && (
          <div
            className="flex items-start gap-2.5 p-4 rounded-2xl"
            style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <Plus size={14} className="shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Save the collection first, then you can add and reorder stories on the edit page.
            </p>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <Card title="Visibility">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Published</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Visible on /collections</p>
            </div>
            <button
              type="button"
              onClick={() => setPublished(!published)}
              className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: published ? "#c4426a" : "var(--muted)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: published ? "translateX(16px)" : "translateX(0)" }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Featured</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Shown first on index</p>
            </div>
            <button
              type="button"
              onClick={() => setFeatured(!featured)}
              className="relative w-10 h-6 rounded-full transition-colors"
              style={{ background: featured ? "#f59e0b" : "var(--muted)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
                style={{ transform: featured ? "translateX(16px)" : "translateX(0)" }}
              />
            </button>
          </div>

          <div>
            <label style={labelStyle}>Sort Order</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ ...inputStyle, width: "80px" }}
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Lower = shown first</p>
          </div>
        </Card>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
            {error}
          </p>
        )}
        {success && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
            Saved successfully.
          </p>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
          style={{ background: "#c4426a" }}
        >
          {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> {isEdit ? "Save Changes" : "Create Collection"}</>}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-75"
            style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <Trash2 size={13} /> Delete Collection
          </button>
        )}
      </div>
    </div>
  );
}
