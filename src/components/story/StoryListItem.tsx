import Link from "next/link";
import { Heart, MessageCircle, BookOpen, Star } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { StoryThumbnail } from "@/components/story/StoryThumbnail";
import { AuthorAvatarImg } from "@/components/story/AuthorAvatarImg";

interface StoryListItemData {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  readingTime: number;
  views: number;
  storyTags?: { name: string; slug: string }[];
  series: string | null;
  createdAt: Date;
  categories: { id: string; name: string; slug: string; color: string }[];
  author: { name: string; slug: string; image: string | null };
  _count: { likes: number; comments: number };
  ratingAvg?: number;
  ratingCount?: number;
}

export function StoryListItem({ story }: { story: StoryListItemData }) {
  const tags = story.storyTags ?? [];
  const primaryCategory = story.categories[0];
  const primaryColor = primaryCategory?.color ?? "#c4426a";
  const authorInitial = story.author.name.charAt(0).toUpperCase();
  const wordCount = Math.round(story.readingTime * 225);
  const wordCountDisplay =
    wordCount >= 1000 ? `${(wordCount / 1000).toFixed(1)}k` : String(wordCount);

  return (
    <article
      className="py-5"
      style={{ borderBottom: "1px solid var(--border)" }}
      itemScope
      itemType="https://schema.org/Article"
    >
      {/* Author row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full shrink-0 overflow-hidden relative flex items-center justify-center text-sm font-bold"
            style={{ background: primaryColor + "22", color: primaryColor }}
          >
            <AuthorAvatarImg
              src={story.author.image}
              name={story.author.name}
              initial={authorInitial}
            />
          </div>
          <Link
            href={`/authors/${story.author.slug}`}
            className="text-sm font-medium hover:opacity-75 transition-opacity"
            style={{ color: "var(--foreground)" }}
            itemProp="author"
          >
            {story.author.name}
          </Link>
        </div>
        <time
          dateTime={new Date(story.createdAt).toISOString()}
          className="text-xs"
          style={{ color: "var(--muted-foreground)" }}
        >
          {formatRelativeDate(story.createdAt)}
        </time>
      </div>

      {/* Content + Thumbnail */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          {/* Category chip */}
          {primaryCategory && (
            <Link
              href={`/categories/${primaryCategory.slug}`}
              className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-1.5 hover:opacity-80 transition-opacity"
              style={{
                background: primaryColor + "18",
                color: primaryColor,
                border: `1px solid ${primaryColor}44`,
              }}
            >
              {primaryCategory.name}
            </Link>
          )}

          {/* Title */}
          <h2 className="mb-0.5 leading-snug" itemProp="headline">
            <Link
              href={`/stories/${story.slug}`}
              className="text-base font-bold hover:opacity-80 transition-opacity"
              style={{
                color: "#c4426a",
                fontFamily: "var(--font-playfair), serif",
              }}
            >
              {story.title}
            </Link>
          </h2>

          {/* Series */}
          {story.series && (
            <p
              className="text-sm italic mb-1.5"
              style={{ color: "var(--muted-foreground)" }}
            >
              {story.series}
            </p>
          )}

          {/* Excerpt */}
          <p
            className="text-sm leading-relaxed mb-3 line-clamp-2"
            style={{ color: "var(--muted-foreground)" }}
            itemProp="description"
          >
            {story.excerpt}
          </p>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.slice(0, 7).map((tag, i) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="text-xs px-2.5 py-0.5 rounded-full transition-opacity hover:opacity-75"
                  style={
                    i === 0
                      ? {
                          border: `1px solid ${primaryColor}`,
                          color: primaryColor,
                        }
                      : {
                          border: "1px solid var(--border)",
                          color: "var(--muted-foreground)",
                        }
                  }
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Stats */}
          <div
            className="flex items-center gap-4 text-xs"
            style={{ color: "var(--muted-foreground)" }}
          >
            <span className="flex items-center gap-1">
              <Heart size={12} /> {story._count.likes}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {story._count.comments}
            </span>
            {(story.ratingCount ?? 0) >= 3 && (
              <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                <Star size={12} fill="#c4426a" />
                {(story.ratingAvg ?? 0).toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <BookOpen size={12} /> {wordCountDisplay} words
            </span>
          </div>
        </div>

        {/* Thumbnail */}
        <Link
          href={`/stories/${story.slug}`}
          className="shrink-0 w-20 sm:w-24 h-28 sm:h-32 rounded-xl overflow-hidden block relative"
          style={{ background: "var(--muted)" }}
          tabIndex={-1}
          aria-hidden="true"
        >
          <StoryThumbnail
            src={story.coverImage}
            title={story.title}
            primaryColor={primaryColor}
          />
        </Link>
      </div>
    </article>
  );
}
