"use client";

import { useRef } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface RecStory {
  id: string;
  title: string;
  slug: string;
  coverImage: string | null;
  readingTime: number;
  ratingAvg: number;
  ratingCount: number;
  author: { name: string; slug: string };
  categories: { id: string; name: string; slug: string; color: string }[];
  _count: { likes: number; comments: number };
}

interface Props {
  title: string;
  stories: RecStory[];
}

export function RecsCarousel({ title, stories }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  }

  if (stories.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-label="Scroll left"
          >
            <ChevronLeft size={15} style={{ color: "var(--muted-foreground)" }} />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-label="Scroll right"
          >
            <ChevronRight size={15} style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {stories.map((story) => (
          <RecCard key={story.id} story={story} />
        ))}
      </div>
    </div>
  );
}

function RecCard({ story }: { story: RecStory }) {
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
            className="object-cover group-hover:scale-105 transition-transform duration-300"
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

        {story.ratingCount >= 3 && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={7} fill="white" />
            {story.ratingAvg.toFixed(1)}
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
