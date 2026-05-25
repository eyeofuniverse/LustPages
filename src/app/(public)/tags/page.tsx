import { getAllTags } from "@/lib/queries";
import { TagsBrowser } from "@/components/story/TagsBrowser";
import { Hash, BookOpen } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Tags — LustPages",
  description: "Explore all story tags on LustPages. Find adult fiction by theme, genre, and more.",
  alternates: { canonical: "https://lustpages.com/tags" },
};

export const revalidate = 300;

export default async function TagsIndexPage() {
  const rawTags = await getAllTags();
  const tags = rawTags.map((t) => ({
    tag: t.tag,
    count: t.count,
    name: t.name,
    tier: t.tier,
    id: t.id,
  }));

  const totalStories = tags.reduce((sum, t) => sum + t.count, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="p-3 rounded-2xl shrink-0 mt-1"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            <Hash size={22} style={{ color: "#c4426a" }} />
          </div>
          <div>
            <h1
              className="text-3xl sm:text-4xl font-bold mb-1"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Browse Tags
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Explore stories by theme, mood, and genre
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="grid grid-cols-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {[
            { label: "Unique Tags", value: String(tags.length) },
            { label: "Tagged Stories", value: String(totalStories) },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center py-5"
              style={i > 0 ? { borderLeft: "1px solid var(--border)" } : undefined}
            >
              <span
                className="text-2xl font-bold mb-0.5"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
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

      {tags.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BookOpen size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium" style={{ color: "var(--foreground)" }}>No tags yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Tags will appear here as stories are published.
          </p>
        </div>
      ) : (
        <TagsBrowser tags={tags} />
      )}
    </div>
  );
}
