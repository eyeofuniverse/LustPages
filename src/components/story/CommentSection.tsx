"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { getTopBadge } from "@/lib/badges";
import { BadgeChip } from "@/components/badges/BadgeIcon";
import { Send, MessageCircle, Reply, Trash2, Flag, X, ChevronDown } from "lucide-react";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
  badges?: { badgeId: string }[];
}

interface CommentReply {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
}

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: CommentUser;
  replies: CommentReply[];
}

interface Props {
  storyId: string;
  comments: Comment[];
  userId?: string;
  storyAuthorUserId?: string | null;
  isAdmin?: boolean;
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment / hate" },
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "other", label: "Other" },
];

export function CommentSection({ storyId, comments: initial, userId, storyAuthorUserId, isAdmin }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initial);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set());

  const totalCount = comments.reduce((sum, c) => sum + 1 + c.replies.length, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) { router.push("/login"); return; }
    if (!text.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/stories/${storyId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text.trim() }),
      });
      if (!res.ok) throw new Error();
      const comment = await res.json();
      setComments((prev) => [{ ...comment, replies: [] }, ...prev]);
      setText("");
    } catch {
      setError("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply(parentId: string) {
    if (!userId) { router.push("/login"); return; }
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    setReplyError(null);
    try {
      const res = await fetch(`/api/comments/${parentId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (!res.ok) throw new Error();
      const reply = await res.json();
      setComments((prev) =>
        prev.map((c) => c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c)
      );
      setReplyText("");
      setReplyingTo(null);
    } catch {
      setReplyError("Failed to post reply. Please try again.");
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleDelete(commentId: string, parentId?: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(commentId);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      if (parentId) {
        setComments((prev) =>
          prev.map((c) => c.id === parentId ? { ...c, replies: c.replies.filter((r) => r.id !== commentId) } : c)
        );
      } else {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch {
      setDeleteError("Failed to delete comment. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReport(commentId: string) {
    if (!userId) { router.push("/login"); return; }
    if (!reportReason) return;
    setReportSubmitting(true);
    try {
      const res = await fetch(`/api/stories/${storyId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason, commentId, type: "comment" }),
      });
      if (!res.ok) throw new Error();
      setReportedIds((prev) => new Set([...prev, commentId]));
      setReportingId(null);
      setReportReason("");
    } catch {
      // noop
    } finally {
      setReportSubmitting(false);
    }
  }

  function canDelete(commentUserId: string) {
    return userId === commentUserId || isAdmin || userId === storyAuthorUserId;
  }

  function Avatar({ name }: { name: string }) {
    return (
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
      >
        {name[0]?.toUpperCase()}
      </div>
    );
  }

  function SmallAvatar({ name }: { name: string }) {
    return (
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: "rgba(196,66,106,0.10)", color: "#c4426a" }}
      >
        {name[0]?.toUpperCase()}
      </div>
    );
  }

  return (
    <section className="mt-12 pt-10" style={{ borderTop: "1px solid var(--border)" }}>
      <h2
        className="text-xl font-bold mb-6 flex items-center gap-2"
        style={{ color: "var(--foreground)" }}
      >
        <MessageCircle size={20} style={{ color: "#c4426a" }} />
        Comments ({totalCount})
      </h2>

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <label htmlFor="comment-input" className="sr-only">Your comment</label>
        <textarea
          id="comment-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={userId ? "Share your thoughts…" : "Sign in to leave a comment"}
          disabled={!userId || submitting}
          rows={3}
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all mb-3"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            outline: "none",
          }}
        />
        {error && <p className="text-sm mb-2" style={{ color: "#c4426a" }}>{error}</p>}
        <div className="flex justify-end">
          {userId ? (
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: "#c4426a" }}
            >
              <Send size={14} />
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          ) : (
            <a
              href="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              Sign in to comment
            </a>
          )}
        </div>
      </form>

      {deleteError && (
        <p className="text-sm mb-4" style={{ color: "#ef4444" }}>{deleteError}</p>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: "var(--muted-foreground)" }}>
          Be the first to comment on this story.
        </p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id}>
              {/* Top-level comment */}
              <div className="flex gap-3">
                <Avatar name={comment.user.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {comment.user.name}
                    </span>
                    {comment.user.badges && comment.user.badges.length > 0 && (() => {
                      const top = getTopBadge(comment.user.badges.map((b) => b.badgeId));
                      return top ? <BadgeChip badgeId={top.id} /> : null;
                    })()}
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted-foreground)" }}>
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3">
                    {userId && (
                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === comment.id ? null : comment.id);
                          setReplyText("");
                          setReplyError(null);
                        }}
                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Reply size={12} /> Reply
                      </button>
                    )}
                    {canDelete(comment.user.id) && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75 disabled:opacity-40"
                        style={{ color: "#ef4444" }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                    {userId && userId !== comment.user.id && !reportedIds.has(comment.id) && (
                      <button
                        onClick={() => setReportingId(reportingId === comment.id ? null : comment.id)}
                        className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Flag size={12} /> Report
                      </button>
                    )}
                  </div>

                  {/* Report mini-form */}
                  {reportingId === comment.id && (
                    <div
                      className="mt-3 p-3 rounded-xl"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>Report reason</span>
                        <button onClick={() => setReportingId(null)}><X size={13} style={{ color: "var(--muted-foreground)" }} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {REPORT_REASONS.map((r) => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setReportReason(r.value)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            style={{
                              background: reportReason === r.value ? "rgba(196,66,106,0.15)" : "var(--card)",
                              color: reportReason === r.value ? "#c4426a" : "var(--muted-foreground)",
                              border: reportReason === r.value ? "1px solid rgba(196,66,106,0.3)" : "1px solid var(--border)",
                            }}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => handleReport(comment.id)}
                        disabled={!reportReason || reportSubmitting}
                        className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50"
                        style={{ background: "#ef4444" }}
                      >
                        {reportSubmitting ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <div className="flex-1 flex flex-col gap-1.5">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply…"
                        rows={2}
                        maxLength={1000}
                        className="w-full px-3 py-2 rounded-xl text-sm resize-none"
                        style={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
                      {replyError && (
                        <p className="text-xs" style={{ color: "#ef4444" }}>{replyError}</p>
                      )}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleReply(comment.id)}
                          disabled={!replyText.trim() || replySubmitting}
                          className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50"
                          style={{ background: "#c4426a" }}
                        >
                          {replySubmitting ? "…" : <Send size={13} />}
                        </button>
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-2 rounded-xl text-xs font-medium"
                          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Replies */}
                  {comment.replies.length > 0 && (
                    <div className="mt-4 space-y-3 pl-4" style={{ borderLeft: "2px solid var(--border)" }}>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-2.5">
                          <SmallAvatar name={reply.user.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                              <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                                {reply.user.name}
                              </span>
                              {reply.user.badges && reply.user.badges.length > 0 && (() => {
                                const top = getTopBadge(reply.user.badges.map((b) => b.badgeId));
                                return top ? <BadgeChip badgeId={top.id} /> : null;
                              })()}
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                              {reply.content}
                            </p>
                            {canDelete(reply.user.id) && (
                              <button
                                onClick={() => handleDelete(reply.id, comment.id)}
                                disabled={deletingId === reply.id}
                                className="flex items-center gap-1 text-xs mt-1 transition-opacity hover:opacity-75 disabled:opacity-40"
                                style={{ color: "#ef4444" }}
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
