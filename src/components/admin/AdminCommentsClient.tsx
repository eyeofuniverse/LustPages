"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Trash2, BookOpen, MessageCircle, ChevronDown, ChevronRight } from "lucide-react";

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
}

export function AdminCommentsClient({ comments: initial }: Props) {
  const [comments, setComments] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const filtered = search
    ? comments.filter(
        (c) =>
          c.user.name.toLowerCase().includes(search.toLowerCase()) ||
          c.content.toLowerCase().includes(search.toLowerCase()) ||
          c.story.title.toLowerCase().includes(search.toLowerCase())
      )
    : comments;

  async function handleDelete(commentId: string, parentId?: string) {
    if (!confirm("Delete this comment and all its replies?")) return;
    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
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

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (comments.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <MessageCircle size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
        <p className="font-medium" style={{ color: "var(--foreground)" }}>No comments yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user, content, or story…"
          className="w-full px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
            outline: "none",
          }}
        />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>User</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Comment</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Story</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((comment) => (
                <React.Fragment key={comment.id}>
                  <tr
                    className="transition-colors"
                    style={{ borderBottom: comment.replies.length > 0 && expanded.has(comment.id) ? "none" : "1px solid var(--border)" }}
                  >
                    <td className="px-4 py-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                      >
                        {comment.user.name[0]?.toUpperCase()}
                      </div>
                      <span className="text-xs mt-1 block" style={{ color: "var(--foreground)" }}>
                        {comment.user.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-sm line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                        {comment.content}
                      </p>
                      {comment.replies.length > 0 && (
                        <button
                          onClick={() => toggleExpand(comment.id)}
                          className="flex items-center gap-1 text-xs mt-1 transition-opacity hover:opacity-75"
                          style={{ color: "#c4426a" }}
                        >
                          {expanded.has(comment.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                          {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Link
                        href={`/stories/${comment.story.slug}`}
                        target="_blank"
                        className="text-xs transition-opacity hover:opacity-75 flex items-center gap-1"
                        style={{ color: "#c4426a" }}
                      >
                        <BookOpen size={11} />
                        <span className="line-clamp-2">{comment.story.title}</span>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                      {formatDate(comment.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={deletingId === comment.id}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </td>
                  </tr>
                  {comment.replies.length > 0 && expanded.has(comment.id) && comment.replies.map((reply, ri) => (
                    <tr
                      key={`reply-${reply.id}`}
                      style={{
                        borderBottom: ri === comment.replies.length - 1 ? "1px solid var(--border)" : "none",
                        background: "rgba(196,66,106,0.02)",
                      }}
                    >
                      <td className="px-4 py-2 pl-10">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "rgba(196,66,106,0.08)", color: "#c4426a" }}
                        >
                          {reply.user.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs mt-0.5 block" style={{ color: "var(--muted-foreground)" }}>
                          {reply.user.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 max-w-xs" colSpan={2}>
                        <p className="text-xs line-clamp-2 italic" style={{ color: "var(--muted-foreground)" }}>
                          ↳ {reply.content}
                        </p>
                      </td>
                      <td className="px-4 py-2 text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                        {formatDate(reply.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => handleDelete(reply.id, comment.id)}
                          disabled={deletingId === reply.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
