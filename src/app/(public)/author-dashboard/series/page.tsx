import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateAuthorByUserId, getAuthorSeriesList, computeSeriesRating } from "@/lib/queries";
import { BookOpen, Lock, Settings, ArrowLeft, Plus, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Series — Author Dashboard" };

export default async function AuthorSeriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getOrCreateAuthorByUserId(session.user.id, session.user.name ?? "Author");

  const seriesList = await getAuthorSeriesList(author.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/author-dashboard"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to Dashboard
      </Link>

      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          My Series
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {seriesList.length} series total
        </p>
      </div>

      {seriesList.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No series yet</p>
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Create a series when writing a new story — use the Series panel in the story editor.
          </p>
          <Link
            href="/author-dashboard/stories/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}
          >
            <Plus size={15} /> Write a Story
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {seriesList.map((series) => {
            const rating = computeSeriesRating(series.stories);
            return (
              <div
                key={series.id}
                className="flex items-start gap-5 p-5 rounded-2xl"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Link
                      href={`/series/${series.slug}`}
                      className="font-bold text-lg transition-opacity hover:opacity-75"
                      style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                    >
                      {series.name}
                    </Link>
                    {series.isPremium ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
                      >
                        <Lock size={10} /> Premium · {series.coinPrice} coins
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      >
                        Free
                      </span>
                    )}
                    {series.isPremium && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {series.freeChapters} free {series.freeChapters === 1 ? "chapter" : "chapters"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span className="flex items-center gap-1">
                      <BookOpen size={12} /> {series._count.stories} published
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={12} /> {series._count.unlocks} unlocks
                    </span>
                    {rating.count >= 3 && (
                      <span className="font-semibold" style={{ color: "#c4426a" }}>
                        ★ {rating.avg.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <Link
                  href={`/author-dashboard/series/${series.id}/edit`}
                  className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-75"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                >
                  <Settings size={13} /> Series Settings
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
