"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const COOKIE_KEY = "lustpages_age_verified";

export function AgeGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!Cookies.get(COOKIE_KEY)) setShow(true);
  }, []);

  function handleConfirm() {
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
      style={{ background: "rgba(0,0,0,0.97)", backdropFilter: "blur(8px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8 text-center animate-fade-in"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="mb-6">
          <span
            className="inline-block text-5xl mb-4"
            style={{ fontFamily: "var(--font-playfair), serif" }}
          >
            🔞
          </span>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "#c4426a",
            }}
          >
            LustPages
          </h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Premium Adult Fiction
          </p>
        </div>

        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            Adults Only (18+)
          </p>
          <p>
            This website contains sexually explicit adult content. You must be
            at least 18 years old (or the age of majority in your jurisdiction)
            to enter.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{ background: "#c4426a" }}
          >
            I am 18+ — Enter
          </button>
          <button
            onClick={handleDecline}
            className="w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 hover:opacity-75"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            I am under 18 — Exit
          </button>
        </div>

        <p className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          By entering, you agree to our Terms of Service and confirm you are of
          legal age to view adult content in your jurisdiction.
        </p>
      </div>
    </div>
  );
}
