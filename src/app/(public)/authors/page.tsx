import { getAuthors } from "@/lib/queries";
import { AdSlot } from "@/components/ads/AdSlot";
import { AuthorsClient } from "@/components/author/AuthorsClient";
import { PenSquare } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 3600;

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Authors — LustPages",
  description:
    "Meet the talented authors writing adult fiction and erotica on LustPages. Browse profiles, discover new writers, and follow your favourites.",
  keywords: ["erotica authors", "adult fiction writers", "lustpages authors", "erotic fiction writers"],
  alternates: { canonical: `${BASE}/authors` },
  openGraph: {
    title: "Authors — LustPages",
    description:
      "Meet the talented authors writing adult fiction and erotica on LustPages.",
    type: "website",
    url: `${BASE}/authors`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630, alt: "Authors on LustPages" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authors — LustPages",
    description:
      "Meet the talented authors writing adult fiction and erotica on LustPages.",
    images: [`${BASE}/og-default.jpg`],
  },
};

export default async function AuthorsPage() {
  const authors = await getAuthors();

  const totalStories = authors.reduce((sum, a) => sum + a._count.stories, 0);

  function fmt(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Authors — LustPages",
            description:
              "Meet the talented authors writing adult fiction on LustPages.",
            url: `${BASE}/authors`,
          }),
        }}
      />
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="p-3 rounded-2xl shrink-0 mt-1"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            <PenSquare size={22} style={{ color: "#c4426a" }} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{
                fontFamily: "var(--font-playfair), serif",
                color: "var(--foreground)",
              }}
            >
              Meet the Authors
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {authors.length} passionate writers crafting stories just for you
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {[
            { label: "Authors", value: String(authors.length) },
            { label: "Stories Published", value: String(totalStories) },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5 px-4 text-center"
              style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
            >
              <span
                className="text-2xl sm:text-3xl font-bold mb-0.5"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  color: "#c4426a",
                }}
              >
                {stat.value}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <AdSlot identifier="authors_list_banner" />

      {/* ── Authors grid (client — handles search + sort) ────────── */}
      <AuthorsClient authors={authors} />
    </div>
    </>
  );
}
