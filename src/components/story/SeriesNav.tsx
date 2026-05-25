import Link from "next/link";
import { BookOpen, ChevronLeft, ChevronRight, List } from "lucide-react";

interface SeriesPart {
  id: string;
  title: string;
  slug: string;
  chapterNumber: number | null;
}

interface SeriesNavProps {
  series: {
    id: string;
    name: string;
    slug: string;
    stories: SeriesPart[];
  };
  currentStoryId: string;
  currentChapter: number | null;
}

export function SeriesNav({ series, currentStoryId, currentChapter }: SeriesNavProps) {
  const parts = series.stories;
  if (parts.length === 0) return null;

  const currentIndex = parts.findIndex((p) => p.id === currentStoryId);
  const prev = currentIndex > 0 ? parts[currentIndex - 1] : null;
  const next = currentIndex < parts.length - 1 ? parts[currentIndex + 1] : null;
  const partNumber = currentChapter ?? currentIndex + 1;

  return (
    <div
      className="rounded-2xl overflow-hidden my-8"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(196,66,106,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <BookOpen size={14} style={{ color: "#c4426a" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Series
          </span>
        </div>
        <Link
          href={`/series/${series.slug}`}
          className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-75"
          style={{ color: "#c4426a" }}
        >
          <List size={12} />
          View all {parts.length} parts
        </Link>
      </div>

      {/* Series name + current position */}
      <div className="px-5 py-4">
        <Link
          href={`/series/${series.slug}`}
          className="font-bold text-base transition-opacity hover:opacity-75 block mb-1"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {series.name}
        </Link>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          Part {partNumber} of {parts.length}
        </p>
      </div>

      {/* Prev / Next navigation */}
      {(prev || next) && (
        <div
          className="grid gap-px"
          style={{
            gridTemplateColumns: prev && next ? "1fr 1fr" : "1fr",
            borderTop: "1px solid var(--border)",
          }}
        >
          {prev && (
            <Link
              href={`/stories/${prev.slug}`}
              className="flex items-center gap-3 px-5 py-3.5 transition-opacity hover:opacity-75 group"
              style={{ borderRight: next ? "1px solid var(--border)" : "none" }}
            >
              <ChevronLeft size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
              <div className="min-w-0">
                <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                  Previous · Part {prev.chapterNumber ?? currentIndex}
                </p>
                <p
                  className="text-sm font-semibold truncate group-hover:opacity-75 transition-opacity"
                  style={{ color: "var(--foreground)" }}
                >
                  {prev.title}
                </p>
              </div>
            </Link>
          )}
          {next && (
            <Link
              href={`/stories/${next.slug}`}
              className="flex items-center justify-end gap-3 px-5 py-3.5 transition-opacity hover:opacity-75 group"
            >
              <div className="min-w-0 text-right">
                <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>
                  Next · Part {next.chapterNumber ?? currentIndex + 2}
                </p>
                <p
                  className="text-sm font-semibold truncate group-hover:opacity-75 transition-opacity"
                  style={{ color: "var(--foreground)" }}
                >
                  {next.title}
                </p>
              </div>
              <ChevronRight size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            </Link>
          )}
        </div>
      )}

      {/* All parts mini-list (collapsed to 4, link to full series page) */}
      {parts.length > 1 && (
        <div style={{ borderTop: "1px solid var(--border)" }}>
          <div className="px-5 pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
              All Parts
            </p>
          </div>
          <div className="pb-3">
            {parts.slice(0, 5).map((part, idx) => {
              const isCurrent = part.id === currentStoryId;
              return (
                <Link
                  key={part.id}
                  href={`/stories/${part.slug}`}
                  className="flex items-center gap-3 px-5 py-2 transition-opacity hover:opacity-75"
                  style={{
                    background: isCurrent ? "rgba(196,66,106,0.08)" : "transparent",
                    pointerEvents: isCurrent ? "none" : "auto",
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      background: isCurrent ? "#c4426a" : "var(--muted)",
                      color: isCurrent ? "white" : "var(--muted-foreground)",
                    }}
                  >
                    {part.chapterNumber ?? idx + 1}
                  </span>
                  <span
                    className="text-sm truncate"
                    style={{
                      color: isCurrent ? "#c4426a" : "var(--foreground)",
                      fontWeight: isCurrent ? 600 : 400,
                    }}
                  >
                    {part.title}
                  </span>
                  {isCurrent && (
                    <span
                      className="text-xs ml-auto shrink-0 px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}
                    >
                      Reading
                    </span>
                  )}
                </Link>
              );
            })}
            {parts.length > 5 && (
              <div className="px-5 pt-2">
                <Link
                  href={`/series/${series.slug}`}
                  className="text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                >
                  +{parts.length - 5} more parts →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
