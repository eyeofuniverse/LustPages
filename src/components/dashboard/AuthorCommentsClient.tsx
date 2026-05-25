"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Send, Trash2, X, BookOpen, MessageCircle } from "lucide-react";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
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
  story: { id: string; title: string; slug: string };
}

interface Props {
  comments: Comment[];
  userId: string;
}

export function AuthorCommentsClient({ comments: initial, userId }: Props) {
  const [comments, setComments] = useState(initial);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterStory, setFilterStory] = useState("all");

  const stories = Array.from(
    new Map(comments.map((c) => [c.story.id, c.story])).values()
  );

  const filtered = filterStory === "all" ? comments : comments.filter((c) => c.story.id === filterStory);

  async function handleReply(parentId: string) {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
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
      // noop
    } finally {
      setReplySubmitting(false);
    }
  }

  async function handleDelete(commentId: string, parentId?: string) {
    if (!confirm("Delete this comment?")) return;
    setDeletingId(commentId);
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
      // noop
    } finally {
      setDeletingId(null);
    }
  }

  if (comments.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <MessageCircle size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
        <p className="font-medium" style={{ color: "var(--foreground)" }}>No comments yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Comments on your stories will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Story filter */}
      {stories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilterStory("all")}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            style={{
              background: filterStory === "all" ? "rgba(196,66,106,0.12)" : "var(--card)",
              color: filterStory === "all" ? "#c4426a" : "var(--muted-foreground)",
              border: filterStory === "all" ? "1px solid rgba(196,66,106,0.3)" : "1px solid var(--border)",
            }}
          >
            All Stories ({comments.length})
          </button>
          {stories.map((s) => {
            const count = comments.filter((c) => c.story.id === s.id).length;
            return (
              <button
                key={s.id}
                onClick={() => setFilterStory(s.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: filterStory === s.id ? "rgba(196,66,106,0.12)" : "var(--card)",
                  color: filterStory === s.id ? "#c4426a" : "var(--muted-foreground)",
                  border: filterStory === s.id ? "1px solid rgba(196,66,106,0.3)" : "1px solid var(--border)",
                }}
              >
                {s.title.length > 30 ? s.title.slice(0, 30) + "…" : s.title} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Story label */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{ borderBottom: "1px solid var(--border)", background: "rgba(196,66,106,0.04)" }}
            >
              <BookOpen size={12} style={{ color: "#c4426a" }} />
              <Link
                href={`/stories/${comment.story.slug}`}
                target="_blank"
                className="text-xs font-medium truncate transition-opacity hover:opacity-75"
                style={{ color: "#c4426a" }}
              >
                {comment.story.title}
              </Link>
            </div>

            <div className="p-4">
              {/* Top-level comment */}
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                >
                  {comment.user.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                      {comment.user.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--muted-foreground)" }}>
                    {comment.content}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyText("");
                      }}
                      className="text-xs font-medium transition-opacity hover:opacity-75"
                      style={{ color: "#c4426a" }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingId === comment.id}
                      className="flex items-center gap-1 text-xs transition-opacity hover:opacity-75 disabled:opacity-40"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={11} /> Delete
                    </button>
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply…"
                        rows={2}
                        maxLength={1000}
                        autoFocus
                        className="flex-1 px-3 py-2 rounded-xl text-sm resize-none"
                        style={{
                          background: "var(--muted)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
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
                          className="px-3 py-2 rounded-xl text-xs"
                          style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Replies */}
              {comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 pl-11">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 pl-4" style={{ borderLeft: "2px solid var(--border)" }}>
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "rgba(196,66,106,0.10)", color: "#c4426a" }}
                      >
                        {reply.user.name[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                            {reply.user.name}
                          </span>
                          {reply.user.id === userId && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}>
                              You
                            </span>
                          )}
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                          {reply.content}
                        </p>
                        {reply.user.id === userId && (
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
        ))}
      </div>
    </div>
  );
}
