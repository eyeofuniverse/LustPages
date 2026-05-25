import { getStoriesByStatus, getPendingStoriesCount } from "@/lib/queries";
import Link from "next/link";
import { formatDateShort } from "@/lib/utils";
import { ApprovalActions } from "@/components/admin/ApprovalActions";
import { AdminStoryCover } from "@/components/admin/AdminStoryCover";
import {
  Clock, Eye, Heart, Edit, CheckCircle, XCircle,
  AlertCircle, FileText, BookOpen,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Story Approvals" };

interface Props {
  searchParams: Promise<{ status?: string }>;
}

const TAB_CONFIG = [
  { key: "pending", label: "Pending", icon: AlertCircle, color: "#6366f1" },
  { key: "approved", label: "Approved", icon: CheckCircle, color: "#22c55e" },
  { key: "rejected", label: "Rejected", icon: XCircle, color: "#ef4444" },
  { key: "draft", label: "Drafts", icon: FileText, color: "#eab308" },
  { key: "all", label: "All", icon: BookOpen, color: "#c4426a" },
] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "#eab308", bg: "rgba(234,179,8,0.1)" },
  pending: { label: "Pending Review", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
  approved: { label: "Published", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  rejected: { label: "Rejected", color: "#ef4444", bg: "rgba(239,68,68,0.1)" },
};

export default async function ApprovalsPage({ searchParams }: Props) {
  const { status: rawStatus } = await searchParams;
  const activeStatus = TAB_CONFIG.some((t) => t.key === rawStatus) ? rawStatus! : "pending";

  const [stories, pendingCount] = await Promise.all([
    getStoriesByStatus(activeStatus),
    getPendingStoriesCount(),
  ]);

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Story Approvals
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Review, approve or reject author-submitted stories
            </p>
          </div>
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <AlertCircle size={14} />
              {pendingCount} awaiting review
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {TAB_CONFIG.map(({ key, label, icon: Icon, color }) => {
          const active = activeStatus === key;
          return (
            <Link
              key={key}
              href={`/meminhaj/approvals?status=${key}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? color + "20" : "transparent",
                color: active ? color : "var(--muted-foreground)",
                border: active ? `1px solid ${color}40` : "1px solid transparent",
              }}
            >
              <Icon size={12} />
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: color + "25", color }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Story list */}
      {stories.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BookOpen size={36} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium" style={{ color: "var(--foreground)" }}>
            No stories with status &quot;{activeStatus}&quot;
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {activeStatus === "pending"
              ? "All caught up! No stories awaiting review."
              : "Nothing to show here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {stories.map((story) => {
            const cfg = STATUS_CONFIG[story.status] ?? STATUS_CONFIG.draft;
            return (
              <div
                key={story.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {/* Top bar */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid var(--border)", background: cfg.bg + "50" }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}40` }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      By{" "}
                      <Link
                        href={`/authors/${story.author.slug}`}
                        className="transition-opacity hover:opacity-70"
                        style={{ color: "#c4426a" }}
                      >
                        {story.author.name}
                      </Link>
                    </span>
                    {story.submittedAt && (
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        · Submitted {formatDateShort(story.submittedAt)}
                      </span>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {story.status === "pending" && (
                      <ApprovalActions storyId={story.id} storyTitle={story.title} />
                    )}
                    <Link
                      href={`/meminhaj/stories/${story.id}/edit`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
                      style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                    >
                      <Edit size={12} /> Edit
                    </Link>
                    {story.status === "approved" && (
                      <Link
                        href={`/stories/${story.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
                        style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                      >
                        <Eye size={12} /> View Live
                      </Link>
                    )}
                  </div>
                </div>

                {/* Story details */}
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    {/* Cover thumb */}
                    {story.coverImage && (
                      <div
                        className="w-16 h-16 rounded-xl overflow-hidden shrink-0"
                        style={{ background: "var(--muted)" }}
                      >
                        <AdminStoryCover
                          src={story.coverImage}
                          alt={story.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {story.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              background: cat.color + "20",
                              color: cat.color,
                              border: `1px solid ${cat.color}40`,
                            }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>

                      <h3
                        className="font-bold text-base mb-1"
                        style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                      >
                        {story.title}
                      </h3>

                      <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--muted-foreground)" }}>
                        {story.excerpt}
                      </p>

                      {/* Rejection reason */}
                      {story.rejectionReason && (
                        <div
                          className="flex items-start gap-2 p-3 rounded-xl mb-3"
                          style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)" }}
                        >
                          <XCircle size={13} className="shrink-0 mt-0.5" style={{ color: "#ef4444" }} />
                          <div>
                            <p className="text-xs font-semibold mb-0.5" style={{ color: "#ef4444" }}>
                              Rejection Reason
                            </p>
                            <p className="text-xs" style={{ color: "var(--foreground)" }}>
                              {story.rejectionReason}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {story.readingTime}m read
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={11} /> {story.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {story._count.likes} likes
                        </span>
                        <span>Updated {formatDateShort(story.updatedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
