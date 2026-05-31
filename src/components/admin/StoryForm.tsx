"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoryEditor } from "./StoryEditor";
import { StoryScorePanel } from "./StoryScorePanel";
import { CoverImageUpload } from "./CoverImageUpload";
import { TierTagSelector, type TagEntry, type CustomTag } from "@/components/author/TierTagSelector";
import {
  Save, ChevronDown, ChevronUp, Star, MessageSquare,
  Lock, Search, BookOpen, Eye, Heart, Bookmark, Plus, X,
} from "lucide-react";
import { FieldInfo } from "@/components/ui/FieldInfo";
import { calculateReadingTime } from "@/lib/utils";
import { SeriesCombobox } from "@/components/series/SeriesCombobox";

const CONTENT_WARNINGS = [
  "Non-con", "Dubcon", "Age Gap", "BDSM", "Cheating",
  "Dark Themes", "Violence", "Humiliation", "Forced", "Power Dynamics",
];
const MATURITY_RATINGS = ["Mild", "Explicit", "Hardcore"] as const;
const ACCESS_LEVELS = ["Free", "Premium"] as const;
const VISIBILITIES = ["Public", "Unlisted", "Members Only"] as const;
const POV_OPTIONS = ["First Person", "Second Person", "Third Person"] as const;
const GENDER_PAIRINGS = ["M/F", "M/M", "F/F", "M/F/M", "F/M/F", "Multiple", "Other"] as const;
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Japanese", "Other"] as const;

function parseJsonArray(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

interface Category { id: string; name: string; }
interface Author { id: string; name: string; }

interface StoryFormProps {
  categories: Category[];
  authors: Author[];
  availableTags: TagEntry[];
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    published: boolean;
    featured: boolean;
    tagIds?: string[];
    customTags?: CustomTag[];
    categoryIds: string[];
    authorId: string;
    readingTime: number;
    views: number;
    series: string | null;
    seriesId: string | null;
    chapterNumber: number | null;
    language: string;
    pov: string;
    genderPairing: string | null;
    contentWarnings: string;
    maturityRating: string;
    accessLevel: string;
    scheduledAt: Date | null;
    visibility: string;
    commentsEnabled: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    canonicalUrl: string | null;
    noIndex: boolean;
    authorNote: string | null;
    adminNotes: string | null;
    _count?: { likes: number; comments: number; bookmarks: number };
  };
}

function deriveStatus(d?: StoryFormProps["initialData"]): "draft" | "scheduled" | "published" {
  if (!d) return "draft";
  if (d.published) return "published";
  if (d.scheduledAt) return "scheduled";
  return "draft";
}

function Panel({
  title, icon: Icon, defaultOpen = false, children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          <Icon size={15} style={{ color: "#c4426a" }} />
          {title}
        </span>
        {open
          ? <ChevronUp size={15} style={{ color: "var(--muted-foreground)" }} />
          : <ChevronDown size={15} style={{ color: "var(--muted-foreground)" }} />}
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-colors shrink-0"
      style={{ background: checked ? "#c4426a" : "var(--muted)" }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
        style={{ left: checked ? "calc(100% - 1.125rem)" : "0.125rem" }}
      />
    </button>
  );
}

export function StoryForm({ categories, authors, availableTags, initialData }: StoryFormProps) {
  const router = useRouter();
  const isEditing = !!initialData;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialData?.coverImage ?? "");
  const [featured, setFeatured] = useState(initialData?.featured ?? false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [customTags, setCustomTags] = useState<CustomTag[]>(initialData?.customTags ?? []);
  const [localCategories, setLocalCategories] = useState(categories);
  const [categoryIds, setCategoryIds] = useState<string[]>(
    initialData?.categoryIds ?? (categories[0] ? [categories[0].id] : [])
  );
  const [authorId, setAuthorId] = useState(initialData?.authorId ?? authors[0]?.id ?? "");

  function handleAuthorChange(id: string) {
    setAuthorId(id);
    setSeriesId(null);
    setSeries("");
    setChapterNumber("");
  }

  const [showCatForm, setShowCatForm] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#c4426a");
  const [newCatSaving, setNewCatSaving] = useState(false);
  const [newCatError, setNewCatError] = useState("");

  const [status, setStatus] = useState<"draft" | "scheduled" | "published">(deriveStatus(initialData));
  const [scheduledAt, setScheduledAt] = useState(
    initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [visibility, setVisibility] = useState(initialData?.visibility ?? "Public");
  const [commentsEnabled, setCommentsEnabled] = useState(initialData?.commentsEnabled ?? true);

  const [series, setSeries] = useState(initialData?.series ?? "");
  const [seriesId, setSeriesId] = useState<string | null>(initialData?.seriesId ?? null);
  const [chapterNumber, setChapterNumber] = useState(
    initialData?.chapterNumber != null ? String(initialData.chapterNumber) : ""
  );

  const [language, setLanguage] = useState(initialData?.language ?? "English");
  const [pov, setPov] = useState(initialData?.pov ?? "Third Person");
  const [genderPairing, setGenderPairing] = useState(initialData?.genderPairing ?? "");
  const [maturityRating, setMaturityRating] = useState(initialData?.maturityRating ?? "Explicit");
  const [accessLevel, setAccessLevel] = useState(initialData?.accessLevel ?? "Free");
  const [coinPrice, setCoinPrice] = useState(
    (initialData as { coinPrice?: number | null } | undefined)?.coinPrice != null
      ? String((initialData as { coinPrice?: number | null }).coinPrice)
      : ""
  );
  const [contentWarnings, setContentWarnings] = useState<string[]>(
    initialData?.contentWarnings ? parseJsonArray(initialData.contentWarnings) : []
  );

  const [metaTitle, setMetaTitle] = useState(initialData?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialData?.metaDescription ?? "");
  const [canonicalUrl, setCanonicalUrl] = useState(initialData?.canonicalUrl ?? "");
  const [noIndex, setNoIndex] = useState(initialData?.noIndex ?? false);

  const [authorNote, setAuthorNote] = useState(initialData?.authorNote ?? "");
  const [adminNotes, setAdminNotes] = useState(initialData?.adminNotes ?? "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function handleCreateCategory() {
    if (!newCatName.trim()) return;
    setNewCatSaving(true);
    setNewCatError("");
    const slug = newCatName.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName.trim(), slug, color: newCatColor }),
    });
    const cat = await res.json();
    setNewCatSaving(false);
    if (!res.ok) { setNewCatError(cat.error || "Failed to create"); return; }
    setLocalCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
    setCategoryIds((prev) => [...prev, cat.id]);
    setShowCatForm(false);
    setNewCatName("");
    setNewCatColor("#c4426a");
  }

  function generateSlug(t: string) {
    return t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
  }

  function handleTitleChange(v: string) {
    setTitle(v);
    if (!isEditing) setSlug(generateSlug(v));
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleWarning(w: string) {
    setContentWarnings((prev) => prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !excerpt || !content || categoryIds.length === 0 || !authorId) {
      setError("Please fill in all required fields.");
      return;
    }
    if (status === "scheduled" && !scheduledAt) {
      setError("Please set a scheduled publish date.");
      return;
    }

    setLoading(true);
    setError("");

    const body = {
      title,
      slug: slug || generateSlug(title),
      excerpt,
      content,
      coverImage: coverImage || null,
      published: status === "published",
      scheduledAt: status === "scheduled" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      featured,
      commentsEnabled,
      tagIds: selectedTagIds,
      newTagNames: customTags,
      categoryIds,
      authorId,
      readingTime: calculateReadingTime(content),
      series: series || null,
      seriesId: seriesId || null,
      chapterNumber: chapterNumber ? parseInt(chapterNumber, 10) : null,
      language,
      pov,
      genderPairing: genderPairing || null,
      contentWarnings: JSON.stringify(contentWarnings),
      maturityRating,
      accessLevel,
      coinPrice: coinPrice ? parseInt(coinPrice, 10) : null,
      visibility,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      canonicalUrl: canonicalUrl || null,
      noIndex,
      authorNote: authorNote || null,
      adminNotes: adminNotes || null,
    };

    try {
      const url = isEditing ? `/api/admin/stories/${initialData.id}` : "/api/admin/stories";
      const res = await fetch(url, {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save story.");
        return;
      }

      router.push("/meminhaj/stories");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "var(--foreground)",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontSize: "0.875rem",
    fontWeight: 500,
    marginBottom: "0.375rem",
  };

  const segmentBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "#c4426a" : "transparent",
    color: active ? "#fff" : "var(--muted-foreground)",
  });

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl h-64" style={{ background: "var(--card)" }} />
          <div className="rounded-2xl h-80" style={{ background: "var(--card)" }} />
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl h-56" style={{ background: "var(--card)" }} />
          <div className="rounded-2xl h-48" style={{ background: "var(--card)" }} />
        </div>
      </div>
    );
  }

  const scoreInput = {
    title, slug, excerpt, content, coverImage,
    tags: [
      ...availableTags.filter(t => selectedTagIds.includes(t.id)).map(t => t.name),
      ...customTags.map(t => t.name),
    ].join(", "),
    categoryIds, metaTitle, metaDescription, canonicalUrl, noIndex,
    genderPairing, pov, contentWarnings, maturityRating,
    series, authorNote, status, visibility,
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div
          className="p-3 rounded-xl mb-6 text-sm"
          style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ===== MAIN CONTENT ===== */}
        <div className="lg:col-span-2 space-y-6">

          {/* Core fields */}
          <div className="rounded-2xl p-6 space-y-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div>
              <label style={labelStyle}>Title * <FieldInfo text="The public-facing story title shown in listings, cards, and search results. Make it evocative and memorable." /></label>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Story title"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Slug <FieldInfo text="The URL path for this story, e.g. /stories/my-title. Auto-generated from the title. Use lowercase letters, numbers, and hyphens only." /></label>
              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <span
                  className="px-3 py-2.5 text-sm shrink-0"
                  style={{ background: "var(--background)", color: "var(--muted-foreground)", borderRight: "1px solid var(--border)" }}
                >
                  /stories/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                  className="flex-1 px-4 py-2.5 text-sm font-mono"
                  style={{ background: "var(--muted)", color: "var(--foreground)", outline: "none", border: "none" }}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>
                Excerpt / Blurb *
                <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>
                  ({excerpt.length} chars — used as default meta description)
                </span>
                <FieldInfo text="A 1–3 sentence hook shown in story cards and search results, and used as the default meta description. Hook the reader immediately." />
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A compelling teaser shown on listing pages and search results"
                required
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Story content */}
          <div>
            <label style={{ ...labelStyle, marginBottom: "0.5rem" }}>Story Content * <FieldInfo text="The full text of the story. Use the rich editor for headings, bold, italic, block quotes, images, and other formatting." /></label>
            <StoryEditor content={content} onChange={setContent} />
          </div>

          {/* Author's Note */}
          <Panel title="Author's Note" icon={BookOpen}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Shown to readers alongside the story. Use for acknowledgements, context, or a message to your audience.
            </p>
            <textarea
              value={authorNote}
              onChange={(e) => setAuthorNote(e.target.value)}
              placeholder="Write a note to your readers…"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              style={inputStyle}
            />
          </Panel>

          {/* SEO */}
          <Panel title="SEO" icon={Search}>
            <div>
              <label style={labelStyle}>
                Meta Title
                <span
                  className="text-xs font-normal"
                  style={{ color: metaTitle.length > 60 ? "#c4426a" : "var(--muted-foreground)" }}
                >
                  {metaTitle.length}/60
                </span>
                <FieldInfo text="Custom title shown in browser tabs and search engine results. Defaults to the story title if left blank. Keep under 60 characters." />
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder="Defaults to story title"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>
                Meta Description
                <span
                  className="text-xs font-normal"
                  style={{ color: metaDescription.length > 160 ? "#c4426a" : "var(--muted-foreground)" }}
                >
                  {metaDescription.length}/160
                </span>
                <FieldInfo text="Custom snippet shown in search engine results pages. Defaults to the excerpt if left blank. Keep under 160 characters." />
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                placeholder="Defaults to excerpt"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Canonical URL <FieldInfo text="If this story was originally published elsewhere, paste the original URL here to prevent duplicate-content penalties in search engines." /></label>
              <input
                type="url"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                placeholder="https://… (if cross-posted from another site)"
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>No Index</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  Prevent search engines from indexing this page
                </p>
              </div>
              <Toggle checked={noIndex} onChange={() => setNoIndex(!noIndex)} />
            </label>
          </Panel>

          {/* Admin Notes */}
          <Panel title="Admin Notes (Private)" icon={Lock}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Internal notes not visible to readers. For moderation, sourcing, or editorial context.
            </p>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Private notes visible only to admins…"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl text-sm resize-none"
              style={inputStyle}
            />
          </Panel>
        </div>

        {/* ===== SIDEBAR ===== */}
        <div className="space-y-5">

          {/* Publish Settings */}
          <Card title="Publish Settings">
            <div>
              <label style={labelStyle}>Status <FieldInfo text="Draft: saved but not live. Scheduled: publishes automatically at a chosen date and time. Published: immediately visible to readers." /></label>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: "var(--muted)" }}>
                {(["draft", "scheduled", "published"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className="py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                    style={segmentBtn(status === s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {status === "scheduled" && (
              <div>
                <label style={labelStyle}>Publish Date & Time <FieldInfo text="The story will go live automatically at this date and time (server time). Must be set when status is Scheduled." /></label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                />
              </div>
            )}

            <div>
              <label style={labelStyle}>Visibility <FieldInfo text="Public: visible to everyone. Unlisted: accessible only via direct link, not shown in listings. Members Only: requires a registered account to view." /></label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                {VISIBILITIES.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="pt-2 space-y-3" style={{ borderTop: "1px solid var(--border)" }}>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <Star size={14} style={{ color: featured ? "#c4426a" : "var(--muted-foreground)" }} />
                  Featured
                </span>
                <Toggle checked={featured} onChange={() => setFeatured(!featured)} />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <MessageSquare size={14} style={{ color: commentsEnabled ? "#c4426a" : "var(--muted-foreground)" }} />
                  Comments enabled
                </span>
                <Toggle checked={commentsEnabled} onChange={() => setCommentsEnabled(!commentsEnabled)} />
              </label>
            </div>
          </Card>

          {/* Classification */}
          <Card title="Classification">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label style={{ ...labelStyle, marginBottom: 0 }}>Categories * <FieldInfo text="Broad genre labels (e.g. Romance, Thriller). A story needs at least one. Readers use these to browse and filter content." /></label>
                <button
                  type="button"
                  onClick={() => { setShowCatForm((v) => !v); setNewCatError(""); }}
                  title="Add new category"
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors"
                  style={{
                    background: showCatForm ? "rgba(196,66,106,0.15)" : "var(--muted)",
                    border: "1px solid var(--border)",
                    color: showCatForm ? "#c4426a" : "var(--muted-foreground)",
                  }}
                >
                  {showCatForm ? <X size={12} /> : <Plus size={12} />}
                  {showCatForm ? "Cancel" : "New"}
                </button>
              </div>
              <div
                className="flex flex-wrap gap-1.5 p-2.5 rounded-xl min-h-[48px]"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              >
                {localCategories.map((cat) => {
                  const active = categoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? "rgba(196,66,106,0.2)" : "var(--background)",
                        color: active ? "#c4426a" : "var(--muted-foreground)",
                        border: active ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                      }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
              {categoryIds.length === 0 && (
                <p className="text-xs mt-1" style={{ color: "#ef4444" }}>Select at least one category</p>
              )}

              {showCatForm && (
                <div className="mt-2 p-3 rounded-xl space-y-2"
                  style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  {newCatError && (
                    <p className="text-xs" style={{ color: "#ef4444" }}>{newCatError}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                      placeholder="Category name"
                      className="flex-1 px-3 py-2 rounded-lg text-sm"
                      style={inputStyle}
                      autoFocus
                    />
                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      title="Accent color"
                      className="w-10 h-10 rounded-lg cursor-pointer shrink-0"
                      style={{ border: "1px solid var(--border)", padding: "2px", background: "transparent" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={newCatSaving || !newCatName.trim()}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-opacity disabled:opacity-50"
                      style={{ background: "#c4426a" }}
                    >
                      {newCatSaving ? "Adding…" : "Add Category"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCatForm(false); setNewCatName(""); setNewCatError(""); }}
                      className="px-3 py-2 rounded-lg text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Author * <FieldInfo text="The author this story is attributed to. Changing the author also resets the series picker, since series belong to specific authors." /></label>
              <select
                value={authorId}
                onChange={(e) => handleAuthorChange(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ ...labelStyle, marginBottom: "0.625rem" }}>Tags <FieldInfo text="Search the tag library, or type a new tag name to add it as pending review." /></label>
              <TierTagSelector
                availableTags={availableTags}
                value={selectedTagIds}
                onChange={setSelectedTagIds}
                allowFreeForm
                showTierSections={false}
                showPendingBadge
                customTags={customTags}
                onAddCustomTag={(name, tier) => {
                  if (!customTags.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
                    setCustomTags((prev) => [...prev, { name, tier }]);
                  }
                }}
                onRemoveCustomTag={(name) =>
                  setCustomTags((prev) => prev.filter((t) => t.name !== name))
                }
              />
            </div>
            <SeriesCombobox
              selectedSeries={seriesId && series ? { id: seriesId, name: series } : null}
              chapterNumber={chapterNumber}
              authorId={authorId}
              onSeriesChange={(s) => {
                setSeriesId(s?.id ?? null);
                setSeries(s?.name ?? "");
              }}
              onChapterChange={setChapterNumber}
              inputStyle={inputStyle}
              labelStyle={labelStyle}
            />
          </Card>

          {/* Content Details */}
          <Card title="Content Details">
            <div>
              <label style={labelStyle}>Cover Image <FieldInfo text="The main visual for this story, shown in listing cards and at the top of the story page. Recommended: 800×1200px portrait, JPG or PNG." /></label>
              <CoverImageUpload value={coverImage} onChange={setCoverImage} />
            </div>
            <div>
              <label style={labelStyle}>Maturity Rating <FieldInfo text="Mild: sensual but not graphically explicit. Explicit: full sexual content. Hardcore: very graphic adult content including extreme themes." /></label>
              <div className="grid grid-cols-3 gap-1 rounded-xl p-1" style={{ background: "var(--muted)" }}>
                {MATURITY_RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMaturityRating(r)}
                    className="py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={segmentBtn(maturityRating === r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {seriesId ? (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  This story belongs to a series — premium pricing is managed at the series level via{" "}
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>Series Settings</span>.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Access Level <FieldInfo text="Free: any visitor can read. Premium: readers spend coins to unlock — set a coin price below. Series pricing overrides this setting." /></label>
                  <div className="grid grid-cols-2 gap-1 rounded-xl p-1" style={{ background: "var(--muted)" }}>
                    {ACCESS_LEVELS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          setAccessLevel(l);
                          if (l === "Free") setCoinPrice("");
                        }}
                        className="py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={segmentBtn(accessLevel === l)}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {accessLevel === "Premium" && (
                  <div>
                    <label style={labelStyle}>Coin Price * <FieldInfo text="How many coins a reader spends to unlock this story. 1 coin ≈ $1. Earnings split: 80% to the author, 20% to the platform." /></label>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={coinPrice}
                      onChange={(e) => setCoinPrice(e.target.value)}
                      placeholder="e.g. 10"
                      className="w-full px-4 py-2.5 rounded-xl text-sm"
                      style={inputStyle}
                    />
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Readers spend this many coins to unlock. 1 coin = $1.
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Language <FieldInfo text="The primary language this story is written in. Used for filtering and to help non-English readers find content." /></label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>POV <FieldInfo text="Point of view: First Person (I/me), Second Person (you), or Third Person (he/she/they). Describes how the narrator relates to the story." /></label>
                <select
                  value={pov}
                  onChange={(e) => setPov(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm"
                  style={inputStyle}
                >
                  {POV_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Gender Pairing <FieldInfo text="The genders of the main romantic or sexual pairing (e.g. M/F, M/M). Helps readers filter content and find what they prefer." /></label>
              <select
                value={genderPairing}
                onChange={(e) => setGenderPairing(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm"
                style={inputStyle}
              >
                <option value="">— Select —</option>
                {GENDER_PAIRINGS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Content Warnings <FieldInfo text="Flag specific content types so readers can make informed choices before reading. Strongly recommended for non-consent, BDSM, age gap, and dark themes." /></label>
              <div className="flex flex-wrap gap-1.5">
                {CONTENT_WARNINGS.map((w) => {
                  const active = contentWarnings.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWarning(w)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? "rgba(196,66,106,0.2)" : "var(--muted)",
                        color: active ? "#c4426a" : "var(--muted-foreground)",
                        border: active ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Stats (edit mode only) */}
          {isEditing && initialData && (
            <Card title="Statistics">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Views", value: initialData.views, Icon: Eye },
                  { label: "Likes", value: initialData._count?.likes ?? 0, Icon: Heart },
                  { label: "Comments", value: initialData._count?.comments ?? 0, Icon: MessageSquare },
                  { label: "Bookmarks", value: initialData._count?.bookmarks ?? 0, Icon: Bookmark },
                ].map(({ label, value, Icon }) => (
                  <div key={label} className="p-3 rounded-xl text-center" style={{ background: "var(--muted)" }}>
                    <Icon size={16} style={{ color: "#c4426a", margin: "0 auto 4px" }} />
                    <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{value.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                ~{initialData.readingTime} min read
              </p>
            </Card>
          )}

          {/* Real-time score */}
          <StoryScorePanel input={scoreInput} />

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
            style={{ background: "#c4426a" }}
          >
            <Save size={16} />
            {loading ? "Saving…" : isEditing ? "Update Story" : "Create Story"}
          </button>
        </div>
      </div>
    </form>
  );
}
