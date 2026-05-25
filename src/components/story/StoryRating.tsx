"use client";

import { useState, useEffect } from "react";
import { Star, LogIn } from "lucide-react";
import Link from "next/link";

interface StoryRatingProps {
  storyId: string;
  avgRating: number;
  ratingCount: number;
  userId?: string;
}

export function StoryRating({ storyId, avgRating, ratingCount, userId }: StoryRatingProps) {
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [localAvg, setLocalAvg] = useState(avgRating);
  const [localCount, setLocalCount] = useState(ratingCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/stories/${storyId}/status`)
      .then((r) => r.json())
      .then((data) => { if (data.rating !== undefined) setUserRating(data.rating); })
      .catch(() => {});
  }, [storyId, userId]);

  async function rate(value: number) {
    if (loading) return;
    setLoading(true);
    try {
      if (userRating === value) {
        const res = await fetch(`/api/stories/${storyId}/rate`, { method: "DELETE" });
        const data = await res.json();
        setUserRating(null);
        setLocalAvg(data.avgRating);
        setLocalCount(data.ratingCount);
      } else {
        const res = await fetch(`/api/stories/${storyId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        });
        const data = await res.json();
        setUserRating(value);
        setLocalAvg(data.avgRating);
        setLocalCount(data.ratingCount);
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  const displayRating = hovered ?? userRating ?? 0;

  return (
    <div className="flex flex-col gap-1.5 my-6">
      {userId ? (
        <>
          <div
            className="flex items-center gap-1"
            onMouseLeave={() => setHovered(null)}
            role="group"
            aria-label="Rate this story"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => rate(star)}
                onMouseEnter={() => setHovered(star)}
                disabled={loading}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-50 p-0.5"
              >
                <Star
                  size={22}
                  fill={star <= displayRating ? "#c4426a" : "none"}
                  style={{ color: star <= displayRating ? "#c4426a" : "var(--muted-foreground)" }}
                />
              </button>
            ))}

            {userRating !== null && !hovered && (
              <span className="ml-1 text-xs font-semibold" style={{ color: "#c4426a" }}>
                Your rating
              </span>
            )}
          </div>

          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {localCount > 0
              ? `${localAvg.toFixed(1)} ★ from ${localCount} ${localCount === 1 ? "reader" : "readers"}`
              : "Be the first to rate this story"}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={22}
                fill="none"
                style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
              />
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {localCount > 0
              ? `${localAvg.toFixed(1)} ★ from ${localCount} ${localCount === 1 ? "reader" : "readers"} · `
              : ""}
            <Link
              href="/signin"
              className="inline-flex items-center gap-1 font-semibold hover:opacity-75 transition-opacity"
              style={{ color: "#c4426a" }}
            >
              <LogIn size={11} />
              Sign in to rate
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
