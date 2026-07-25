"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { BookOpen, X, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

const COOKIE = "lp_nudge";
const DAYS = 10;
const DELAY_MS = 5000;

function getCookie(name: string) {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((r) => r.startsWith(name + "="));
}

function setCookie(name: string, days: number) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=1; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
}

export function SignInNudge() {
  const { data: session, status } = useSession();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (session?.user) return;
    if (getCookie(COOKIE)) return;

    const t = setTimeout(() => {
      if (!getCookie(COOKIE)) setShow(true);
    }, DELAY_MS);

    // Hide ourselves if the story-end nudge appears (it has its own sign-in CTA)
    const hideForStory = () => setShow(false);
    window.addEventListener("lp:story-nudge:on", hideForStory);

    return () => {
      clearTimeout(t);
      window.removeEventListener("lp:story-nudge:on", hideForStory);
    };
  }, [session, status]);

  function dismiss() {
    setCookie(COOKIE, DAYS);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm"
      style={{ bottom: "max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))", animation: "push-slide-up 0.3s ease both" }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl flex items-start gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(196,66,106,0.12)" }}
        >
          <BookOpen size={18} style={{ color: "#c4426a" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--foreground)" }}>
            Join LustPages for free
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            Like, bookmark, rate stories, and build your personal reading list.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/register"
              onClick={dismiss}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              <UserPlus size={12} /> Create account
            </Link>
            <Link
              href="/signin"
              onClick={dismiss}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
              style={{
                color: "var(--foreground)",
                background: "var(--muted)",
                border: "1px solid var(--border)",
              }}
            >
              <LogIn size={12} /> Sign in
            </Link>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="p-1 rounded-lg transition-opacity hover:opacity-60 shrink-0"
          style={{ color: "var(--muted-foreground)" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
