"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";

interface Props {
  initialName: string;
  initialTier: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Subgenre / Universe",
  2: "Tier 2 — Tropes / Hook",
  3: "Tier 3 — Content & Kinks",
};

export function TagRequestModal({ initialName, initialTier, onClose, onSuccess }: Props) {
  const [name, setName] = useState(initialName);
  const [tier, setTier] = useState(initialTier);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tags/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestedName: name.trim(), tier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      onSuccess(`Tag request for "${name.trim()}" submitted. Our team will review it shortly.`);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 z-10"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3
              className="text-lg font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Request a New Tag
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Our team reviews all requests within 24 hours.
            </p>
          </div>
          <button type="button" onClick={onClose} className="opacity-50 hover:opacity-100 transition-opacity">
            <X size={18} style={{ color: "var(--foreground)" }} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Tag Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dark Obsession"
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "var(--muted)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                outline: "none",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--muted-foreground)" }}>
              Tag Tier
            </label>
            <div className="flex gap-2">
              {([1, 2, 3] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTier(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: tier === t ? "rgba(196,66,106,0.15)" : "var(--muted)",
                    color: tier === t ? "#c4426a" : "var(--muted-foreground)",
                    border: tier === t ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                  }}
                >
                  Tier {t}
                </button>
              ))}
            </div>
            <p className="text-xs mt-1.5" style={{ color: "var(--muted-foreground)" }}>
              {TIER_LABELS[tier]}
            </p>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={loading || !name.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "#c4426a" }}
          >
            <Send size={14} />
            {loading ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}
