import Link from "next/link";
import { getPublishedCollections } from "@/lib/queries";
import { AUTO_COLLECTIONS } from "@/lib/collections";
import {
  BookOpen,
  Heart,
  TrendingUp,
  Zap,
  Eye,
  MessageCircle,
  Star,
  Award,
  Gem,
  Rocket,
  Clock,
  Calendar,
  ArrowRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ReactNode> = {
  heart: <Heart size={20} />,
  "trending-up": <TrendingUp size={20} />,
  zap: <Zap size={20} />,
  eye: <Eye size={20} />,
  "message-circle": <MessageCircle size={20} />,
  star: <Star size={20} />,
  award: <Award size={20} />,
  gem: <Gem size={20} />,
  rocket: <Rocket size={20} />,
  clock: <Clock size={20} />,
  calendar: <Calendar size={20} />,
};

// The 4 collections shown on the homepage — chosen for maximum variety and appeal
const HOMEPAGE_SLUGS = ["most-liked-this-month", "top-rated-all-time", "hidden-gems", "rising-stars"];

export async function HomeCollectionsSection() {
  const editorial = await getPublishedCollections();
  const featuredEditorial = editorial.filter((c) => c.featured).slice(0, 2);

  const showcaseAuto = AUTO_COLLECTIONS.filter((c) => HOMEPAGE_SLUGS.includes(c.slug)).sort(
    (a, b) => HOMEPAGE_SLUGS.indexOf(a.slug) - HOMEPAGE_SLUGS.indexOf(b.slug)
  );

  if (showcaseAuto.length === 0) return null;

  return (
    <section
      className="py-10 sm:py-14"
      aria-labelledby="collections-home-heading"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(196,66,106,0.12)" }}>
              <BookOpen size={18} style={{ color: "#c4426a" }} />
            </div>
            <div>
              <h2
                id="collections-home-heading"
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                Curated Collections
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                Algorithmically ranked and editorially curated
              </p>
            </div>
          </div>
          <Link
            href="/collections"
            className="hidden sm:flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: "#c4426a" }}
            aria-label="Browse all collections"
          >
            All Collections <ArrowRight size={13} />
          </Link>
        </div>

        {/* Auto-collection cards — 2×2 on mobile, 4 columns on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          {showcaseAuto.map((col) => (
            <Link
              key={col.slug}
              href={`/collections/${col.slug}`}
              className="group flex flex-col gap-3 p-5 rounded-2xl transition-all duration-200 hover:translate-y-[-3px]"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
              >
                {ICON_MAP[col.icon] ?? <BookOpen size={20} />}
              </div>
              <div className="flex-1">
                <h3
                  className="font-bold text-sm leading-snug mb-1 group-hover:opacity-75 transition-opacity"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  {col.title}
                </h3>
                <p className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                  {col.description}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                >
                  {col.refreshLabel}
                </span>
                <span className="text-xs font-semibold" style={{ color: "#c4426a" }}>→</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Featured editorial collections (if any) */}
        {featuredEditorial.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {featuredEditorial.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:opacity-75"
                style={{
                  background: "rgba(196,66,106,0.06)",
                  border: "1px solid rgba(196,66,106,0.2)",
                  minWidth: "220px",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}
                >
                  <Star size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: "#c4426a" }}>
                    Editorial Pick
                  </p>
                  <p
                    className="text-sm font-bold line-clamp-1 group-hover:opacity-75 transition-opacity"
                    style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                  >
                    {col.title}
                  </p>
                </div>
                <span className="ml-auto text-sm shrink-0" style={{ color: "#c4426a" }}>→</span>
              </Link>
            ))}
          </div>
        )}

        {/* Mobile see-all link */}
        <div className="mt-4 text-center sm:hidden">
          <Link href="/collections" className="text-xs font-semibold" style={{ color: "#c4426a" }}>
            See all collections →
          </Link>
        </div>
      </div>
    </section>
  );
}
