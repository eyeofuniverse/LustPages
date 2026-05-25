"use client";

import { useState } from "react";
import { Check, X, GitMerge, Trash2, Clock, Tag } from "lucide-react";

interface TagRequest {
  id: string;
  requestedName: string;
  slug: string;
  tier: number;
  status: string;
  adminNote: string | null;
  createdAt: string;
  requestedBy: { id: string; name: string };
  mergedIntoTag: { id: string; name: string; slug: string } | null;
}

interface MasterTag { id: string; name: string; slug: string; tier: number; }

interface Props {
  initialRequests: TagRequest[];
  masterTags: MasterTag[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" },
  approved: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Approved" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" },
  merged:   { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Merged" },
};

const TIER_LABELS: Record<number, string> = { 1: "Subgenre", 2: "Trope", 3: "Content" };

export function AdminTagRequestsClient({ initialRequests, masterTags }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [loading, setLoading] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setLoading(id + action);
    const res = await fetch(`/api/admin/tag-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: adminNote[id] || null, ...extra }),
    });
    const data = await res.json();
    if (res.ok) {
      setRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, ...(data.request ?? data), mergedIntoTag: data.tag ?? r.mergedIntoTag } : r)
      );
    } else {
      alert(data.error ?? "Error");
    }
    setLoading(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this request?")) return;
    const res = await fetch(`/api/admin/tag-requests/${id}`, { method: "DELETE" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  function RequestCard({ req }: { req: TagRequest }) {
    const status = STATUS_COLORS[req.status] ?? STATUS_COLORS.pending;
    const isPending = req.status === "pending";
    return (
      <div
        className="p-4 rounded-xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
                {req.requestedName}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: status.bg, color: status.color }}
              >
                {status.label}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
              >
                Tier {req.tier} — {TIER_LABELS[req.tier]}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-medium">{req.requestedBy.name}</span> · /{req.slug} · {" "}
              <Clock size={10} className="inline mr-0.5" />
              {new Date(req.createdAt).toLocaleDateString()}
            </p>
            {req.mergedIntoTag && (
              <p className="text-xs mt-1" style={{ color: "#6366f1" }}>
                → Merged into: {req.mergedIntoTag.name}
              </p>
            )}
          </div>
          <button
            onClick={() => handleDelete(req.id)}
            className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>

        {isPending && (
          <div className="space-y-2">
            <input
              value={adminNote[req.id] ?? ""}
              onChange={(e) => setAdminNote((prev) => ({ ...prev, [req.id]: e.target.value }))}
              placeholder="Admin note (optional)…"
              className="w-full px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
            <div className="flex flex-wrap gap-2">
              {/* Approve — creates new tag */}
              <button
                onClick={() => act(req.id, "approve")}
                disabled={loading === req.id + "approve"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 text-white"
                style={{ background: "#22c55e" }}
              >
                <Check size={12} />
                {loading === req.id + "approve" ? "Approving…" : "Approve & Create Tag"}
              </button>

              {/* Merge into existing tag */}
              <div className="flex gap-1.5">
                <select
                  value={mergeTarget[req.id] ?? ""}
                  onChange={(e) => setMergeTarget((prev) => ({ ...prev, [req.id]: e.target.value }))}
                  className="px-2 py-1.5 rounded-lg text-xs"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                >
                  <option value="">— Merge into existing —</option>
                  {masterTags.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} (T{t.tier})</option>
                  ))}
                </select>
                <button
                  onClick={() => mergeTarget[req.id] && act(req.id, "merge", { mergedIntoTagId: mergeTarget[req.id] })}
                  disabled={!mergeTarget[req.id] || loading === req.id + "merge"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  <GitMerge size={11} />
                  Merge
                </button>
              </div>

              {/* Reject */}
              <button
                onClick={() => act(req.id, "reject")}
                disabled={loading === req.id + "reject"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                <X size={12} />
                {loading === req.id + "reject" ? "Rejecting…" : "Reject"}
              </button>
            </div>
          </div>
        )}

        {req.adminNote && !isPending && (
          <p className="text-xs mt-2 px-3 py-1.5 rounded-lg" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
            Note: {req.adminNote}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((req) => <RequestCard key={req.id} req={req} />)}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Resolved ({resolved.length})
          </h2>
          <div className="space-y-2">
            {resolved.map((req) => <RequestCard key={req.id} req={req} />)}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Tag size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium" style={{ color: "var(--foreground)" }}>No tag requests yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            When authors request new tags, they appear here.
          </p>
        </div>
      )}
    </div>
  );
}
