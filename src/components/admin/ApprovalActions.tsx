"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ApprovalActionsProps {
  storyId: string;
  storyTitle: string;
}

export function ApprovalActions({ storyId, storyTitle }: ApprovalActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState("");

  async function handleApprove() {
    if (!confirm(`Approve and publish "${storyTitle}"?`)) return;
    setIsApproving(true);
    try {
      const res = await fetch(`/api/admin/stories/${storyId}/approve`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error ?? "Failed to approve");
        return;
      }
      router.refresh();
    } finally {
      setIsApproving(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setIsRejecting(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/stories/${storyId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectionReason.trim() }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to reject");
        return;
      }
      setShowRejectModal(false);
      setRejectionReason("");
      router.refresh();
    } finally {
      setIsRejecting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleApprove}
          disabled={isApproving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "#22c55e" }}
        >
          <CheckCircle size={13} />
          {isApproving ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={() => { setShowRejectModal(true); setError(""); }}
          disabled={isApproving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 disabled:opacity-50"
          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
        >
          <XCircle size={13} />
          Reject
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>
                Reject Story
              </h3>
              <button
                onClick={() => { setShowRejectModal(false); setRejectionReason(""); setError(""); }}
                className="p-1 rounded-lg transition-opacity hover:opacity-75"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Rejecting: <span className="font-semibold" style={{ color: "var(--foreground)" }}>"{storyTitle}"</span>
              </p>
              <div>
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  placeholder="Explain why this story is being rejected and what the author can improve…"
                  className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                  autoFocus
                />
                {error && (
                  <p className="text-xs mt-1" style={{ color: "#ef4444" }}>{error}</p>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleReject}
                  disabled={isRejecting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#ef4444" }}
                >
                  {isRejecting ? "Rejecting…" : "Confirm Rejection"}
                </button>
                <button
                  onClick={() => { setShowRejectModal(false); setRejectionReason(""); setError(""); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-75"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
