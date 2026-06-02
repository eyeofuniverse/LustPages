"use client";

import { useRef } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, BookOpen, Layers, Sparkles, Star } from "lucide-react";
import type { FeaturedEntry } from "@/lib/queries";
import { computeSeriesRating } from "@/lib/utils";

interface Props {
  promotions: FeaturedEntry[];
  variant: "story" | "series";
}

export function FeaturedCarousel({ promotions, variant }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  const label = variant === "series" ? "Featured Series" : "Featured Stories";

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(196,66,106,0.12)" }}>
              {variant === "series"
                ? <Layers size={18} style={{ color: "#c4426a" }} />
                : <Sparkles size={18} style={{ color: "#c4426a" }} />}
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                {label}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {promotions.filter((p) => !p.isAdminPick).length > 0
                  ? `${promotions.filter((p) => !p.isAdminPick).length} promoted · ${promotions.filter((p) => p.isAdminPick).length} editor's picks`
                  : "Editor's picks"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              aria-label="Scroll left"
            >
              <ChevronLeft size={16} style={{ color: "var(--muted-foreground)" }} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              aria-label="Scroll right"
            >
              <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
        >
          {promotions.map((entry) => (
            <BookCard key={entry.id} entry={entry} variant={variant} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BookCard({ entry, variant }: { entry: FeaturedEntry; variant: "story" | "series" }) {
  const isStory = variant === "story";
  const isSeries = variant === "series";

  const title = isStory ? entry.story?.title : entry.series?.name;
  const author = isStory ? entry.story?.author : entry.series?.author;
  const cover = isStory ? entry.story?.coverImage : (entry.series?.coverImage ?? entry.series?.stories?.[0]?.coverImage ?? null);
  const href = isStory
    ? `/stories/${entry.story?.slug}`
    : `/series/${entry.series?.slug}`;
  const categories = isStory ? (entry.story?.categories ?? []) : [];
  const primaryCategory = categories[0];
  const storyCount = isSeries ? entry.series?._count.stories : null;
  const storyRating = isStory && entry.story
    ? { avg: entry.story.ratingAvg, count: entry.story.ratingCount }
    : null;
  const seriesRating = isSeries && entry.series
    ? computeSeriesRating(entry.series.stories)
    : null;
  const rating = storyRating ?? seriesRating;

  if (!title || !author) return null;

  const placeholderBg = primaryCategory
    ? `linear-gradient(160deg, ${primaryCategory.color}55 0%, ${primaryCategory.color}18 100%)`
    : "linear-gradient(160deg, rgba(196,66,106,0.4) 0%, rgba(196,66,106,0.1) 100%)";

  return (
    <Link
      href={href}
      className="group shrink-0 w-[130px] sm:w-[148px]"
      style={{ textDecoration: "none" }}
    >
      {/* Book cover */}
      <div
        className="relative rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300"
        style={{ aspectRatio: "2/3", background: "var(--muted)" }}
      >
        {cover ? (
          <SafeImage
            src={cover}
            alt={title}
            fill
            sizes="148px"
            className="object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderBg }}>
            <span
              className="text-5xl font-bold"
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: primaryCategory?.color ?? "#c4426a",
                opacity: 0.75,
              }}
            >
              {title[0]}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }}
        />

        {/* Badge — top left */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
          style={
            entry.isAdminPick
              ? { background: "rgba(234,179,8,0.9)", color: "white" }
              : { background: "rgba(196,66,106,0.9)", color: "white" }
          }
        >
          {entry.isAdminPick ? <Star size={7} /> : <Sparkles size={7} />}
          {entry.isAdminPick ? "Editor" : "Featured"}
        </div>

        {/* Rating badge — bottom left */}
        {rating && rating.count >= 3 && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={7} fill="white" />
            {rating.avg.toFixed(1)}
          </div>
        )}

        {/* Series "S" badge — top right */}
        {isSeries && (
          <div
            className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-[9px] font-extrabold"
            style={{ background: "rgba(6,182,212,0.9)", color: "white" }}
          >
            S
          </div>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-xs font-bold line-clamp-2 mb-0.5 leading-snug group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {title}
      </h3>

      {/* Author */}
      <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        by {author.name}
      </p>

      {/* Meta chips */}
      <div className="flex flex-wrap gap-1">
        {primaryCategory && (
          <span
            className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: primaryCategory.color + "20", color: primaryCategory.color }}
          >
            {primaryCategory.name}
          </span>
        )}
        {isSeries && storyCount !== null && (
          <span
            className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(6,182,212,0.12)", color: "rgb(6,182,212)" }}
          >
            <BookOpen size={8} className="inline mr-0.5" />
            {storyCount} {storyCount === 1 ? "part" : "parts"}
          </span>
        )}
      </div>
    </Link>
  );
}
