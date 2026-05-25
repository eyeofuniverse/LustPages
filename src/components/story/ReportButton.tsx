"use client";

import { useState } from "react";
import { Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "inappropriate_content", label: "Inappropriate / violates rules" },
  { value: "copyright", label: "Copyright violation" },
  { value: "harassment", label: "Harassment or hate speech" },
  { value: "underage_content", label: "Depicts minors" },
  { value: "other", label: "Other" },
];

interface Props {
  storyId: string;
  isLoggedIn: boolean;
}

export function ReportButton({ storyId, isLoggedIn }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleClick() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/stories/${storyId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, description }),
      });
      if (res.status === 409) { setDone(true); return; }
      if (!res.ok) throw new Error();
      setDone(true);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
        aria-label="Report this story"
      >
        <Flag size={12} /> Report
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 relative"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-lg transition-opacity hover:opacity-75"
              style={{ color: "var(--muted-foreground)" }}
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <Flag size={18} style={{ color: "#ef4444" }} />
              <h2 className="font-bold text-lg" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
                Report Story
              </h2>
            </div>

            {done ? (
              <div className="text-center py-4">
                <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>Report submitted</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Thank you. Our team will review this content.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: "#c4426a" }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                    Why are you reporting this story?
                  </p>
                  <div className="space-y-2">
                    {REASONS.map((r) => (
                      <label
                        key={r.value}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                        style={{
                          background: reason === r.value ? "rgba(196,66,106,0.08)" : "var(--muted)",
                          border: reason === r.value ? "1px solid rgba(196,66,106,0.3)" : "1px solid transparent",
                        }}
                      >
                        <input
                          type="radio"
                          name="reason"
                          value={r.value}
                          checked={reason === r.value}
                          onChange={() => setReason(r.value)}
                          className="shrink-0"
                          style={{ accentColor: "#c4426a" }}
                        />
                        <span className="text-sm" style={{ color: "var(--foreground)" }}>{r.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5" style={{ color: "var(--foreground)" }}>
                    Additional details <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                    placeholder="Provide more context…"
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                  />
                </div>

                {error && <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>}

                <div className="flex gap-3 justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!reason || submitting}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                    style={{ background: "#ef4444" }}
                  >
                    {submitting ? "Submitting…" : "Submit Report"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
