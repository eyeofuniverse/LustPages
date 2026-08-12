import { getAdminStories } from "@/lib/queries";
import Link from "next/link";
import { PenSquare, Eye, Heart, MessageCircle, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { AdminStoryActions } from "@/components/admin/AdminStoryActions";
import { AdminStoriesFilters } from "@/components/admin/AdminStoriesFilters";
import { AdminStoryCover } from "@/components/admin/AdminStoryCover";
import { PromoteStoryButton } from "@/components/admin/PromoteStoryButton";
import { Suspense } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Stories" };

const PER_PAGE = 20;

interface Props {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminStoriesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const statusFilter = (sp.status as "all" | "published" | "draft" | "scheduled" | "pending" | "rejected") ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const { stories, total } = await getAdminStories({ take: PER_PAGE, skip, search, statusFilter });

  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/meminhaj/stories${qs ? `?${qs}` : ""}`;
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
            Stories
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {total} {total === 1 ? "story" : "stories"}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <Link
          href="/meminhaj/stories/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#c4426a" }}
        >
          <PenSquare size={15} />
          New Story
        </Link>
      </div>

      {/* Filters (search + status tabs) */}
      <Suspense>
        <AdminStoriesFilters total={total} />
      </Suspense>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {stories.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--muted-foreground)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--foreground)" }}>
              No stories found
            </p>
            <p className="text-sm">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Story</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Author</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Stats</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--muted-foreground)" }}>Updated</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider">Controls</th>
                </tr>
              </thead>
              <tbody>
                {stories.map((story) => (
                  <tr
                    key={story.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {/* Title + category */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        {story.coverImage && (
                          <AdminStoryCover
                            src={story.coverImage}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover shrink-0 hidden sm:block"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold line-clamp-1 text-sm" style={{ color: "var(--foreground)" }}>
                            {story.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            {story.categories.slice(0, 2).map((c) => (
                              <span
                                key={c.id}
                                className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                              >
                                {c.name}
                              </span>
                            ))}
                            {story.categories.length > 2 && (
                              <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                +{story.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Author */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {story.author.name}
                      </span>
                    </td>

                    {/* Stats */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1"><Eye size={11} /> {story.views.toLocaleString()}</span>
                        <span className="flex items-center gap-1"><Heart size={11} /> {story._count.likes}</span>
                        <span className="flex items-center gap-1"><MessageCircle size={11} /> {story._count.comments}</span>
                        {(story.ratingCount ?? 0) >= 1 && (
                          <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
                            <Star size={11} fill="#c4426a" />
                            {(story.ratingAvg ?? 0).toFixed(1)}
                            <span style={{ color: "var(--muted-foreground)", fontWeight: "normal" }}>({story.ratingCount})</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Updated */}
                    <td className="px-4 py-3 text-xs hidden lg:table-cell" style={{ color: "var(--muted-foreground)" }}>
                      {formatDateShort(story.updatedAt)}
                    </td>

                    {/* Inline controls */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <AdminStoryActions
                          story={{
                            id: story.id,
                            slug: story.slug,
                            published: story.published,
                            status: story.status,
                            scheduledAt: story.scheduledAt?.toISOString() ?? null,
                            commentsEnabled: story.commentsEnabled,
                          }}
                        />
                        {story.published && (
                          <PromoteStoryButton
                            storyId={story.id}
                            storyTitle={story.title}
                            storyExcerpt={story.excerpt}
                            storyUrl={`${process.env.SITE_URL}/stories/${story.slug}`}
                            coverImage={story.coverImage}
                            storyTags={story.storyTags
                              .filter((t) => t.isApproved)
                              .map((t) => t.name)}
                            compact
                          />
                        )}
                      </div>
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
              href={buildUrl(page - 1)}
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
                href={buildUrl(p as number)}
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
