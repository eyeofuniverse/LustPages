"use client";

import Link from "next/link";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        Dashboard error
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        Something went wrong loading your dashboard.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#c4426a" }}
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
