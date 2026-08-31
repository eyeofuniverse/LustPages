import {
  getPublishedCollections,
  getTopCategoriesForCollections,
  getTopTagsForCollections,
} from "@/lib/queries";
import { AdSlot } from "@/components/ads/AdSlot";
import {
  AUTO_COLLECTIONS,
  SECTION_META,
  makeCategoryCollectionSlug,
  makeTagCollectionSlug,
} from "@/lib/collections";
import Link from "next/link";
import {
  BookOpen,
  Zap,
  Star,
  TrendingUp,
  Clock,
  Eye,
  MessageCircle,
  Award,
  Gem,
  Rocket,
  Calendar,
  Heart,
  Sparkles,
  FolderOpen,
  Tag,
} from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

const SITE = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export const metadata: Metadata = {
  title: "Best Of Collections — Curated Erotica & Adult Fiction | LustPages",
  description:
    "Handpicked and algorithmically ranked collections of the best adult fiction on LustPages. Browse live rankings, top-rated by category, best by tag, and editorially curated picks.",
  keywords: [
    "best erotica collections",
    "top adult fiction",
    "curated erotica",
    "best erotica stories",
    "adult fiction rankings",
    "erotica by category",
    "lustpages",
  ],
  alternates: { canonical: `${SITE}/collections` },
  openGraph: {
    title: "Best Of Collections — LustPages",
    description: "Curated collections of the best erotica and adult fiction on LustPages.",
    url: `${SITE}/collections`,
    type: "website",
    siteName: "LustPages",
    images: [{ url: `${SITE}/og-default.jpg`, width: 1200, height: 630, alt: "Best Of Collections on LustPages" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Of Collections — LustPages",
    description: "Algorithmically ranked and editorially curated adult fiction collections.",
    images: [`${SITE}/og-default.jpg`],
  },
};

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart size={18} />,
  "trending-up": <TrendingUp size={18} />,
  zap: <Zap size={18} />,
  eye: <Eye size={18} />,
  "message-circle": <MessageCircle size={18} />,
  star: <Star size={18} />,
  award: <Award size={18} />,
  gem: <Gem size={18} />,
  rocket: <Rocket size={18} />,
  clock: <Clock size={18} />,
  calendar: <Calendar size={18} />,
};

const SECTION_ORDER: Array<"popular" | "quality" | "discovery"> = ["popular", "quality", "discovery"];

export default async function CollectionsPage() {
  const [editorial, categories, tags] = await Promise.all([
    getPublishedCollections(),
    getTopCategoriesForCollections(),
    getTopTagsForCollections(24),
  ]);

  const bySection = SECTION_ORDER.map((section) => ({
    section,
    meta: SECTION_META[section],
    collections: AUTO_COLLECTIONS.filter((c) => c.section === section),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Best Of Collections — LustPages",
    description: "Curated collections of the best erotica and adult fiction on LustPages.",
    url: `${SITE}/collections`,
    hasPart: [
      ...AUTO_COLLECTIONS.map((c) => ({
        "@type": "ItemList",
        name: c.title,
        description: c.description,
        url: `${SITE}/collections/${c.slug}`,
      })),
      ...categories.map((c) => ({
        "@type": "ItemList",
        name: `Best of ${c.name}`,
        url: `${SITE}/collections/${makeCategoryCollectionSlug(c.slug)}`,
      })),
      ...editorial.map((c) => ({
        "@type": "ItemList",
        name: c.title,
        description: c.description,
        url: `${SITE}/collections/${c.slug}`,
      })),
    ],
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE },
      { "@type": "ListItem", position: 2, name: "Collections", item: `${SITE}/collections` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Page header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={18} style={{ color: "#c4426a" }} />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#c4426a" }}>
              Curated Reading
            </span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold mb-4 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Best Of Collections
          </h1>
          <p className="text-lg max-w-2xl" style={{ color: "var(--muted-foreground)" }}>
            Live rankings, category bests, and editorially curated picks — the fastest way to find
            outstanding adult fiction without scrolling through thousands of stories.
          </p>
        </div>

        {/* ── Live Rankings — grouped by section ──────────────────── */}
        <div className="mb-14">
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Live Rankings
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            Algorithmically computed and refreshed daily — no editorial hand-picking.
          </p>

          <div className="space-y-10">
            {bySection.map(({ section, meta, collections }) => (
              <div key={section}>
                <div className="flex items-center gap-3 mb-4">
                  <h3
                    className="text-sm font-bold uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {meta.label}
                  </h3>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
                  {meta.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {collections.map((col) => (
                    <Link
                      key={col.slug}
                      href={`/collections/${col.slug}`}
                      className="group flex flex-col gap-3 p-5 rounded-2xl transition-all hover:translate-y-[-2px]"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                        >
                          {ICON_MAP[col.icon] ?? <BookOpen size={18} />}
                        </div>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                        >
                          {col.refreshLabel}
                        </span>
                      </div>
                      <div>
                        <h4
                          className="font-bold text-base mb-1 group-hover:opacity-75 transition-opacity leading-snug"
                          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                        >
                          {col.title}
                        </h4>
                        <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                          {col.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold mt-auto" style={{ color: "#c4426a" }}>
                        View collection →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <AdSlot identifier="collections_page_banner" />

        {/* ── Best by Category ─────────────────────────────────────── */}
        {categories.length > 0 && (
          <div className="mb-14">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Best by Category
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Top-rated stories in each genre, ranked by Wilson score across all reader ratings.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/collections/${makeCategoryCollectionSlug(cat.slug)}`}
                  className="group flex items-center gap-3 p-4 rounded-xl transition-all hover:translate-y-[-2px]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${cat.color ?? "#c4426a"}18`, color: cat.color ?? "#c4426a" }}
                  >
                    <FolderOpen size={15} />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="font-semibold text-sm leading-tight truncate group-hover:opacity-75 transition-opacity"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                    >
                      {cat.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {cat._count.stories} stories
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Best by Tag ──────────────────────────────────────────── */}
        {tags.length > 0 && (
          <div className="mb-14">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Best by Tag
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
              Curated rankings for the most popular tags — great for finding exactly what you&apos;re looking for.
            </p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/collections/${makeTagCollectionSlug(tag.slug)}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:opacity-75"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  <Tag size={12} style={{ color: "#c4426a" }} />
                  {tag.name}
                  <span className="text-xs ml-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {tag._count.stories}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Editorial Picks ──────────────────────────────────────── */}
        <div>
          <h2
            className="text-2xl font-bold mb-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Editorial Picks
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Hand-curated collections with editorial commentary — themed reading lists crafted with intent.
          </p>

          {editorial.length === 0 ? (
            <div
              className="text-center py-12 rounded-2xl"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <Sparkles size={28} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Editorial collections coming soon.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {editorial.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group flex items-center gap-5 p-5 rounded-2xl transition-all hover:translate-y-[-1px]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {col.coverImage ? (
                    <div
                      className="w-20 h-16 rounded-xl overflow-hidden shrink-0"
                      style={{ background: "var(--muted)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={col.coverImage}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-20 h-16 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: "rgba(196,66,106,0.1)" }}
                    >
                      <BookOpen size={24} style={{ color: "#c4426a" }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className="font-bold text-lg group-hover:opacity-75 transition-opacity line-clamp-1"
                        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                      >
                        {col.title}
                      </h3>
                      {col.featured && (
                        <span
                          className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                        >
                          Featured
                        </span>
                      )}
                    </div>
                    {col.description && (
                      <p className="text-sm line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                        {col.description}
                      </p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                      {col._count.stories} {col._count.stories === 1 ? "story" : "stories"}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-semibold" style={{ color: "#c4426a" }}>→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
