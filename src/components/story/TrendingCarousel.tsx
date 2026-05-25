"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

interface TrendingStory {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  views: number;
  categories: { id: string; name: string; color: string }[];
  author: { name: string; slug: string };
}

const CARD_WIDTH = 148;
const GAP = 12;
const SCROLL_AMOUNT = (CARD_WIDTH + GAP) * 3;

export function TrendingCarousel({ stories }: { stories: TrendingStory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -SCROLL_AMOUNT : SCROLL_AMOUNT,
      behavior: "smooth",
    });
  }

  if (!stories.length) return null;

  return (
    <section className="mb-10" aria-label="Trending stories">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-lg font-bold flex items-center gap-2"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          <TrendingUp size={18} style={{ color: "#c4426a" }} />
          Trending Now
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-75"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
            aria-label="Scroll right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex overflow-x-auto pb-2"
        style={{
          gap: GAP,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollSnapType: "x mandatory",
        }}
      >
        {stories.map((story, i) => {
          const color = story.categories[0]?.color ?? "#c4426a";
          return (
            <Link
              key={story.id}
              href={`/stories/${story.slug}`}
              className="group relative overflow-hidden rounded-xl shrink-0"
              style={{
                width: CARD_WIDTH,
                height: 210,
                scrollSnapAlign: "start",
                background: "var(--muted)",
                display: "block",
              }}
              title={story.title}
            >
              {/* Rank badge */}
              <span
                className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(13,13,15,0.75)", color: "white" }}
              >
                {i + 1}
              </span>

              {/* Fallback always in DOM */}
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${color}55 0%, #0d0d0f 100%)` }}
              >
                <span
                  className="text-5xl font-bold opacity-25"
                  style={{ fontFamily: "var(--font-playfair), serif", color }}
                >
                  {story.title[0]}
                </span>
              </div>
              {/* Image overlays fallback; hides on error */}
              {story.coverImage && (
                <img
                  src={story.coverImage}
                  alt={story.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                />
              )}

              {/* Title overlay */}
              <div
                className="absolute inset-0 z-10 flex flex-col justify-end p-2.5"
                style={{
                  background:
                    "linear-gradient(to top, rgba(13,13,15,0.97) 0%, rgba(13,13,15,0.5) 55%, transparent 100%)",
                }}
              >
                {story.categories[0] && (
                  <span
                    className="text-[10px] font-semibold mb-1 truncate"
                    style={{ color }}
                  >
                    {story.categories[0].name}
                  </span>
                )}
                <p
                  className="text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: "white" }}
                >
                  {story.title}
                </p>
                <p className="text-[10px] mt-1 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {story.author.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Hide scrollbar for WebKit */}
      <style>{`.trending-scroll::-webkit-scrollbar { display: none; }`}</style>
    </section>
  );
}
