import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";
import alternatives from "@/data/alternatives";
import type { Metadata } from "next";

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Adult Fiction Site Alternatives — LustPages",
  description:
    "Looking for a Literotica, AO3, Wattpad, or Adult FanFiction alternative? Compare LustPages side-by-side and find the best adult fiction site for you.",
  keywords: [
    "adult fiction site alternatives",
    "literotica alternative",
    "ao3 alternative",
    "wattpad alternative for adults",
    "adult fanfiction alternative",
    "best adult fiction sites",
  ],
  alternates: { canonical: `${BASE}/alternatives` },
  openGraph: {
    title: "Adult Fiction Site Alternatives — LustPages",
    description:
      "Compare LustPages to Literotica, AO3, Wattpad, and Adult FanFiction. Find the best adult fiction platform for modern readers.",
    type: "website",
    url: `${BASE}/alternatives`,
    siteName: "LustPages",
  },
  twitter: {
    card: "summary_large_image",
    title: "Adult Fiction Site Alternatives — LustPages",
    description: "Compare LustPages to the most popular adult fiction platforms.",
  },
};

export default function AlternativesIndexPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>

      {/* Hero */}
      <div
        className="py-16 px-4"
        style={{
          background: "linear-gradient(180deg, rgba(196,66,106,0.08) 0%, transparent 100%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
          >
            <BookOpen size={12} /> Platform comparisons
          </div>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Looking for an adult fiction site alternative?
          </h1>
          <p className="text-base sm:text-lg" style={{ color: "var(--muted-foreground)" }}>
            We've written honest, detailed comparisons between LustPages and the most popular adult fiction platforms.
            Find the right one for you.
          </p>
        </div>
      </div>

      {/* Cards */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-4">
          {alternatives.map((alt) => (
            <Link
              key={alt.slug}
              href={`/alternatives/${alt.slug}`}
              className="block rounded-2xl p-5 sm:p-6 transition-opacity hover:opacity-80"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "#c4426a" }}>
                    vs. {alt.competitor}
                  </p>
                  <h2
                    className="text-base sm:text-lg font-bold mb-2"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    {alt.headline}
                  </h2>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    {alt.metaDescription}
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 mt-1" style={{ color: "var(--muted-foreground)" }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className="mt-12 p-6 sm:p-8 rounded-2xl text-center"
          style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
        >
          <h2
            className="text-lg sm:text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Already convinced? Start reading.
          </h2>
          <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
            LustPages is free. Dark mode. Mobile-first. No credit card needed.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              Create free account <ChevronRight size={15} />
            </Link>
            <Link
              href="/stories"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              Browse stories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
