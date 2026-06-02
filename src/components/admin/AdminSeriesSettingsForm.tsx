"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Unlock, Save, Loader2, Info, AlertTriangle } from "lucide-react";
import { CoverImageUpload } from "@/components/admin/CoverImageUpload";

interface Series {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  isPremium: boolean;
  coinPrice: number | null;
  freeChapters: number;
  _count: { unlocks: number; stories: number };
}

const inputStyle: React.CSSProperties = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "10px",
  fontSize: "14px",
  width: "100%",
  padding: "8px 12px",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--muted-foreground)",
  marginBottom: "6px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

export function AdminSeriesSettingsForm({ series }: { series: Series }) {
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(series.isPremium);
  const [coinPrice, setCoinPrice] = useState(series.coinPrice?.toString() ?? "");
  const [freeChapters, setFreeChapters] = useState(series.freeChapters.toString());
  const [description, setDescription] = useState(series.description ?? "");
  const [coverImage, setCoverImage] = useState(series.coverImage ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const hasPaidReaders = series._count.unlocks > 0;

  async function handleSave() {
    if (isPremium && (!coinPrice || parseInt(coinPrice) < 1)) {
      setError("Coin price must be at least 1 when premium is enabled.");
      return;
    }
    const fc = Math.max(1, parseInt(freeChapters) || 1);
    if (isPremium && fc >= series._count.stories && series._count.stories > 0) {
      setError(`Free chapters (${fc}) must be less than total stories (${series._count.stories}).`);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/series/${series.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description || null,
          coverImage: coverImage || null,
          isPremium,
          coinPrice: isPremium ? parseInt(coinPrice) : null,
          freeChapters: fc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to save settings");
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin override notice */}
      <div
        className="flex items-start gap-2.5 p-4 rounded-2xl"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <Info size={14} className="shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
        <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
          <span className="font-semibold" style={{ color: "#6366f1" }}>Admin override</span> — you can change any
          setting including price, even if readers have already paid. Use with caution.
        </p>
      </div>

      {hasPaidReaders && (
        <div
          className="flex items-start gap-2 p-3 rounded-xl"
          style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}
        >
          <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#eab308" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="font-semibold" style={{ color: "#eab308" }}>
              {series._count.unlocks} {series._count.unlocks === 1 ? "reader has" : "readers have"} already paid.
            </span>{" "}
            Changing the price will not refund existing unlocks.
          </p>
        </div>
      )}

      {/* Description + Cover */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Series Info</h2>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What is this series about?"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
        <div>
          <label style={labelStyle}>Series Cover Image</label>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Shared across all chapters of this series. Recommended: portrait ratio (e.g. 800×1200px).
          </p>
          <CoverImageUpload value={coverImage} onChange={setCoverImage} />
        </div>
      </div>

      {/* Premium settings */}
      <div
        className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Premium Settings</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Premium Series</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Readers pay once to unlock all premium chapters
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setIsPremium(!isPremium); if (isPremium) setCoinPrice(""); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: isPremium ? "rgba(245,158,11,0.15)" : "var(--muted)",
              color: isPremium ? "#f59e0b" : "var(--muted-foreground)",
              border: isPremium ? "1px solid rgba(245,158,11,0.4)" : "1px solid transparent",
            }}
          >
            {isPremium ? <><Lock size={12} /> Premium</> : <><Unlock size={12} /> Free</>}
          </button>
        </div>

        {isPremium && (
          <>
            <div>
              <label style={labelStyle}>Series Unlock Price (coins)</label>
              <input
                type="number"
                min={1}
                max={9999}
                value={coinPrice}
                onChange={(e) => setCoinPrice(e.target.value)}
                placeholder="e.g. 30"
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                One-time payment to unlock all premium chapters. Author earns 80%.
              </p>
            </div>

            <div>
              <label style={labelStyle}>Free Chapters (must be ≥ 1)</label>
              <input
                type="number"
                min={1}
                max={Math.max(1, series._count.stories - 1)}
                value={freeChapters}
                onChange={(e) => setFreeChapters(e.target.value)}
                style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                Chapters 1–{Math.max(1, parseInt(freeChapters) || 1)} are free. Chapter{" "}
                {Math.max(1, parseInt(freeChapters) || 1) + 1} onwards requires unlock.
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}>
          Settings saved successfully.
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-opacity hover:opacity-90"
        style={{ background: "#c4426a" }}
      >
        {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Series Settings</>}
      </button>
    </div>
  );
}
