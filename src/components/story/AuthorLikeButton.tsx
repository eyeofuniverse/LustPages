"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  authorId: string;
  likeCount: number;
  isLoggedIn: boolean;
}

export function AuthorLikeButton({ authorId, likeCount, isLoggedIn }: Props) {
  const router = useRouter();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(likeCount);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch(`/api/authors/${authorId}/like`)
      .then((r) => r.json())
      .then((data) => { if (data.liked !== undefined) setLiked(data.liked); })
      .catch(() => {});
  }, [authorId, isLoggedIn]);

  async function toggle() {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (loading) return;
    setLoading(true);
    const prev = liked;
    setLiked(!liked);
    setCount((c) => liked ? c - 1 : c + 1);
    try {
      const res = await fetch(`/api/authors/${authorId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setCount((c) => {
        const delta = data.liked ? (prev ? 0 : 1) : (prev ? -1 : 0);
        return likeCount + delta;
      });
    } catch {
      setLiked(prev);
      setCount(likeCount);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
      style={{
        background: liked ? "rgba(196,66,106,0.15)" : "var(--muted)",
        color: liked ? "#c4426a" : "var(--muted-foreground)",
        border: liked ? "1px solid rgba(196,66,106,0.35)" : "1px solid var(--border)",
      }}
      aria-label={liked ? "Unlike author" : "Like author"}
    >
      <Heart
        size={16}
        fill={liked ? "#c4426a" : "none"}
        style={{ color: liked ? "#c4426a" : "currentColor" }}
      />
      {count > 0 ? count : "Like"}
    </button>
  );
}
