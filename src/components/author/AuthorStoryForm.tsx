"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StoryEditor } from "@/components/admin/StoryEditor";
import { CoverImageUpload } from "@/components/admin/CoverImageUpload";
import { TierTagSelector, type TagEntry } from "@/components/author/TierTagSelector";
import { TagRequestModal } from "@/components/author/TagRequestModal";
import {
  Save, Send, AlertTriangle, ChevronDown, ChevronUp,
  BookOpen, Tag, Info,
} from "lucide-react";
import { FieldInfo } from "@/components/ui/FieldInfo";
import { calculateReadingTime } from "@/lib/utils";
import { SeriesCombobox } from "@/components/series/SeriesCombobox";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";

const CONTENT_WARNINGS = [
  "Non-con", "Dubcon", "Age Gap", "BDSM", "Cheating",
  "Dark Themes", "Violence", "Humiliation", "Forced", "Power Dynamics",
];
const MATURITY_RATINGS = ["Mild", "Explicit", "Hardcore"] as const;
const POV_OPTIONS = ["First Person", "Second Person", "Third Person"] as const;
const GENDER_PAIRINGS = ["M/F", "M/M", "F/F", "M/F/M", "F/M/F", "Multiple", "Other"] as const;
const LANGUAGES = ["English", "Spanish", "French", "German", "Portuguese", "Italian", "Other"] as const;

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

function parseJsonArray(s: string): string[] {
  try { return JSON.parse(s); } catch { return []; }
}

interface Category { id: string; name: string; color: string; }

interface AuthorStoryFormProps {
  categories: Category[];
  availableTags: TagEntry[];
  authorId: string;
  initialData?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    tagIds: string[];
    categoryIds: string[];
    readingTime: number;
    series: string | null;
    seriesId: string | null;
    chapterNumber: number | null;
    language: string;
    pov: string;
    genderPairing: string | null;
    contentWarnings: string;
    maturityRating: string;
    authorNote: string | null;
    status: string;
    rejectionReason: string | null;
    coinPrice?: number | null;
    hasUnlocks?: boolean;
  };
}

function Panel({
  title, icon: Icon, defaultOpen = false, allowOverflow = false, children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  allowOverflow?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div
      className={`rounded-2xl${allowOverflow ? "" : " overflow-hidden"}`}
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          <Icon size={14} style={{ color: "#c4426a" }} />
          {title}
        </span>
        {open
          ? <ChevronUp size={14} style={{ color: "var(--muted-foreground)" }} />
          : <ChevronDown size={14} style={{ color: "var(--muted-foreground)" }} />}
      </button>
      {open && <div className="p-4">{children}</div>}
    </div>
  );
}

const inputStyle = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "10px",
  fontSize: "14px",
  width: "100%",
  padding: "8px 12px",
};
const labelStyle = {
  display: "flex",
  alignItems: "center",
  gap: "5px",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted-foreground)",
  marginBottom: "6px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

export function AuthorStoryForm({ categories, availableTags, authorId, initialData }: AuthorStoryFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;
  const isPending = initialData?.status === "pending";
  const isRejected = initialData?.status === "rejected";
  const isPriceLocked = !!(initialData?.hasUnlocks && initialData?.coinPrice != null);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!initialData?.slug);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [coverImage, setCoverImage] = useState<string | null>(initialData?.coverImage ?? null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds ?? []);
  const [tagRequestModal, setTagRequestModal] = useState<{ name: string; tier: number } | null>(null);
  const [tagRequestSuccess, setTagRequestSuccess] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>(initialData?.categoryIds ?? []);
  const [readingTime, setReadingTime] = useState(initialData?.readingTime ?? 5);
  const [maturityRating, setMaturityRating] = useState(initialData?.maturityRating ?? "Explicit");
  const [coinPrice, setCoinPrice] = useState(
    (initialData as { coinPrice?: number | null } | undefined)?.coinPrice != null
      ? String((initialData as { coinPrice?: number | null }).coinPrice)
      : ""
  );
  const [accessLevel, setAccessLevel] = useState(
    (initialData as { coinPrice?: number | null } | undefined)?.coinPrice != null ? "Premium" : "Free"
  );
  const [contentWarnings, setContentWarnings] = useState<string[]>(
    parseJsonArray(initialData?.contentWarnings ?? "[]")
  );
  const [language, setLanguage] = useState(initialData?.language ?? "English");
  const [pov, setPov] = useState(initialData?.pov ?? "Third Person");
  const [genderPairing, setGenderPairing] = useState(initialData?.genderPairing ?? "");
  const [series, setSeries] = useState(initialData?.series ?? "");
  const [seriesId, setSeriesId] = useState<string | null>(initialData?.seriesId ?? null);
  const [chapterNumber, setChapterNumber] = useState(initialData?.chapterNumber?.toString() ?? "");
  const [authorNote, setAuthorNote] = useState(initialData?.authorNote ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slugEdited && title) setSlug(slugify(title));
  }, [title, slugEdited]);

  useEffect(() => {
    setReadingTime(calculateReadingTime(content));
  }, [content]);

  function toggleWarning(w: string) {
    setContentWarnings((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  }

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function buildBody(action: "draft" | "submit") {
    return {
      title,
      slug,
      excerpt,
      content,
      coverImage,
      tagIds: selectedTagIds,
      categoryIds,
      readingTime,
      maturityRating,
      contentWarnings: JSON.stringify(contentWarnings),
      language,
      pov,
      genderPairing: genderPairing || null,
      series: series || null,
      seriesId: seriesId || null,
      chapterNumber: chapterNumber ? parseInt(chapterNumber) : null,
      authorNote: authorNote || null,
      accessLevel,
      coinPrice: accessLevel === "Premium" && coinPrice ? parseInt(coinPrice, 10) : null,
      action,
    };
  }

  function validate() {
    if (!title.trim()) return "Title is required";
    if (!slug.trim()) return "Slug is required";
    if (!excerpt.trim()) return "Excerpt is required";
    if (!content || content === "<p></p>") return "Content is required";
    if (categoryIds.length === 0) return "Select at least one category";
    return null;
  }

  async function save(action: "draft" | "submit") {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setError("");

    const setter = action === "submit" ? setIsSubmitting : setIsSaving;
    setter(true);

    try {
      const url = isEditing
        ? `/api/author/stories/${initialData!.id}`
        : "/api/author/stories";
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(action)),
      });

      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Something went wrong");
        return;
      }

      const story = await res.json();
      if (action === "submit") {
        router.push("/author-dashboard");
        router.refresh();
      } else if (!isEditing) {
        router.push(`/author-dashboard/stories/${story.id}/edit`);
      } else {
        router.refresh();
      }
    } finally {
      setter(false);
    }
  }

  if (isPending) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-4">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6"
          style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
        >
          Pending Review
        </div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {initialData?.title}
        </h2>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          This story has been submitted and is waiting for admin review. You cannot edit it while it&apos;s pending.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
      {/* Left column — main content */}
      <div className="space-y-5">
        {/* Rejection banner */}
        {isRejected && initialData?.rejectionReason && (
          <div
            className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}
          >
            <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
            <div>
              <p className="text-sm font-semibold mb-1" style={{ color: "#ef4444" }}>Story Rejected</p>
              <p className="text-sm" style={{ color: "var(--foreground)" }}>
                {initialData.rejectionReason}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
                Revise your story and submit again.
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div>
            <label style={labelStyle}>Title * <FieldInfo text="Your story's public title shown in listings, cards, and search results. Make it evocative, specific, and memorable." /></label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your story title…"
              style={{ ...inputStyle, fontSize: "18px", fontFamily: "var(--font-playfair), serif" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Slug * <FieldInfo text="The URL path for your story: /stories/[slug]. Auto-generated from your title — customise only if needed. Lowercase letters, numbers, and hyphens." /></label>
            <div className="flex items-center gap-2">
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
                placeholder="story-url-slug"
                style={{ ...inputStyle, fontFamily: "monospace", fontSize: "13px" }}
              />
              <button
                type="button"
                onClick={() => { setSlug(slugify(title)); setSlugEdited(false); }}
                className="shrink-0 px-3 py-2 text-xs rounded-lg transition-opacity hover:opacity-75"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                Reset
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Excerpt / Teaser * <FieldInfo text="A short hook (1–3 sentences) shown in story cards and search results. This is your best chance to grab a reader's attention before they click." /></label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="A short hook that appears in story cards…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Content editor */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 pt-4 pb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
              Story Content *
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              ~{readingTime} min read
            </span>
          </div>
          <StoryEditor content={content} onChange={setContent} />
        </div>

        {/* Series (optional) */}
        <Panel title="Series" icon={BookOpen} defaultOpen={false} allowOverflow={true}>
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
        </Panel>

        {/* Author Note */}
        <Panel title="Author's Note" icon={Info} defaultOpen={false} allowOverflow={true}>
          <textarea
            value={authorNote}
            onChange={(e) => setAuthorNote(e.target.value)}
            rows={3}
            placeholder="A personal note for your readers…"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </Panel>
      </div>

      {/* Right column — sidebar */}
      <div className="space-y-4">
        {/* Action buttons */}
        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            {isEditing ? (isRejected ? "Revise & Resubmit" : "Save Changes") : "Publish Story"}
          </p>

          {error && (
            <p className="text-xs p-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => save("submit")}
            disabled={isSubmitting || isSaving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#c4426a" }}
          >
            <Send size={15} />
            {isSubmitting ? "Submitting…" : isRejected ? "Resubmit for Review" : "Submit for Review"}
          </button>

          <button
            type="button"
            onClick={() => save("draft")}
            disabled={isSaving || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-75 disabled:opacity-50"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            <Save size={14} />
            {isSaving ? "Saving…" : "Save as Draft"}
          </button>

          <p className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
            Submitted stories are reviewed by our team before publishing.
          </p>
        </div>

        {/* Cover image */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <label style={{ ...labelStyle, marginBottom: "10px" }}>Cover Image <FieldInfo text="Your story's main visual, shown in listing cards and at the top of the story page. Recommended: 800×1200px portrait, JPG or PNG." /></label>
          <CoverImageUpload value={coverImage ?? ""} onChange={setCoverImage} signUrl="/api/author/upload/sign" />
        </div>

        {/* Categories */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <label style={{ ...labelStyle, marginBottom: "8px" }}>Categories * <FieldInfo text="Broad genre labels for your story (e.g. Romance, Thriller). Select all that apply — readers use these to browse the site." /></label>

          <div
            className="flex flex-wrap gap-1.5 p-2.5 rounded-xl min-h-[44px]"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
          >
            {categories.map((cat) => {
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
        </div>

        {/* Tags */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <label style={{ ...labelStyle, marginBottom: "10px" }}>
            <Tag size={11} className="inline mr-1" />
            Tags
            <FieldInfo text="Specific descriptors that help readers find your story (e.g. 'enemies to lovers', 'slow burn'). Choose from approved tags or request new ones." />
          </label>
          {tagRequestSuccess && (
            <p
              className="text-xs px-3 py-2 rounded-lg mb-3"
              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
            >
              {tagRequestSuccess}
            </p>
          )}
          <TierTagSelector
            availableTags={availableTags}
            value={selectedTagIds}
            onChange={setSelectedTagIds}
            onRequestTag={(name, tier) => setTagRequestModal({ name, tier })}
          />
        </div>

        {/* Content details */}
        <Panel title="Content Details" icon={BookOpen} defaultOpen={true} allowOverflow={true}>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Maturity Rating <FieldInfo text="Mild: sensual but not graphically explicit. Explicit: full sexual content. Hardcore: very graphic adult content with extreme themes." /></label>
              <div className="flex gap-2">
                {MATURITY_RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMaturityRating(r)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: maturityRating === r ? "rgba(196,66,106,0.2)" : "var(--muted)",
                      color: maturityRating === r ? "#c4426a" : "var(--muted-foreground)",
                      border: maturityRating === r ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {seriesId ? (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
              >
                <BookOpen size={14} className="shrink-0 mt-0.5" style={{ color: "#c4426a" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  <span className="font-semibold" style={{ color: "#c4426a" }}>Series story</span> — premium pricing is managed
                  at the series level. Set the price and free chapters in your{" "}
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>Series Settings</span>{" "}
                  on the author dashboard.
                </p>
              </div>
            ) : PAYMENTS_ENABLED ? (
              <>
                <div>
                  <label style={labelStyle}>Access Level <FieldInfo text="Free: anyone can read your story at no cost. Premium: readers spend coins to unlock it. You earn 80% of every coin spent on your work." /></label>
                  <div className="flex gap-2">
                    {(["Free", "Premium"] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => {
                          setAccessLevel(l);
                          if (l === "Free") setCoinPrice("");
                        }}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: accessLevel === l ? "rgba(196,66,106,0.2)" : "var(--muted)",
                          color: accessLevel === l ? "#c4426a" : "var(--muted-foreground)",
                          border: accessLevel === l ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {accessLevel === "Premium" && (
                  <div>
                    <label style={labelStyle}>Coin Price * <FieldInfo text="How many coins readers pay to unlock your story. 1 coin ≈ $1. You earn 80% of each purchase. Cannot be changed once readers have unlocked it." /></label>
                    {isPriceLocked ? (
                      <div
                        className="w-full px-3 py-2 rounded-xl text-sm flex items-center justify-between"
                        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", opacity: 0.75 }}
                      >
                        <span>{coinPrice} coins</span>
                        <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(234,179,8,0.15)", color: "#eab308" }}>
                          Locked — readers have purchased
                        </span>
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={1}
                        max={9999}
                        value={coinPrice}
                        onChange={(e) => setCoinPrice(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 rounded-xl text-sm"
                        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                      />
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      Readers pay this many coins to unlock. 1 coin = $1. You earn 80% of each unlock.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div
                className="flex items-start gap-2.5 p-3 rounded-xl"
                style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
              >
                <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#c4426a" }} />
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  <span className="font-semibold" style={{ color: "#c4426a" }}>Premium content coming soon</span> — all stories are free for now.
                  Paid access will be available once our payment system is configured.
                </p>
              </div>
            )}

            <div>
              <label style={labelStyle}>Content Warnings <FieldInfo text="Flag specific content types so readers can decide what they're comfortable with. Recommended for non-consent, BDSM, age gap, and dark themes." /></label>
              <div className="flex flex-wrap gap-1.5">
                {CONTENT_WARNINGS.map((w) => {
                  const active = contentWarnings.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => toggleWarning(w)}
                      className="px-2 py-0.5 rounded-full text-xs transition-all"
                      style={{
                        background: active ? "rgba(234,179,8,0.15)" : "var(--muted)",
                        color: active ? "#eab308" : "var(--muted-foreground)",
                        border: active ? "1px solid rgba(234,179,8,0.4)" : "1px solid transparent",
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </Panel>

        {/* Classification */}
        <Panel title="Classification" icon={Info} defaultOpen={false} allowOverflow={true}>
          <div className="space-y-3">
            <div>
              <label style={labelStyle}>Language <FieldInfo text="The primary language your story is written in. Helps readers find content in their preferred language." /></label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Point of View <FieldInfo text="First Person (I/me), Second Person (you), or Third Person (he/she/they). Describes how the narrator addresses the reader." /></label>
              <select
                value={pov}
                onChange={(e) => setPov(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                {POV_OPTIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Gender Pairing <FieldInfo text="The genders of the main romantic or sexual pairing. Helps readers filter content for the pairings they enjoy most." /></label>
              <select
                value={genderPairing}
                onChange={(e) => setGenderPairing(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option value="">— Select —</option>
                {GENDER_PAIRINGS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </Panel>
      </div>

      {tagRequestModal && (
        <TagRequestModal
          initialName={tagRequestModal.name}
          initialTier={tagRequestModal.tier}
          onClose={() => setTagRequestModal(null)}
          onSuccess={(msg) => { setTagRequestSuccess(msg); setTagRequestModal(null); }}
        />
      )}
    </div>
  );
}
