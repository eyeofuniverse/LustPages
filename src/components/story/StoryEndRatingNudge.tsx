"use client";

import { useState, useEffect, useRef } from "react";
import { Star, X, LogIn } from "lucide-react";
import Link from "next/link";

const DAYS = 30;

function getCookie(name: string) {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((r) => r.startsWith(name + "="));
}

function setCookie(name: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=1; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

interface Props {
  storyId: string;
  isLoggedIn: boolean;
  isUnlocked: boolean;
  avgRating: number;
  ratingCount: number;
}

export function StoryEndRatingNudge({ storyId, isLoggedIn, isUnlocked, avgRating, ratingCount }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localAvg, setLocalAvg] = useState(avgRating);
  const [localCount, setLocalCount] = useState(ratingCount);

  const cookieKey = `lp_rated_${storyId}`;

  useEffect(() => {
    if (!isUnlocked) return;
    if (getCookie(cookieKey)) return;

    if (isLoggedIn) {
      fetch(`/api/stories/${storyId}/status`)
        .then((r) => r.json())
        .then((data) => { if (data.rating) setCookie(cookieKey, DAYS); })
        .catch(() => {});
    }

    const el = sentinelRef.current;
    if (!el) return;

    let t: ReturnType<typeof setTimeout>;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          t = setTimeout(() => {
            if (!getCookie(cookieKey)) {
              setShow(true);
              window.dispatchEvent(new CustomEvent("lp:story-nudge:on"));
            }
          }, 800);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => { obs.disconnect(); clearTimeout(t); };
  }, [storyId, isLoggedIn, isUnlocked, cookieKey]);

  function dismiss() {
    setCookie(cookieKey, DAYS);
    setShow(false);
    window.dispatchEvent(new CustomEvent("lp:story-nudge:off"));
  }

  async function rate(value: number) {
    if (loading) return;
    setSelected(value);
    setLoading(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      const data = await res.json();
      setLocalAvg(data.avgRating);
      setLocalCount(data.ratingCount);
      setSubmitted(true);
      setCookie(cookieKey, DAYS);
      window.dispatchEvent(new CustomEvent("lp:story-nudge:off"));
      setTimeout(() => setShow(false), 2200);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  const display = hovered ?? selected ?? 0;

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="h-px" />

      {show && (
        <div
          className="fixed inset-x-3 z-[51] mx-auto max-w-sm"
          style={{
            bottom: "max(0.75rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
            animation: "push-slide-up 0.3s ease both",
          }}
        >
          <div
            className="rounded-2xl p-4 shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {submitted ? (
              <div className="flex items-center gap-3 py-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(196,66,106,0.12)" }}
                >
                  <Star size={18} fill="#c4426a" style={{ color: "#c4426a" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    Thanks for rating!
                  </p>
                  {localCount > 0 && (
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {localAvg.toFixed(1)} ★ from {localCount} {localCount === 1 ? "reader" : "readers"}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Header row: icon + title + dismiss */}
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "rgba(196,66,106,0.12)" }}
                  >
                    <Star size={18} style={{ color: "#c4426a" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      How was this story?
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {isLoggedIn
                        ? "Tap a star — your rating helps others find great content."
                        : "Sign in to rate and help others find great content."}
                    </p>
                  </div>
                  <button
                    onClick={dismiss}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-60 shrink-0"
                    style={{ color: "var(--muted-foreground)" }}
                    aria-label="Dismiss"
                  >
                    <X size={15} />
                  </button>
                </div>

                {/* Action row: full-width stars or sign-in link */}
                {isLoggedIn ? (
                  <div
                    className="flex items-center justify-between pt-1"
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
                        aria-label={`${star} star${star !== 1 ? "s" : ""}`}
                        className="flex-1 flex justify-center py-2 transition-transform hover:scale-110 active:scale-95 disabled:opacity-50"
                      >
                        <Star
                          size={28}
                          fill={star <= display ? "#c4426a" : "none"}
                          style={{ color: star <= display ? "#c4426a" : "var(--muted-foreground)" }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Link
                    href="/signin"
                    onClick={dismiss}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "#c4426a" }}
                  >
                    <LogIn size={13} /> Sign in to rate
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
