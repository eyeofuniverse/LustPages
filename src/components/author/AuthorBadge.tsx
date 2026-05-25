import { Star } from "lucide-react";

const FEATURED_MIN_STORIES = 10;
const FEATURED_MIN_LIKES = 500;

export function isFeaturedAuthor(storyCount: number, totalLikes: number) {
  return storyCount >= FEATURED_MIN_STORIES && totalLikes >= FEATURED_MIN_LIKES;
}

interface Props {
  storyCount: number;
  totalLikes: number;
  size?: "sm" | "md";
}

export function AuthorBadge({ storyCount, totalLikes, size = "sm" }: Props) {
  if (!isFeaturedAuthor(storyCount, totalLikes)) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-semibold shrink-0"
      style={{
        background: "rgba(245,158,11,0.14)",
        color: "#d97706",
        border: "1px solid rgba(245,158,11,0.35)",
        padding: size === "md" ? "3px 10px" : "2px 7px",
        fontSize: size === "md" ? "0.75rem" : "0.65rem",
      }}
      title={`Featured Author — ${FEATURED_MIN_STORIES}+ stories and ${FEATURED_MIN_LIKES.toLocaleString()}+ likes`}
    >
      <Star size={size === "md" ? 11 : 9} fill="#d97706" stroke="none" />
      Featured Author
    </span>
  );
}
