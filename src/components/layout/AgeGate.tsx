"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";

const COOKIE_KEY = "lustpages_age_verified";

export function AgeGate() {
  const [show, setShow] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!Cookies.get(COOKIE_KEY)) setShow(true);
  }, []);

  function handleConfirm() {
    if (!checked) return;
    Cookies.set(COOKIE_KEY, "1", { expires: 365 });
    setShow(false);
  }

  function handleDecline() {
    window.location.href = "https://www.google.com";
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 25px 60px rgba(0,0,0,0.8)" }}
      >
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #c4426a, #6366f1)" }} />

        <div className="p-8">
          {/* Brand */}
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{ background: "rgba(196,66,106,0.12)", border: "1px solid rgba(196,66,106,0.25)" }}
            >
              <span className="text-2xl font-bold" style={{ color: "#c4426a", fontFamily: "var(--font-playfair), serif" }}>LP</span>
            </div>
            <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
              LustPages
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Premium Adult Fiction</p>
          </div>

          {/* Warning box */}
          <div
            className="rounded-xl p-4 mb-6"
            style={{ background: "rgba(196,66,106,0.07)", border: "1px solid rgba(196,66,106,0.2)" }}
          >
            <p className="text-center font-bold mb-2 text-base" style={{ color: "#c4426a" }}>
              Adults Only — 18+
            </p>
            <p className="text-sm text-center leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              This website contains <strong style={{ color: "var(--foreground)" }}>sexually explicit adult content</strong>. You must be at least 18 years old (or the age of majority in your jurisdiction) to enter.
            </p>
          </div>

          {/* Disclaimers */}
          <div className="rounded-xl p-4 mb-5 text-xs space-y-1.5" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
            <p>✓ All characters depicted in sexual situations are fictional adults (18+)</p>
            <p>✓ All story content is fiction and does not depict real events or persons</p>
            <p>✓ Accessing this site may be illegal in certain jurisdictions — you are responsible for compliance with your local laws</p>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 mb-5 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{
                  background: checked ? "#c4426a" : "transparent",
                  border: checked ? "2px solid #c4426a" : "2px solid var(--border)",
                }}
              >
                {checked && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              I confirm I am <strong style={{ color: "var(--foreground)" }}>18 years of age or older</strong>, I wish to view adult content, and I agree to the{" "}
              <Link href="/terms" target="_blank" className="underline" style={{ color: "#c4426a" }}>Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" target="_blank" className="underline" style={{ color: "#c4426a" }}>Privacy Policy</Link>.
            </span>
          </label>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirm}
              disabled={!checked}
              className="w-full py-3.5 px-6 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: checked ? "#c4426a" : "var(--muted)",
                color: checked ? "white" : "var(--muted-foreground)",
                cursor: checked ? "pointer" : "not-allowed",
                opacity: checked ? 1 : 0.6,
              }}
            >
              <ShieldCheck size={16} />
              I am 18+ — Enter Site
            </button>
            <button
              onClick={handleDecline}
              className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 hover:opacity-75"
              style={{ background: "transparent", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              <LogOut size={15} />
              I am under 18 — Leave
            </button>
          </div>

          {/* Legal links */}
          <div className="mt-5 flex items-center justify-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <Link href="/content-warning" target="_blank" className="underline hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
              Content Warning
            </Link>
            <span>·</span>
            <Link href="/terms" target="_blank" className="underline hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
              Terms
            </Link>
            <span>·</span>
            <Link href="/privacy" target="_blank" className="underline hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
