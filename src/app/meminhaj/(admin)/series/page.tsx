import { getAdminSeriesList } from "@/lib/queries";
import Link from "next/link";
import { BookOpen, Lock, Settings, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Series" };

const PER_PAGE = 20;

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminSeriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const { series, total } = await getAdminSeriesList({ take: PER_PAGE, skip, search });
  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/meminhaj/series${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Series
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {total} {total === 1 ? "series" : "series total"}
            {search && ` matching "${search}"`}
          </p>
        </div>

        <form method="get" className="flex gap-2">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search series…"
            className="px-3 py-2 rounded-xl text-sm"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)", width: 200 }}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}
          >
            Search
          </button>
        </form>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {series.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--muted-foreground)" }}>
            <BookOpen size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
            <p className="font-medium" style={{ color: "var(--foreground)" }}>No series found</p>
            <p className="text-sm mt-1">Try a different search term.</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {series.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-4 px-5 py-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      href={`/series/${s.slug}`}
                      target="_blank"
                      className="font-semibold text-sm transition-opacity hover:opacity-75"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                    >
                      {s.name}
                    </Link>
                    {s.isPremium ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                      >
                        <Lock size={10} /> Premium · {s.coinPrice} coins
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      >
                        Free
                      </span>
                    )}
                    {s.isPremium && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {s.freeChapters} free {s.freeChapters === 1 ? "chapter" : "chapters"}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>By {s.author.name}</span>
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} /> {s._count.stories} stories
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {s._count.unlocks} unlocks
                    </span>
                  </div>
                </div>

                <Link
                  href={`/meminhaj/series/${s.id}/edit`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-75"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  <Settings size={12} /> Edit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-6">
          {page > 1 && (
            <Link
              href={buildUrl(page - 1)}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              <ChevronLeft size={14} /> Prev
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={buildUrl(page + 1)}
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
