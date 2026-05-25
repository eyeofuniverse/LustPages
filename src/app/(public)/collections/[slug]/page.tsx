import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getCollectionBySlug,
  getAutoCollectionStories,
  getCategoryCollectionMeta,
  getCategoryCollectionStories,
  getTagCollectionMeta,
  getTagCollectionStories,
} from "@/lib/queries";
import {
  AUTO_COLLECTIONS,
  AUTO_COLLECTION_SLUGS,
  getAutoCollection,
  isAutoCollection,
  isCategoryCollection,
  isTagCollection,
  getCategorySlugFromCollection,
  getTagSlugFromCollection,
  SECTION_META,
} from "@/lib/collections";
import { ShareButtons } from "@/components/story/ShareButtons";
import { CollectionStoryRow } from "@/components/story/CollectionStoryRow";
import type { CollectionStoryRowStory } from "@/components/story/CollectionStoryRow";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Heart,
  Star,
  Zap,
  TrendingUp,
  Eye,
  MessageCircle,
  Award,
  Gem,
  Rocket,
  Calendar,
  Tag,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
}

const SITE = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart size={15} />,
  "trending-up": <TrendingUp size={15} />,
  zap: <Zap size={15} />,
  eye: <Eye size={15} />,
  "message-circle": <MessageCircle size={15} />,
  star: <Star size={15} />,
  award: <Award size={15} />,
  gem: <Gem size={15} />,
  rocket: <Rocket size={15} />,
  clock: <Clock size={15} />,
  calendar: <Calendar size={15} />,
};

// Pre-build all 11 known auto-collections at deploy time for instant SEO serving
export async function generateStaticParams() {
  return AUTO_COLLECTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (isAutoCollection(slug)) {
    const auto = getAutoCollection(slug)!;
    const sectionLabel = SECTION_META[auto.section].label;
    return {
      title: `${auto.title} — LustPages`,
      description: auto.metaDescription,
      keywords: [
        auto.title.toLowerCase(),
        "best erotica",
        "top adult fiction",
        "free erotica stories",
        sectionLabel.toLowerCase(),
        "lustpages",
      ],
      alternates: { canonical: `${SITE}/collections/${slug}` },
      openGraph: {
        title: `${auto.title} — LustPages`,
        description: auto.metaDescription,
        url: `${SITE}/collections/${slug}`,
        type: "website",
        siteName: "LustPages",
      },
      twitter: {
        card: "summary_large_image",
        title: `${auto.title} — LustPages`,
        description: auto.metaDescription,
      },
    };
  }

  if (isCategoryCollection(slug)) {
    const catSlug = getCategorySlugFromCollection(slug);
    const category = await getCategoryCollectionMeta(catSlug);
    if (!category) return { title: "Collection Not Found" };
    const title = `Best ${category.name} Erotica Stories`;
    const desc = `The best ${category.name.toLowerCase()} adult fiction stories on LustPages, statistically ranked by thousands of reader ratings. Discover the highest-quality ${category.name.toLowerCase()} erotica.`;
    return {
      title: `${title} — LustPages`,
      description: desc,
      keywords: [
        `best ${category.name.toLowerCase()} erotica`,
        `top ${category.name.toLowerCase()} stories`,
        `${category.name.toLowerCase()} adult fiction`,
        `free ${category.name.toLowerCase()} erotica`,
        "lustpages",
      ],
      alternates: { canonical: `${SITE}/collections/${slug}` },
      openGraph: {
        title: `${title} — LustPages`,
        description: desc,
        url: `${SITE}/collections/${slug}`,
        type: "website",
        siteName: "LustPages",
      },
      twitter: { card: "summary_large_image", title: `${title} — LustPages`, description: desc },
    };
  }

  if (isTagCollection(slug)) {
    const tagSlug = getTagSlugFromCollection(slug);
    const tag = await getTagCollectionMeta(tagSlug);
    if (!tag) return { title: "Collection Not Found" };
    const title = `Best ${tag.name} Stories`;
    const desc = `Top-rated adult fiction stories tagged "${tag.name}" on LustPages, ranked by statistical confidence from reader ratings. Find the best ${tag.name.toLowerCase()} erotica.`;
    return {
      title: `${title} — LustPages`,
      description: desc,
      keywords: [
        `best ${tag.name.toLowerCase()} stories`,
        `${tag.name.toLowerCase()} erotica`,
        `${tag.name.toLowerCase()} adult fiction`,
        "lustpages",
      ],
      alternates: { canonical: `${SITE}/collections/${slug}` },
      openGraph: {
        title: `${title} — LustPages`,
        description: desc,
        url: `${SITE}/collections/${slug}`,
        type: "website",
        siteName: "LustPages",
      },
      twitter: { card: "summary_large_image", title: `${title} — LustPages`, description: desc },
    };
  }

  const col = await getCollectionBySlug(slug);
  if (!col) return { title: "Collection Not Found" };
  const desc = col.metaDescription ?? col.description ?? `${col.title} — a curated collection on LustPages.`;
  return {
    title: `${col.title} — LustPages Collections`,
    description: desc,
    keywords: [col.title.toLowerCase(), "curated erotica", "adult fiction collection", "lustpages"],
    alternates: { canonical: `${SITE}/collections/${slug}` },
    openGraph: {
      title: `${col.title} — LustPages`,
      description: desc,
      url: `${SITE}/collections/${slug}`,
      type: "website",
      siteName: "LustPages",
      ...(col.coverImage && { images: [{ url: col.coverImage, width: 1200, height: 630, alt: col.title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${col.title} — LustPages`,
      description: desc,
    },
  };
}

type StoryItem = CollectionStoryRowStory;
type CollectionKind = "auto" | "category" | "tag" | "editorial";

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;

  let title: string;
  let description: string;
  let updatedLabel: string;
  let kind: CollectionKind;
  let badgeLabel: string;
  let badgeIcon: React.ReactNode;
  let accentColor: string;
  let stories: StoryItem[];
  let editorialEntries: { id: string; position: number; editorialNote: string | null; story: StoryItem }[] = [];
  let sectionLabel: string | undefined;

  // ── Auto-collection ────────────────────────────────────────────────
  if (isAutoCollection(slug)) {
    const auto = getAutoCollection(slug)!;
    kind = "auto";
    title = auto.title;
    description = auto.description;
    updatedLabel = auto.refreshLabel;
    badgeLabel = "Live Ranking";
    badgeIcon = ICON_MAP[auto.icon] ?? <Zap size={15} />;
    accentColor = "#c4426a";
    sectionLabel = SECTION_META[auto.section].label;
    stories = (await getAutoCollectionStories(slug, 30)) as StoryItem[];
    editorialEntries = stories.map((s, i) => ({ id: s.id, position: i, editorialNote: null, story: s }));

  // ── Category collection ────────────────────────────────────────────
  } else if (isCategoryCollection(slug)) {
    const catSlug = getCategorySlugFromCollection(slug);
    const [category, catStories] = await Promise.all([
      getCategoryCollectionMeta(catSlug),
      getCategoryCollectionStories(catSlug, 30),
    ]);
    if (!category) notFound();
    kind = "category";
    title = `Best of ${category.name}`;
    description = `The top-rated ${category.name.toLowerCase()} adult fiction stories on LustPages, ranked by reader ratings using Wilson score confidence intervals. Only stories that consistently impress across many ratings appear here.`;
    updatedLabel = "Updated weekly";
    badgeLabel = category.name;
    badgeIcon = <FolderOpen size={15} />;
    accentColor = category.color ?? "#c4426a";
    stories = catStories as StoryItem[];
    editorialEntries = stories.map((s, i) => ({ id: s.id, position: i, editorialNote: null, story: s }));

  // ── Tag collection ─────────────────────────────────────────────────
  } else if (isTagCollection(slug)) {
    const tagSlug = getTagSlugFromCollection(slug);
    const [tag, tagStories] = await Promise.all([
      getTagCollectionMeta(tagSlug),
      getTagCollectionStories(tagSlug, 30),
    ]);
    if (!tag) notFound();
    kind = "tag";
    title = `Best ${tag.name} Stories`;
    description =
      tag.description ??
      `The highest-rated adult fiction stories tagged "${tag.name}" on LustPages, ranked by statistical confidence from reader ratings. Curated quality over popularity.`;
    updatedLabel = "Updated weekly";
    badgeLabel = tag.name;
    badgeIcon = <Tag size={15} />;
    accentColor = "#c4426a";
    stories = tagStories as StoryItem[];
    editorialEntries = stories.map((s, i) => ({ id: s.id, position: i, editorialNote: null, story: s }));

  // ── Editorial (DB) collection ──────────────────────────────────────
  } else {
    const col = await getCollectionBySlug(slug);
    if (!col) notFound();
    kind = "editorial";
    title = col.title;
    description = col.description ?? "";
    updatedLabel = `Updated ${formatDate(col.updatedAt)}`;
    badgeLabel = "Editorial Pick";
    badgeIcon = <Star size={15} />;
    accentColor = "#c4426a";
    editorialEntries = col.stories as typeof editorialEntries;
    stories = col.stories.map((e) => e.story) as StoryItem[];
  }

  // ── Stats ──────────────────────────────────────────────────────────
  const totalLikes = stories.reduce((s, st) => s + st._count.likes, 0);
  const totalReadTime = stories.reduce((s, st) => s + st.readingTime, 0);
  const avgRating =
    stories.filter((s) => s.ratingCount >= 3).length > 0
      ? stories.filter((s) => s.ratingCount >= 3).reduce((sum, s) => sum + s.ratingAvg, 0) /
        stories.filter((s) => s.ratingCount >= 3).length
      : null;

  // ── Related: up to 4 other auto-collections from a different section ─
  const relatedCollections =
    kind === "auto"
      ? AUTO_COLLECTIONS.filter((c) => c.slug !== slug && c.section !== getAutoCollection(slug)?.section).slice(0, 4)
      : AUTO_COLLECTIONS.filter((c) => c.section === "quality").slice(0, 4);

  // ── Structured data ────────────────────────────────────────────────
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    description,
    url: `${SITE}/collections/${slug}`,
    numberOfItems: stories.length,
    itemListElement: stories.slice(0, 15).map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE}/stories/${s.slug}`,
      name: s.title,
      author: { "@type": "Person", name: s.author.name },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE}/collections` },
      { "@type": "ListItem", position: 3, name: title, item: `${SITE}/collections/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      {/* ── Hero header ────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        {/* Decorative radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 80% 120% at 0% 50%, ${accentColor}12 0%, transparent 65%)`,
          }}
          aria-hidden="true"
        />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative">
          {/* Breadcrumb nav */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/" className="hover:opacity-75 transition-opacity">Home</Link>
            <ChevronRight size={12} />
            <Link href="/collections" className="hover:opacity-75 transition-opacity">Collections</Link>
            <ChevronRight size={12} />
            <span className="truncate max-w-[200px]" style={{ color: "var(--foreground)" }}>{title}</span>
          </nav>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{
                background: `${accentColor}18`,
                color: accentColor,
                border: `1px solid ${accentColor}40`,
              }}
            >
              {badgeIcon}
              {badgeLabel}
            </span>
            {sectionLabel && (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                {sectionLabel}
              </span>
            )}
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {updatedLabel}
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight max-w-3xl"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            {title}
          </h1>

          {/* Description */}
          {description && (
            <p className="text-base sm:text-lg leading-relaxed mb-8 max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
              {description}
            </p>
          )}

          {/* Stat pills */}
          <div className="flex flex-wrap gap-3 mb-7">
            {[
              { icon: <BookOpen size={13} />, value: `${stories.length}`, label: stories.length === 1 ? "story" : "stories" },
              { icon: <Heart size={13} />, value: totalLikes.toLocaleString(), label: "total likes" },
              { icon: <Clock size={13} />, value: `~${totalReadTime}`, label: "min reading" },
              ...(avgRating !== null
                ? [{ icon: <Star size={13} />, value: avgRating.toFixed(1), label: "avg rating" }]
                : []),
            ].map((stat) => (
              <div
                key={stat.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                style={{ background: `${accentColor}0d`, border: `1px solid ${accentColor}20` }}
              >
                <span style={{ color: accentColor }}>{stat.icon}</span>
                <span className="font-bold" style={{ color: "var(--foreground)" }}>{stat.value}</span>
                <span style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Share row */}
          <ShareButtons url={`${SITE}/collections/${slug}`} title={title} variant="header" />
        </div>
      </div>

      {/* ── Story list ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {stories.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
              No stories yet
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Check back soon — this collection updates regularly.
            </p>
          </div>
        ) : (
          <>
            {/* Column label */}
            <div
              className="hidden sm:grid grid-cols-[2.25rem_3.75rem_1fr] gap-3 sm:gap-5 px-5 pb-2 mb-1 text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              <span>#</span>
              <span />
              <span>Story</span>
            </div>

            <div className="flex flex-col gap-2">
              {editorialEntries.map((entry, idx) => (
                <CollectionStoryRow
                  key={entry.id}
                  story={entry.story}
                  rank={idx + 1}
                  editorialNote={entry.editorialNote}
                  accentColor={accentColor}
                />
              ))}
            </div>
          </>
        )}

        {/* ── Bottom share ─────────────────────────────────────────── */}
        {stories.length > 0 && (
          <div
            className="mt-10 pt-6 flex flex-wrap items-center gap-3"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Share this collection
            </p>
            <ShareButtons url={`${SITE}/collections/${slug}`} title={title} variant="footer" />
          </div>
        )}

        {/* ── Explore more ─────────────────────────────────────────── */}
        {relatedCollections.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                Explore More Collections
              </h2>
              <Link
                href="/collections"
                className="text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ color: accentColor }}
              >
                All collections →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {relatedCollections.map((col) => (
                <Link
                  key={col.slug}
                  href={`/collections/${col.slug}`}
                  className="group flex flex-col gap-2.5 p-4 rounded-xl transition-all hover:translate-y-[-2px]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                  >
                    {ICON_MAP[col.icon] ?? <BookOpen size={15} />}
                  </div>
                  <p
                    className="text-sm font-bold leading-snug group-hover:opacity-75 transition-opacity"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    {col.title}
                  </p>
                  <span
                    className="text-xs font-medium px-1.5 py-0.5 rounded-full w-fit"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                  >
                    {col.refreshLabel}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
