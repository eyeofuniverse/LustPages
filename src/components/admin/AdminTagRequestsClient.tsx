"use client";

import { useState } from "react";
import { Check, X, GitMerge, Trash2, Clock, Tag } from "lucide-react";
import { toast } from "sonner";
import { TagSearchPicker } from "./TagSearchPicker";

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

interface PendingTag {
  id: string;
  name: string;
  slug: string;
  tier: number;
  _count: { stories: number };
}

interface Props {
  initialRequests: TagRequest[];
  masterTags: MasterTag[];
  pendingTags: PendingTag[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: "rgba(245,158,11,0.1)", color: "#f59e0b", label: "Pending" },
  approved: { bg: "rgba(34,197,94,0.1)", color: "#22c55e", label: "Approved" },
  rejected: { bg: "rgba(239,68,68,0.1)", color: "#ef4444", label: "Rejected" },
  merged:   { bg: "rgba(99,102,241,0.1)", color: "#6366f1", label: "Merged" },
};

const TIER_LABELS: Record<number, string> = { 1: "Subgenre", 2: "Trope", 3: "Content" };

export function AdminTagRequestsClient({ initialRequests, masterTags, pendingTags: initialPendingTags }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [pendingTagList, setPendingTagList] = useState(initialPendingTags);
  // Local approved list so freshly-approved tags appear in merge pickers immediately
  const [approvedTags, setApprovedTags] = useState(masterTags);

  const [loading, setLoading] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState<Record<string, string>>({});
  const [adminNote, setAdminNote] = useState<Record<string, string>>({});

  // Pending Tag state
  const [tagMergeTarget, setTagMergeTarget] = useState<Record<string, string>>({});
  const [tagApproveTier, setTagApproveTier] = useState<Record<string, number>>({});

  // ── Tag Request handlers ───────────────────────────────────────────────

  async function act(id: string, action: string, extra: Record<string, unknown> = {}) {
    setLoading(id + action);
    try {
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
        toast.error(data.error ?? "Error");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  async function handleDeleteRequest(id: string) {
    if (!window.confirm("Delete this request?")) return;
    const res = await fetch(`/api/admin/tag-requests/${id}`, { method: "DELETE" });
    if (res.ok) setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  // ── Pending Tag handlers ───────────────────────────────────────────────

  async function handleTagApprove(tag: PendingTag) {
    const tier = tagApproveTier[tag.id] ?? tag.tier;
    setLoading(tag.id + "approve");
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: true, tier }),
      });
      if (res.ok) {
        setPendingTagList((prev) => prev.filter((t) => t.id !== tag.id));
        setApprovedTags((prev) => [...prev, { id: tag.id, name: tag.name, slug: tag.slug, tier }]);
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Error approving tag");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  async function handleTagMerge(tag: PendingTag) {
    const targetId = tagMergeTarget[tag.id];
    if (!targetId) return;
    const target = approvedTags.find((t) => t.id === targetId);
    if (!window.confirm(`Merge "${tag.name}" into "${target?.name}"?\n\n"${tag.name}" becomes an alias of "${target?.name}". ${tag._count.stories > 0 ? `All ${tag._count.stories} stories re-assigned. ` : ""}This cannot be undone.`)) return;
    setLoading(tag.id + "merge");
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mergeInto", targetTagId: targetId }),
      });
      if (res.ok) {
        setPendingTagList((prev) => prev.filter((t) => t.id !== tag.id));
        setTagMergeTarget((prev) => { const n = { ...prev }; delete n[tag.id]; return n; });
      } else {
        const d = await res.json();
        toast.error(d.error ?? "Error merging tag");
      }
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setLoading(null);
    }
  }

  async function handleTagDelete(tag: PendingTag) {
    if (!window.confirm(`Delete tag "${tag.name}"? This removes it from all stories.`)) return;
    const res = await fetch(`/api/admin/tags/${tag.id}`, { method: "DELETE" });
    if (res.ok) setPendingTagList((prev) => prev.filter((t) => t.id !== tag.id));
  }

  // ── Render ─────────────────────────────────────────────────────────────

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
            <div className="flex items-center gap-2 mb-1 flex-wrap">
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
            onClick={() => handleDeleteRequest(req.id)}
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
            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={() => act(req.id, "approve")}
                disabled={loading === req.id + "approve"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 text-white shrink-0"
                style={{ background: "#22c55e" }}
              >
                <Check size={12} />
                {loading === req.id + "approve" ? "Approving…" : "Approve & Create Tag"}
              </button>

              <div className="flex items-center gap-1.5 flex-wrap">
                <TagSearchPicker
                  options={approvedTags}
                  value={mergeTarget[req.id] ?? ""}
                  onChange={(id) => setMergeTarget((prev) => ({ ...prev, [req.id]: id }))}
                  placeholder="Search to merge into…"
                />
                <button
                  onClick={() => mergeTarget[req.id] && act(req.id, "merge", { mergedIntoTagId: mergeTarget[req.id] })}
                  disabled={!mergeTarget[req.id] || loading === req.id + "merge"}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 transition-all hover:opacity-90 shrink-0"
                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                >
                  <GitMerge size={11} />
                  {loading === req.id + "merge" ? "Merging…" : "Merge"}
                </button>
              </div>

              <button
                onClick={() => act(req.id, "reject")}
                disabled={loading === req.id + "reject"}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50 shrink-0"
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
      {/* ── Unapproved Tags (auto-created from story forms) ── */}
      {pendingTagList.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
            >
              Unapproved Tags
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {pendingTagList.length} tag{pendingTagList.length !== 1 ? "s" : ""} · added by authors, awaiting review
            </span>
          </div>
          <div className="space-y-3">
            {pendingTagList.map((tag) => (
              <div
                key={tag.id}
                className="p-4 rounded-xl"
                style={{ background: "var(--card)", border: "1px solid rgba(196,66,106,0.25)" }}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{tag.name}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/{tag.slug}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}>
                        unapproved
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {tag._count.stories} {tag._count.stories === 1 ? "story" : "stories"} using this tag
                    </p>
                  </div>
                  <button onClick={() => handleTagDelete(tag)} className="opacity-40 hover:opacity-100 transition-opacity shrink-0">
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {/* Approve with tier picker */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={tagApproveTier[tag.id] ?? tag.tier}
                      onChange={(e) => setTagApproveTier((prev) => ({ ...prev, [tag.id]: Number(e.target.value) }))}
                      className="px-2 py-1.5 rounded-lg text-xs"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                    >
                      <option value={1}>Tier 1 — Subgenre</option>
                      <option value={2}>Tier 2 — Trope</option>
                      <option value={3}>Tier 3 — Content</option>
                    </select>
                    <button
                      onClick={() => handleTagApprove(tag)}
                      disabled={loading === tag.id + "approve"}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50 shrink-0"
                      style={{ background: "#22c55e" }}
                    >
                      <Check size={12} />
                      {loading === tag.id + "approve" ? "Approving…" : "Approve"}
                    </button>
                  </div>

                  {/* Merge into existing */}
                  <div className="flex items-center gap-1.5">
                    <TagSearchPicker
                      options={approvedTags}
                      value={tagMergeTarget[tag.id] ?? ""}
                      onChange={(id) => setTagMergeTarget((prev) => ({ ...prev, [tag.id]: id }))}
                      placeholder="Search to merge into…"
                    />
                    <button
                      onClick={() => handleTagMerge(tag)}
                      disabled={!tagMergeTarget[tag.id] || loading === tag.id + "merge"}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40 shrink-0"
                      style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)" }}
                    >
                      <GitMerge size={11} />
                      {loading === tag.id + "merge" ? "Merging…" : "Merge"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Author Tag Requests ── */}
      {pending.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.35)" }}
            >
              Pending Requests
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{pending.length} request{pending.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-3">
            {pending.map((req) => <RequestCard key={req.id} req={req} />)}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              Resolved
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{resolved.length}</span>
          </div>
          <div className="space-y-2">
            {resolved.map((req) => <RequestCard key={req.id} req={req} />)}
          </div>
        </div>
      )}

      {requests.length === 0 && pendingTagList.length === 0 && (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Tag size={32} className="mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-medium" style={{ color: "var(--foreground)" }}>Nothing to review</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Tag requests and unapproved tags will appear here.
          </p>
        </div>
      )}
    </div>
  );
}
