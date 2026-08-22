"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit, Eye, Trash2, MessageCircle, MessageCircleOff, Check, X } from "lucide-react";
import Link from "next/link";

type StatusValue = "draft" | "scheduled" | "published" | "pending" | "rejected";

type StoryProps = {
  id: string;
  slug: string;
  published: boolean;
  status: string;
  scheduledAt: string | null;
  commentsEnabled: boolean;
};

function deriveStatus(story: StoryProps): StatusValue {
  if (story.published) return "published";
  if (story.scheduledAt) return "scheduled";
  if (story.status === "pending") return "pending";
  if (story.status === "rejected") return "rejected";
  return "draft";
}

const STATUS_STYLES: Record<StatusValue, { bg: string; color: string; label: string }> = {
  published: { bg: "rgba(34,197,94,0.12)",   color: "#22c55e", label: "Published" },
  scheduled: { bg: "rgba(249,115,22,0.12)",  color: "#f97316", label: "Scheduled" },
  draft:     { bg: "rgba(234,179,8,0.12)",   color: "#eab308", label: "Draft" },
  pending:   { bg: "rgba(99,102,241,0.12)",  color: "#6366f1", label: "Pending" },
  rejected:  { bg: "rgba(239,68,68,0.12)",   color: "#ef4444", label: "Rejected" },
};

export function AdminStoryActions({ story }: { story: StoryProps }) {
  const router = useRouter();
  const [statusLoading, setStatusLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<StatusValue>(deriveStatus(story));
  const [commentsEnabled, setCommentsEnabled] = useState(story.commentsEnabled);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(
    story.scheduledAt ? story.scheduledAt.slice(0, 16) : ""
  );

  async function patch(body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/stories/${story.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Update failed");
    router.refresh();
  }

  async function handleStatusChange(val: string) {
    const next = val as StatusValue;
    if (next === "pending" || next === "rejected") return;
    if (next === "scheduled") {
      setCurrentStatus("scheduled");
      setShowDatePicker(true);
      return;
    }
    const prev = currentStatus;
    setCurrentStatus(next);
    setShowDatePicker(false);
    setStatusLoading(true);
    try {
      await patch(
        next === "published"
          ? { published: true, scheduledAt: null }
          : { published: false, scheduledAt: null }
      );
    } catch {
      setCurrentStatus(prev);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleConfirmScheduled() {
    if (!scheduledDate) return;
    setStatusLoading(true);
    try {
      await patch({ published: false, scheduledAt: new Date(scheduledDate).toISOString() });
      setShowDatePicker(false);
    } catch {
      setCurrentStatus(deriveStatus(story));
      setShowDatePicker(false);
    } finally {
      setStatusLoading(false);
    }
  }

  function handleCancelScheduled() {
    setShowDatePicker(false);
    setCurrentStatus(deriveStatus(story));
  }

  async function handleCommentsToggle() {
    const next = !commentsEnabled;
    setCommentsEnabled(next);
    setCommentsLoading(true);
    try {
      await patch({ commentsEnabled: next });
    } catch {
      setCommentsEnabled(!next);
    } finally {
      setCommentsLoading(false);
    }
  }

  const cfg = STATUS_STYLES[currentStatus];

  const scheduledDisplay = currentStatus === "scheduled" && story.scheduledAt
    ? new Date(story.scheduledAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="flex flex-col gap-1">
      {scheduledDisplay && (
        <span className="text-[10px] font-medium" style={{ color: "#f97316" }}>
          {scheduledDisplay}
        </span>
      )}
      <div className="flex items-center gap-1">
      {/* Status select */}
      <div className="relative">
        <select
          value={currentStatus}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={statusLoading}
          className="appearance-none text-xs font-semibold rounded-full px-2.5 py-1 pr-6 cursor-pointer outline-none border-0 transition-all disabled:opacity-60"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {(currentStatus === "pending" || currentStatus === "rejected") && (
            <option value={currentStatus} disabled>{cfg.label}</option>
          )}
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="published">Published</option>
        </select>
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9px]"
          style={{ color: cfg.color }}
        >
          ▾
        </span>

        {/* Inline date picker for scheduling */}
        {showDatePicker && (
          <div
            className="absolute top-full left-0 mt-1.5 z-50 p-2 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <input
              type="datetime-local"
              value={scheduledDate}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="text-xs rounded-lg px-2 py-1 outline-none border-0"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            />
            <button
              onClick={handleConfirmScheduled}
              disabled={!scheduledDate || statusLoading}
              className="p-1.5 rounded-lg text-white disabled:opacity-40 shrink-0"
              style={{ background: "#6366f1" }}
            >
              <Check size={12} />
            </button>
            <button
              onClick={handleCancelScheduled}
              className="p-1.5 rounded-lg shrink-0"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Comments toggle */}
      <button
        onClick={handleCommentsToggle}
        disabled={commentsLoading}
        title={commentsEnabled ? "Comments on — click to disable" : "Comments off — click to enable"}
        className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40"
        style={{ color: commentsEnabled ? "#22c55e" : "var(--muted-foreground)" }}
      >
        {commentsEnabled ? <MessageCircle size={14} /> : <MessageCircleOff size={14} />}
      </button>

      {/* Preview */}
      <Link
        href={`/stories/${story.slug}`}
        target="_blank"
        title="Preview"
        className="p-1.5 rounded-lg transition-all hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <Eye size={14} />
      </Link>

      {/* Edit */}
      <Link
        href={`/meminhaj/stories/${story.id}/edit`}
        title="Edit"
        className="p-1.5 rounded-lg transition-all hover:opacity-75"
        style={{ color: "#c4426a" }}
      >
        <Edit size={14} />
      </Link>

      {/* Delete */}
      <DeleteButton storyId={story.id} />
      </div>
    </div>
  );
}

function DeleteButton({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Delete"
      className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40"
      style={{ color: "var(--muted-foreground)" }}
    >
      <Trash2 size={14} />
    </button>
  );
}
