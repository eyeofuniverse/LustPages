import { getAdminRatings } from "@/lib/queries";
import Link from "next/link";
import { Star, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { RatingDeleteButton } from "@/components/admin/RatingDeleteButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Ratings" };

const PER_PAGE = 25;

const STAR_FILTERS = [
  { label: "All", value: undefined },
  { label: "5★", value: 5 },
  { label: "4★", value: 4 },
  { label: "3★", value: 3 },
  { label: "2★", value: 2 },
  { label: "1★", value: 1 },
];

interface Props {
  searchParams: Promise<{ q?: string; rating?: string; page?: string }>;
}

export default async function AdminRatingsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const ratingFilter = sp.rating ? Math.min(5, Math.max(1, parseInt(sp.rating, 10))) : undefined;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const { ratings, total } = await getAdminRatings({ take: PER_PAGE, skip, search, ratingFilter });
  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(overrides: { q?: string; rating?: string; page?: number }) {
    const params = new URLSearchParams();
    const q = "q" in overrides ? overrides.q : search;
    const r = "rating" in overrides ? overrides.rating : sp.rating;
    const p = "page" in overrides ? overrides.page : page;
    if (q) params.set("q", q);
    if (r) params.set("rating", r);
    if (p && p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/meminhaj/ratings${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Ratings
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {total.toLocaleString()} {total === 1 ? "rating" : "ratings"}
            {search && ` matching "${search}"`}
            {ratingFilter && ` — ${ratingFilter} star only`}
          </p>
        </div>
      </div>

      {/* Search + star filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form action="/meminhaj/ratings" className="flex-1 min-w-[200px]">
          {sp.rating && <input type="hidden" name="rating" value={sp.rating} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by story title or reader name…"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {STAR_FILTERS.map(({ label, value }) => {
            const isActive = ratingFilter === value;
            return (
              <Link
                key={label}
                href={buildUrl({ rating: value ? String(value) : undefined, page: 1 })}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive ? "#c4426a" : "var(--card)",
                  color: isActive ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {ratings.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--muted-foreground)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--foreground)" }}>
              No ratings found
            </p>
            <p className="text-sm">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Story</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Reader</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {ratings.map((rating) => (
                  <tr
                    key={rating.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {/* Story */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <Link
                          href={`/stories/${rating.story.slug}`}
                          target="_blank"
                          className="font-medium text-sm line-clamp-1 hover:opacity-75 flex items-center gap-1"
                          style={{ color: "var(--foreground)" }}
                        >
                          {rating.story.title}
                          <ExternalLink size={11} className="shrink-0 opacity-50" />
                        </Link>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          by {rating.story.author.name}
                        </p>
                      </div>
                    </td>

                    {/* Reader */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      {rating.user ? (
                        <div className="min-w-0">
                          <p className="text-sm truncate" style={{ color: "var(--foreground)" }}>
                            {rating.user.name ?? "—"}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                            {rating.user.email}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Anonymous</span>
                      )}
                    </td>

                    {/* Rating stars */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            fill={s <= rating.value ? "#c4426a" : "transparent"}
                            style={{ color: s <= rating.value ? "#c4426a" : "var(--border)" }}
                          />
                        ))}
                        <span className="ml-1 text-xs font-semibold" style={{ color: "#c4426a" }}>
                          {rating.value}/5
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                      {formatDateShort(rating.createdAt)}
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-3 text-right">
                      <RatingDeleteButton id={rating.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-6" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              <ChevronLeft size={14} /> Prev
            </Link>
          )}
          {buildPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-2 text-sm" style={{ color: "var(--muted-foreground)" }}>…</span>
            ) : (
              <Link
                key={p}
                href={buildUrl({ page: p as number })}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  background: p === page ? "#c4426a" : "var(--card)",
                  color: p === page ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages && (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              Next <ChevronRight size={14} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
