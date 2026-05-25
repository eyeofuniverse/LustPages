"use client";

import { useEffect } from "react";
import Link from "next/link";
import { BookOpen, RefreshCw, ArrowLeft } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-center"
      style={{ background: "var(--background)" }}
    >
      <div>
        <Link href="/" className="inline-flex items-center gap-2 mb-8 justify-center">
          <BookOpen size={22} style={{ color: "#c4426a" }} />
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
          >
            LustPages
          </span>
        </Link>
        <h1
          className="text-6xl font-bold mb-4"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          500
        </h1>
        <p className="text-lg mb-2" style={{ color: "var(--foreground)" }}>
          Something went wrong
        </p>
        <p className="mb-8 max-w-sm mx-auto" style={{ color: "var(--muted-foreground)" }}>
          An unexpected error occurred. Please try again or return to the home page.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: "#c4426a" }}
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
