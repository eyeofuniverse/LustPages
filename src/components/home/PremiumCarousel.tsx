"use client";

import { useRef } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, Coins, Lock, ArrowRight, Star } from "lucide-react";
import type { PremiumEntry } from "@/lib/queries";

interface Props {
  stories: PremiumEntry[];
}

export function PremiumCarousel({ stories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  if (stories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl shrink-0" style={{ background: "rgba(234,179,8,0.12)" }}>
              <Lock size={18} style={{ color: "#eab308" }} />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                Premium Content
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {stories.length} exclusive {stories.length === 1 ? "story" : "stories"} · unlock with coins
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
          {stories.map((story) => (
            <PremiumCard key={story.id} story={story} />
          ))}
          <BrowseAllCard href="/premium/stories" />
        </div>
      </div>
    </section>
  );
}

function PremiumCard({ story }: { story: PremiumEntry }) {
  const primaryCategory = story.categories[0];

  const placeholderBg = primaryCategory
    ? `linear-gradient(160deg, ${primaryCategory.color}55 0%, ${primaryCategory.color}18 100%)`
    : "linear-gradient(160deg, rgba(234,179,8,0.4) 0%, rgba(234,179,8,0.1) 100%)";

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group shrink-0 w-[130px] sm:w-[148px]"
      style={{ textDecoration: "none" }}
    >
      {/* Book cover */}
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
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: primaryCategory?.color ?? "#eab308",
                opacity: 0.75,
              }}
            >
              {story.title[0]}
            </span>
          </div>
        )}

        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }}
        />

        {/* Premium badge — top left */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
          style={{ background: "rgba(234,179,8,0.92)", color: "white" }}
        >
          <Coins size={7} />
          Premium
        </div>

        {/* Rating badge — top right */}
        {story.ratingCount >= 3 && (
          <div
            className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={7} fill="white" />
            {story.ratingAvg.toFixed(1)}
          </div>
        )}

        {/* Coin price — bottom */}
        <div
          className="absolute bottom-2 left-0 right-0 flex justify-center"
        >
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.65)", color: "#eab308" }}
          >
            <Coins size={9} />
            {story.coinPrice}
          </span>
        </div>
      </div>

      {/* Title */}
      <h3
        className="text-xs font-bold line-clamp-2 mb-0.5 leading-snug group-hover:opacity-70 transition-opacity"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {story.title}
      </h3>

      {/* Author */}
      <p className="text-[11px] truncate mb-1.5" style={{ color: "var(--muted-foreground)" }}>
        by {story.author.name}
      </p>

      {/* Category chip */}
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
          style={{ background: "rgba(234,179,8,0.12)" }}
        >
          <ArrowRight size={22} style={{ color: "#eab308" }} />
        </div>
        <span className="text-xs font-bold text-center px-2" style={{ color: "var(--foreground)" }}>
          Browse All
        </span>
      </div>
    </Link>
  );
}
