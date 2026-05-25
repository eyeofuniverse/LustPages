"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { BookOpen, X } from "lucide-react";

const KEY = (slug: string) => `lp:${slug}`;
const SAVE_THRESHOLD = 5;
const DONE_THRESHOLD = 92;
const SYNC_DELTA = 5;    // only sync when progress changed by this many %
const SYNC_DELAY = 4000; // debounce ms

function loadPct(slug: string): number | null {
  try {
    const raw = localStorage.getItem(KEY(slug));
    if (!raw) return null;
    const { pct } = JSON.parse(raw);
    return typeof pct === "number" ? pct : null;
  } catch {
    return null;
  }
}

function savePct(slug: string, pct: number) {
  try {
    localStorage.setItem(KEY(slug), JSON.stringify({ pct, savedAt: Date.now() }));
  } catch {}
}

function clearPct(slug: string) {
  try {
    localStorage.removeItem(KEY(slug));
  } catch {}
}

export function ReadingProgressTracker({
  slug,
  storyId,
  userId,
}: {
  slug: string;
  storyId?: string;
  userId?: string;
}) {
  const [progress, setProgress] = useState(0);
  const [resumePct, setResumePct] = useState<number | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const rafRef = useRef<number | null>(null);
  const lastSyncedRef = useRef<number | null>(null);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedSyncedRef = useRef(false);

  const calcPct = useCallback(() => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 0;
    return Math.min(100, Math.round((window.scrollY / docHeight) * 100));
  }, []);

  const syncToServer = useCallback(
    (pct: number, completed = false) => {
      if (!storyId || !userId) return;
      lastSyncedRef.current = pct;
      fetch(`/api/stories/${storyId}/read-progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progress: completed ? 100 : pct }),
      }).catch(() => {});
    },
    [storyId, userId]
  );

  // On mount: load resume point
  useEffect(() => {
    setProgress(calcPct());
    const saved = loadPct(slug);
    if (saved !== null && saved >= SAVE_THRESHOLD && saved < DONE_THRESHOLD) {
      setResumePct(saved);
      setBannerVisible(true);
      const timer = setTimeout(() => setBannerVisible(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [slug, calcPct]);

  // Scroll tracking + server sync
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        const pct = calcPct();
        setProgress(pct);

        if (pct >= DONE_THRESHOLD) {
          clearPct(slug);
          if (userId && storyId && !completedSyncedRef.current) {
            completedSyncedRef.current = true;
            if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
            syncToServer(100, true);
          }
        } else {
          if (pct >= SAVE_THRESHOLD) savePct(slug, pct);

          if (userId && storyId) {
            const last = lastSyncedRef.current;
            const delta = last === null ? pct : Math.abs(pct - last);
            if (delta >= SYNC_DELTA) {
              if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
              syncTimerRef.current = setTimeout(() => syncToServer(pct), SYNC_DELAY);
            }
          }
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [slug, calcPct, storyId, userId, syncToServer]);

  const jumpToSaved = () => {
    if (resumePct === null) return;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: (resumePct / 100) * docHeight, behavior: "smooth" });
    setBannerVisible(false);
  };

  return (
    <>
      {/* Reading progress bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-[3px] pointer-events-none"
        style={{
          width: `${progress}%`,
          background: "linear-gradient(to right, #c4426a, #e0587e)",
          transition: "width 80ms linear",
          boxShadow: progress > 0 ? "0 0 6px rgba(196,66,106,0.45)" : "none",
        }}
      />

      {/* Resume banner */}
      {bannerVisible && resumePct !== null && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            maxWidth: "calc(100vw - 2rem)",
          }}
        >
          <BookOpen size={15} style={{ color: "#c4426a", flexShrink: 0 }} />
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: "var(--foreground)" }}>
            You&apos;re {resumePct}% through this story
          </span>
          <button
            onClick={jumpToSaved}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ background: "#c4426a", flexShrink: 0 }}
          >
            Continue reading
          </button>
          <button
            onClick={() => setBannerVisible(false)}
            className="p-1 rounded-lg transition-opacity hover:opacity-60"
            style={{ color: "var(--muted-foreground)", flexShrink: 0 }}
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </>
  );
}
