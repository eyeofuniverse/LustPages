import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { Star, Heart, Clock, Eye, MessageCircle } from "lucide-react";
import { formatDateShort } from "@/lib/utils";

export interface CollectionStoryRowStory {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  readingTime: number;
  views: number;
  tags: string;
  createdAt: Date;
  ratingAvg: number;
  ratingCount: number;
  categories: { id: string; name: string; slug: string; color: string }[];
  author: { name: string; slug: string };
  _count: { likes: number; comments: number };
}

interface Props {
  story: CollectionStoryRowStory;
  rank: number;
  editorialNote?: string | null;
  accentColor?: string;
}

const MEDALS: Record<number, { bg: string; border: string; leftBorder: string; rowBg: string }> = {
  1: {
    bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    border: "rgba(245,158,11,0.5)",
    leftBorder: "#f59e0b",
    rowBg: "rgba(245,158,11,0.03)",
  },
  2: {
    bg: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
    border: "rgba(148,163,184,0.5)",
    leftBorder: "#94a3b8",
    rowBg: "rgba(148,163,184,0.03)",
  },
  3: {
    bg: "linear-gradient(135deg, #c2855a 0%, #9a6035 100%)",
    border: "rgba(194,133,90,0.5)",
    leftBorder: "#c2855a",
    rowBg: "rgba(194,133,90,0.03)",
  },
};

export function CollectionStoryRow({ story, rank, editorialNote, accentColor = "#c4426a" }: Props) {
  const primaryCategory = story.categories[0];
  const fallbackColor = primaryCategory?.color ?? accentColor;
  const medal = MEDALS[rank];
  const isTop3 = rank <= 3;

  return (
    <article
      className="group flex gap-3 sm:gap-5 p-4 sm:p-5 rounded-2xl transition-all duration-200 hover:translate-y-[-1px]"
      style={{
        background: isTop3 ? medal.rowBg : "var(--card)",
        border: `1px solid ${isTop3 ? medal.border : "var(--border)"}`,
        borderLeftWidth: isTop3 ? "3px" : "1px",
        borderLeftColor: isTop3 ? medal.leftBorder : "var(--border)",
      }}
    >
      {/* Rank badge */}
      <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold leading-none"
          style={
            medal
              ? { background: medal.bg, color: "white", border: `1px solid ${medal.border}`, fontFamily: "var(--font-playfair), serif" }
              : { background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }
          }
        >
          {rank}
        </div>
      </div>

      {/* Thumbnail */}
      <Link
        href={`/stories/${story.slug}`}
        className="shrink-0 rounded-xl overflow-hidden block"
        style={{ width: 60, height: 82, background: "var(--muted)", minWidth: 60 }}
        tabIndex={-1}
        aria-hidden="true"
      >
        {story.coverImage ? (
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            width={60}
            height={82}
            sizes="60px"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${fallbackColor}25, ${fallbackColor}08)`,
              color: fallbackColor + "90",
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            {story.title[0]}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* Category + date */}
        <div className="flex flex-wrap items-center gap-1.5">
          {primaryCategory && (
            <Link
              href={`/categories/${primaryCategory.slug}`}
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-75"
              style={{
                background: primaryCategory.color + "22",
                color: primaryCategory.color,
                border: `1px solid ${primaryCategory.color}44`,
              }}
            >
              {primaryCategory.name}
            </Link>
          )}
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {formatDateShort(story.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h2 style={{ margin: 0 }}>
          <Link
            href={`/stories/${story.slug}`}
            className="font-bold text-base sm:text-lg group-hover:opacity-75 transition-opacity line-clamp-2 leading-snug"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            {story.title}
          </Link>
        </h2>

        {/* Author */}
        <p className="text-xs leading-none" style={{ color: "var(--muted-foreground)" }}>
          by{" "}
          <Link
            href={`/authors/${story.author.slug}`}
            className="font-medium hover:opacity-75 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
          >
            {story.author.name}
          </Link>
        </p>

        {/* Excerpt — hidden on small screens */}
        <p
          className="text-sm leading-relaxed line-clamp-2 hidden sm:block"
          style={{ color: "var(--muted-foreground)", marginTop: "0.25rem" }}
        >
          {story.excerpt}
        </p>

        {/* Editorial note */}
        {editorialNote && (
          <p
            className="text-xs italic px-3 py-2 rounded-lg mt-1"
            style={{
              background: `${accentColor}0a`,
              color: "var(--muted-foreground)",
              borderLeft: `2px solid ${accentColor}`,
            }}
          >
            {editorialNote}
          </p>
        )}

        {/* Stats + CTA */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-auto pt-2">
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            {story.ratingCount >= 3 && (
              <span className="flex items-center gap-1 font-semibold" style={{ color: "#f59e0b" }}>
                <Star size={11} fill="#f59e0b" />
                {story.ratingAvg.toFixed(1)}
                <span className="font-normal opacity-60">({story.ratingCount})</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Heart size={11} /> {story._count.likes.toLocaleString()}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <Eye size={11} /> {story.views.toLocaleString()}
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <MessageCircle size={11} /> {story._count.comments.toLocaleString()}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {story.readingTime}m
            </span>
          </div>

          <Link
            href={`/stories/${story.slug}`}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 active:scale-95"
            style={{
              background: `${accentColor}15`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
            }}
          >
            Read →
          </Link>
        </div>
      </div>
    </article>
  );
}
