"use client";

import { useRef } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, BookOpen, Layers, Zap, ArrowRight, Star } from "lucide-react";
import type { LatestStoryEntry, LatestSeriesEntry } from "@/lib/queries";
import { computeSeriesRating } from "@/lib/utils";

type Props =
  | { variant: "story"; items: LatestStoryEntry[] }
  | { variant: "series"; items: LatestSeriesEntry[] };

export function LatestCarousel(props: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  const isStory = props.variant === "story";

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(196,66,106,0.12)" }}>
              {isStory
                ? <BookOpen size={18} style={{ color: "#c4426a" }} />
                : <Layers size={18} style={{ color: "#c4426a" }} />}
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                {isStory ? "Latest Stories" : "Latest Series"}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {isStory ? "Fresh fiction added daily" : "Recently updated series"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={isStory ? "/stories" : "/series"}
              className="text-xs font-semibold mr-1 transition-opacity hover:opacity-70 hidden sm:block"
              style={{ color: "#c4426a" }}
            >
              View All
            </Link>
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
          {props.variant === "story"
            ? props.items.map((s) => <StoryCard key={s.id} story={s} />)
            : props.items.map((s) => <SeriesCard key={s.id} series={s} />)}
          <BrowseAllCard href={props.variant === "story" ? "/stories" : "/series"} />
        </div>
      </div>
    </section>
  );
}

function StoryCard({ story }: { story: LatestStoryEntry }) {
  const primaryCategory = story.categories[0];
  const placeholderBg = primaryCategory
    ? `linear-gradient(160deg, ${primaryCategory.color}55 0%, ${primaryCategory.color}18 100%)`
    : "linear-gradient(160deg, rgba(196,66,106,0.4) 0%, rgba(196,66,106,0.1) 100%)";

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group shrink-0 w-[130px] sm:w-[148px]"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300"
        style={{ aspectRatio: "2/3", background: "var(--muted)" }}
      >
        {story.coverImage ? (
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            fill
            sizes="148px"
            className="object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderBg }}>
            <span
              className="text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: primaryCategory?.color ?? "#c4426a", opacity: 0.75 }}
            >
              {story.title[0]}
            </span>
          </div>
        )}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />

        {/* New badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
          style={{ background: "rgba(196,66,106,0.9)", color: "white" }}
        >
          <Zap size={7} />
          New
        </div>

        {/* Rating badge — bottom left */}
        {story.ratingCount >= 3 && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={7} fill="white" />
            {story.ratingAvg.toFixed(1)}
          </div>
        )}

        {/* Coin price badge */}
        {story.coinPrice != null && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.9)", color: "white" }}>
            {story.coinPrice}c
          </div>
        )}
      </div>

      <h3
        className="text-xs font-bold line-clamp-2 mb-0.5 leading-snug group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {story.title}
      </h3>
      <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        by {story.author.name}
      </p>
      <div className="flex flex-wrap gap-1">
        {primaryCategory && (
          <span
            className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
            style={{ background: primaryCategory.color + "20", color: primaryCategory.color }}
          >
            {primaryCategory.name}
          </span>
        )}
      </div>
    </Link>
  );
}

function SeriesCard({ series }: { series: LatestSeriesEntry }) {
  const cover = series.coverImage ?? series.stories[0]?.coverImage ?? null;
  const seriesRating = computeSeriesRating(series.stories);
  const placeholderBg = "linear-gradient(160deg, rgba(6,182,212,0.4) 0%, rgba(6,182,212,0.1) 100%)";

  return (
    <Link
      href={`/series/${series.slug}`}
      className="group shrink-0 w-[130px] sm:w-[148px]"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300"
        style={{ aspectRatio: "2/3", background: "var(--muted)" }}
      >
        {cover ? (
          <SafeImage
            src={cover}
            alt={series.name}
            fill
            sizes="148px"
            className="object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: placeholderBg }}>
            <span
              className="text-5xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "rgb(6,182,212)", opacity: 0.75 }}
            >
              {series.name[0]}
            </span>
          </div>
        )}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />

        {/* Updated badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
          style={{ background: "rgba(196,66,106,0.9)", color: "white" }}
        >
          <Zap size={7} />
          New
        </div>

        {/* Rating badge — bottom left */}
        {seriesRating.count >= 3 && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={7} fill="white" />
            {seriesRating.avg.toFixed(1)}
          </div>
        )}

        {/* Series S badge */}
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded flex items-center justify-center text-[9px] font-extrabold"
          style={{ background: "rgba(6,182,212,0.9)", color: "white" }}
        >
          S
        </div>
      </div>

      <h3
        className="text-xs font-bold line-clamp-2 mb-0.5 leading-snug group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {series.name}
      </h3>
      <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        by {series.author.name}
      </p>
      <div className="flex flex-wrap gap-1">
        <span
          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: "rgba(6,182,212,0.12)", color: "rgb(6,182,212)" }}
        >
          <BookOpen size={8} className="inline mr-0.5" />
          {series._count.stories} {series._count.stories === 1 ? "part" : "parts"}
        </span>
      </div>
    </Link>
  );
}

function BrowseAllCard({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="group shrink-0 w-[130px] sm:w-[148px]"
      style={{ textDecoration: "none" }}
    >
      <div
        className="relative rounded-xl overflow-hidden mb-3 flex flex-col items-center justify-center gap-3 transition-opacity group-hover:opacity-75"
        style={{ aspectRatio: "2/3", background: "var(--card)", border: "2px dashed var(--border)" }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(196,66,106,0.12)" }}
        >
          <ArrowRight size={22} style={{ color: "#c4426a" }} />
        </div>
        <span className="text-xs font-bold text-center px-2" style={{ color: "var(--foreground)" }}>
          Browse All
        </span>
      </div>
    </Link>
  );
}
