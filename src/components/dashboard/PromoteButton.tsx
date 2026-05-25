"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, CheckCircle, XCircle, Coins } from "lucide-react";

interface Props {
  type: "story" | "series";
  id: string;
  coinBalance: number;
  promotionStatus?: "active" | "queued" | null;
  expiresAt?: Date | string | null;
}

const COST = { story: 5, series: 10 } as const;

export function PromoteButton({ type, id, coinBalance, promotionStatus, expiresAt }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "confirm" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const cost = COST[type];
  const canAfford = coinBalance >= cost;

  if (promotionStatus) {
    const isActive = promotionStatus === "active";
    const expiryDate = expiresAt
      ? new Date(expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : null;
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={
          isActive
            ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }
            : { background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }
        }
      >
        <CheckCircle size={11} />
        {isActive ? `Featured${expiryDate ? ` · ${expiryDate}` : ""}` : "In Queue"}
      </span>
    );
  }

  if (phase === "success") {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.25)" }}
      >
        <CheckCircle size={11} />
        {successMsg || "Promoted!"}
      </span>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 text-xs" style={{ color: "#ef4444" }}>
          <XCircle size={11} />
          {errorMsg}
        </span>
        <button
          onClick={() => setPhase("idle")}
          className="text-xs underline"
          style={{ color: "var(--muted-foreground)" }}
        >
          Retry
        </button>
      </div>
    );
  }

  async function handleConfirm() {
    setPhase("loading");
    try {
      const res = await fetch("/api/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(type === "story" ? { storyId: id } : { seriesId: id }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong");
        setPhase("error");
        return;
      }
      setSuccessMsg(data.status === "active" ? "Live!" : "In Queue");
      setPhase("success");
      router.refresh();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setPhase("error");
    }
  }

  if (phase === "confirm") {
    return (
      <div
        className="flex flex-wrap items-center gap-2 p-3 rounded-xl text-xs"
        style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
      >
        <div className="flex items-center gap-1.5" style={{ color: "var(--foreground)" }}>
          <Coins size={12} style={{ color: "#c4426a" }} />
          <span className="font-semibold">{cost} coins</span>
          <span style={{ color: "var(--muted-foreground)" }}>· 7 days · balance: {coinBalance}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleConfirm}
            disabled={!canAfford}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "#c4426a" }}
          >
            {canAfford ? "Confirm" : "Insufficient coins"}
          </button>
          <button
            onClick={() => setPhase("idle")}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setPhase("confirm")}
      disabled={phase === "loading"}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-50"
      style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
    >
      {phase === "loading" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
      Feature ({cost} 🪙)
    </button>
  );
}
