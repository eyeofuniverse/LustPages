"use client";

import { useRef } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, ArrowRight, Zap, Coins } from "lucide-react";
import type { CategoryWithStories } from "@/lib/queries";

interface Props {
  category: CategoryWithStories;
}

export function CategoryCarousel({ category }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  }

  const color = category.color;
  const showBrowseAll = category.totalStories > 10;

  return (
    <section className="py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl shrink-0"
              style={{ background: color + "20" }}
            >
              <span
                className="block w-[18px] h-[18px] rounded-full"
                style={{ background: color }}
              />
            </div>
            <div>
              <h2
                className="text-xl sm:text-2xl font-bold leading-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                {category.name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                {category.totalStories} {category.totalStories === 1 ? "story" : "stories"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showBrowseAll && (
              <Link
                href={`/categories/${category.slug}`}
                className="text-xs font-semibold mr-1 transition-opacity hover:opacity-70 hidden sm:block"
                style={{ color }}
              >
                View All
              </Link>
            )}
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
          {category.stories.map((story) => (
            <StoryCard key={story.id} story={story} accentColor={color} />
          ))}
          {showBrowseAll && (
            <BrowseAllCard href={`/categories/${category.slug}`} color={color} />
          )}
        </div>
      </div>
    </section>
  );
}

function StoryCard({
  story,
  accentColor,
}: {
  story: CategoryWithStories["stories"][number];
  accentColor: string;
}) {
  const primaryCategory = story.categories[0];
  const placeholderBg = `linear-gradient(160deg, ${accentColor}55 0%, ${accentColor}18 100%)`;

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
              style={{ fontFamily: "var(--font-playfair), serif", color: accentColor, opacity: 0.75 }}
            >
              {story.title[0]}
            </span>
          </div>
        )}

        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />

        {/* New badge */}
        <div
          className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
          style={{ background: accentColor + "e6", color: "white" }}
        >
          <Zap size={7} />
          New
        </div>

        {/* Coin price */}
        {story.coinPrice != null && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.9)", color: "white" }}
          >
            <Coins size={7} />
            {story.coinPrice}
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
      {primaryCategory && (
        <span
          className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: primaryCategory.color + "20", color: primaryCategory.color }}
        >
          {primaryCategory.name}
        </span>
      )}
    </Link>
  );
}

function BrowseAllCard({ href, color }: { href: string; color: string }) {
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
          style={{ background: color + "20" }}
        >
          <ArrowRight size={22} style={{ color }} />
        </div>
        <span className="text-xs font-bold text-center px-2" style={{ color: "var(--foreground)" }}>
          Browse All
        </span>
      </div>
    </Link>
  );
}
