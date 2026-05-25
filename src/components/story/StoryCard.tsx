"use client";

import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Clock, BookOpen, Star } from "lucide-react";
import { formatDateShort, getTags } from "@/lib/utils";

interface StoryCardProps {
  story: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string | null;
    readingTime: number;
    views: number;
    tags: string;
    createdAt: Date;
    series?: string | null;
    seriesId?: string | null;
    chapterNumber?: number | null;
    categories: { id: string; name: string; slug: string; color: string }[];
    author: { name: string; slug: string };
    _count: { likes: number; comments: number };
    ratingAvg?: number;
    ratingCount?: number;
  };
  variant?: "default" | "compact" | "featured";
}

export function StoryCard({ story, variant = "default", priority = false }: StoryCardProps & { priority?: boolean }) {
  const router = useRouter();
  const tags = getTags(story.tags).slice(0, 3);
  const primaryCategory = story.categories[0];
  const primaryColor = primaryCategory?.color ?? "#c4426a";

  if (variant === "compact") {
    return (
      <Link
        href={`/stories/${story.slug}`}
        className="flex gap-4 group"
      >
        <div
          className="w-20 h-20 rounded-lg shrink-0 overflow-hidden"
          style={{ background: "var(--muted)" }}
        >
          {story.coverImage ? (
            <SafeImage
              src={story.coverImage}
              alt={story.title}
              width={80}
              height={80}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)`,
                color: primaryColor,
                fontFamily: "var(--font-playfair), serif",
              }}
            >
              {story.title[0]}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-sm leading-tight mb-1 group-hover:opacity-75 transition-opacity line-clamp-2"
            style={{ color: "var(--foreground)" }}
          >
            {story.title}
          </h3>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            {story.author.name}
          </p>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="flex items-center gap-1">
              <Heart size={11} /> {story._count.likes}
            </span>
            {(story.ratingCount ?? 0) >= 3 && (
              <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                <Star size={11} fill="#c4426a" />
                {(story.ratingAvg ?? 0).toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={11} /> {story.readingTime}m
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "featured") {
    return (
      <Link href={`/stories/${story.slug}`} className="group block relative overflow-hidden rounded-2xl">
        <div
          className="aspect-[16/9] w-full"
          style={{ background: "var(--muted)" }}
        >
          {story.coverImage ? (
            <SafeImage
              src={story.coverImage}
              alt={story.title}
              fill
              priority={priority}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}44 0%, #0d0d0f 100%)`,
              }}
            >
              <span
                className="text-7xl font-bold opacity-20"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  color: primaryColor,
                }}
              >
                {story.title[0]}
              </span>
            </div>
          )}
        </div>
        <div
          className="absolute inset-0 flex flex-col justify-end p-6"
          style={{
            background:
              "linear-gradient(to top, rgba(13,13,15,0.97) 0%, rgba(13,13,15,0.5) 60%, transparent 100%)",
          }}
        >
          <div className="mb-2 flex flex-wrap gap-1.5">
            {story.categories.map((cat) => (
              <span
                key={cat.id}
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: cat.color + "33",
                  color: cat.color,
                  border: `1px solid ${cat.color}55`,
                }}
              >
                {cat.name}
              </span>
            ))}
          </div>
          <h2
            className="text-xl sm:text-2xl font-bold mb-2 leading-tight group-hover:opacity-80 transition-opacity"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            {story.title}
          </h2>
          <p className="text-sm mb-3 line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
            {story.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>by {story.author.name}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart size={12} /> {story._count.likes}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={12} /> {story.readingTime}m
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article
      className="group rounded-2xl overflow-hidden transition-all duration-200 hover:translate-y-[-2px] cursor-pointer"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      onClick={() => router.push(`/stories/${story.slug}`)}
    >
      <div
        className="aspect-[16/9] w-full overflow-hidden relative"
        style={{ background: "var(--muted)" }}
      >
        {story.coverImage ? (
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-400"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}22 0%, var(--muted) 100%)`,
            }}
          >
            <span
              className="text-5xl font-bold"
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: primaryColor + "66",
              }}
            >
              {story.title[0]}
            </span>
          </div>
        )}
        {(story.ratingCount ?? 0) >= 3 && (
          <div
            className="absolute top-2 left-2 flex items-center gap-0.5 px-2 py-1 rounded text-[10px] font-bold"
            style={{ background: "rgba(234,179,8,0.88)", color: "white" }}
          >
            <Star size={9} fill="white" />
            {(story.ratingAvg ?? 0).toFixed(1)}
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Single category + date row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {primaryCategory ? (
            <Link
              href={`/categories/${primaryCategory.slug}`}
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full transition-opacity hover:opacity-75 shrink-0"
              style={{
                background: primaryCategory.color + "22",
                color: primaryCategory.color,
                border: `1px solid ${primaryCategory.color}44`,
                position: "relative",
                zIndex: 1,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {primaryCategory.name}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
            {formatDateShort(story.createdAt)}
          </span>
        </div>

        <h3
          className="font-bold text-base leading-snug mb-2 line-clamp-2"
          style={{ fontFamily: "var(--font-playfair), serif" }}
        >
          <Link
            href={`/stories/${story.slug}`}
            className="group-hover:opacity-80 transition-opacity"
            style={{ color: "var(--foreground)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {story.title}
          </Link>
        </h3>

        <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
          {story.excerpt}
        </p>

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-4 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={`/authors/${story.author.slug}`}
              className="text-xs font-medium transition-opacity hover:opacity-75 truncate"
              style={{ color: "var(--muted-foreground)", position: "relative", zIndex: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              {story.author.name}
            </Link>
            {story.series && story.chapterNumber && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium shrink-0"
                style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
              >
                <BookOpen size={9} />
                {story.chapterNumber}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2.5 text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
            {(story.ratingCount ?? 0) >= 3 && (
              <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                <Star size={11} fill="#c4426a" />
                {(story.ratingAvg ?? 0).toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Heart size={11} /> {story._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} /> {story.readingTime}m
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
