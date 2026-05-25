"use client";

import { useState, useEffect } from "react";
import { Heart, Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

interface StoryActionsProps {
  storyId: string;
  likeCount: number;
  bookmarkCount: number;
  userId?: string;
}

export function StoryActions({ storyId, likeCount, bookmarkCount, userId }: StoryActionsProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likes, setLikes] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/stories/${storyId}/status`)
      .then((r) => r.json())
      .then((data) => {
        if (data.liked !== undefined) setLiked(data.liked);
        if (data.bookmarked !== undefined) setBookmarked(data.bookmarked);
      })
      .catch(() => {});
  }, [userId, storyId]);

  async function toggle(type: "like" | "bookmark") {
    if (!userId) {
      router.push("/login");
      return;
    }
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/stories/${storyId}/${type}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (type === "like") {
        setLiked(data.liked);
        setLikes((prev) => data.liked ? prev + 1 : prev - 1);
      } else {
        setBookmarked(data.bookmarked);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 my-6">
      <button
        onClick={() => toggle("like")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: liked ? "rgba(196,66,106,0.15)" : "var(--muted)",
          color: liked ? "#c4426a" : "var(--muted-foreground)",
          border: liked ? "1px solid rgba(196,66,106,0.35)" : "1px solid var(--border)",
        }}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart
          size={16}
          fill={liked ? "#c4426a" : "none"}
          style={{ color: liked ? "#c4426a" : "currentColor" }}
        />
        {likes > 0 ? likes : "Like"}
      </button>

      <button
        onClick={() => toggle("bookmark")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
        style={{
          background: bookmarked ? "rgba(196,66,106,0.15)" : "var(--muted)",
          color: bookmarked ? "#c4426a" : "var(--muted-foreground)",
          border: bookmarked ? "1px solid rgba(196,66,106,0.35)" : "1px solid var(--border)",
        }}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
      >
        <Bookmark
          size={16}
          fill={bookmarked ? "#c4426a" : "none"}
          style={{ color: bookmarked ? "#c4426a" : "currentColor" }}
        />
        {bookmarked ? "Saved" : "Bookmark"}
      </button>
    </div>
  );
}
