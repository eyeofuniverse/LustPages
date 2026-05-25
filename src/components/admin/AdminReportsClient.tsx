"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Flag, CheckCircle, XCircle, Trash2, BookOpen, MessageSquare } from "lucide-react";

interface Report {
  id: string;
  type: string;
  reason: string;
  description: string | null;
  status: string;
  createdAt: Date;
  user: { id: string; name: string };
  story: { id: string; title: string; slug: string } | null;
  comment: { id: string; content: string; user: { name: string } } | null;
}

interface Props {
  reports: Report[];
  activeStatus: string;
}

const REASON_LABELS: Record<string, string> = {
  spam: "Spam",
  inappropriate_content: "Inappropriate Content",
  copyright: "Copyright Violation",
  harassment: "Harassment / Hate",
  underage_content: "Underage Content",
  other: "Other",
};

export function AdminReportsClient({ reports: initial, activeStatus }: Props) {
  const [reports, setReports] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(reportId: string, status: string) {
    setLoadingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      // noop
    } finally {
      setLoadingId(null);
    }
  }

  async function deleteReport(reportId: string) {
    if (!confirm("Delete this report?")) return;
    setLoadingId(reportId);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch {
      // noop
    } finally {
      setLoadingId(null);
    }
  }

  if (reports.length === 0) {
    return (
      <div
        className="text-center py-20 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <Flag size={36} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
        <p className="font-medium" style={{ color: "var(--foreground)" }}>
          No {activeStatus !== "all" ? activeStatus : ""} reports
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* Header */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
            style={{ borderBottom: "1px solid var(--border)", background: "rgba(239,68,68,0.03)" }}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: report.type === "story" ? "rgba(196,66,106,0.12)" : "rgba(99,102,241,0.12)",
                  color: report.type === "story" ? "#c4426a" : "#6366f1",
                }}
              >
                {report.type === "story" ? <BookOpen size={11} /> : <MessageSquare size={11} />}
                {report.type === "story" ? "Story Report" : "Comment Report"}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                {REASON_LABELS[report.reason] ?? report.reason}
              </span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                by {report.user.name} · {formatDate(report.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {report.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(report.id, "reviewed")}
                    disabled={loadingId === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                  >
                    <CheckCircle size={12} /> Mark Reviewed
                  </button>
                  <button
                    onClick={() => updateStatus(report.id, "dismissed")}
                    disabled={loadingId === report.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                    style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}
                  >
                    <XCircle size={12} /> Dismiss
                  </button>
                </>
              )}
              <button
                onClick={() => deleteReport(report.id)}
                disabled={loadingId === report.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80 disabled:opacity-40"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
              >
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-3">
            {/* Reported content */}
            {report.story && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Reported Story</p>
                <Link
                  href={`/stories/${report.story.slug}`}
                  target="_blank"
                  className="flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                >
                  <BookOpen size={14} />
                  {report.story.title}
                </Link>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/meminhaj/stories/${report.story.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75"
                    style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                  >
                    Edit Story
                  </Link>
                </div>
              </div>
            )}
            {report.comment && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Reported Comment</p>
                <div
                  className="p-3 rounded-xl text-sm"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>
                    {report.comment.user.name}:{" "}
                  </span>
                  <span style={{ color: "var(--muted-foreground)" }}>{report.comment.content}</span>
                </div>
              </div>
            )}
            {/* Reporter's description */}
            {report.description && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Additional Details</p>
                <p className="text-sm" style={{ color: "var(--foreground)" }}>{report.description}</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
