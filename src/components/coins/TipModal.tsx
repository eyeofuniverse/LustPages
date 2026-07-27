"use client";

import { useState } from "react";
import { Coins, Loader2, X, CheckCircle, Heart } from "lucide-react";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";

const PRESETS = [10, 25, 50, 100];

interface Props {
  authorId: string;
  authorName: string;
  storyId?: string;
  userBalance: number;
  isLoggedIn: boolean;
  onBalanceChange?: (newBalance: number) => void;
}

export function TipModal({ authorId, authorName, storyId, userBalance, isLoggedIn, onBalanceChange }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(10);
  const [custom, setCustom] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(userBalance);

  if (!PAYMENTS_ENABLED) return null;

  const finalAmount = custom ? parseInt(custom, 10) || 0 : amount;

  async function handleTip() {
    if (!finalAmount || finalAmount < 1) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/coins/tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorId, storyId, amount: finalAmount, message: message || null }),
      });
      const data = await res.json();
      if (data.success) {
        setBalance(data.balance);
        onBalanceChange?.(data.balance);
        setSent(true);
        setTimeout(() => { setSent(false); setOpen(false); setMessage(""); }, 2500);
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSending(false);
    }
  }

  const canAfford = balance >= finalAmount;
  const meetsMinimum = finalAmount >= 10;

  if (!isLoggedIn) {
    return (
      <a
        href="/login"
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
      >
        <Heart size={14} /> Tip Author
      </a>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }}
      >
        <Heart size={14} /> Tip Author
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={40} style={{ color: "#22c55e" }} />
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                  Tip Sent!
                </p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {authorName} received {Math.floor(finalAmount * 0.8)} coins
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                      Tip {authorName}
                    </h3>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      Your balance: <span style={{ color: "#f59e0b" }}>{balance.toLocaleString()} coins</span>
                    </p>
                  </div>
                  <button onClick={() => setOpen(false)} className="transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Preset amounts */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => { setAmount(p); setCustom(""); }}
                      className="py-2 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: amount === p && !custom ? "rgba(196,66,106,0.15)" : "var(--muted)",
                        color: amount === p && !custom ? "#c4426a" : "var(--muted-foreground)",
                        border: amount === p && !custom ? "1px solid rgba(196,66,106,0.4)" : "1px solid transparent",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="mb-4">
                  <input
                    type="number"
                    min={10}
                    max={balance}
                    placeholder="Custom amount"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {/* Optional message */}
                <div className="mb-5">
                  <input
                    type="text"
                    maxLength={120}
                    placeholder="Add a message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                    }}
                  />
                </div>

                {error && (
                  <p className="text-xs mb-3 text-center" style={{ color: "#ef4444" }}>{error}</p>
                )}

                {!meetsMinimum && finalAmount > 0 && (
                  <p className="text-xs mb-3 text-center" style={{ color: "#ef4444" }}>
                    Minimum tip is 10 coins
                  </p>
                )}

                {meetsMinimum && !canAfford && (
                  <p className="text-xs mb-3 text-center" style={{ color: "#ef4444" }}>
                    Not enough coins.{" "}
                    <a href="/store" className="underline" style={{ color: "#c4426a" }}>Get coins →</a>
                  </p>
                )}

                <button
                  onClick={handleTip}
                  disabled={sending || !canAfford || !meetsMinimum}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "#c4426a" }}
                >
                  {sending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Coins size={14} /> Send {finalAmount > 0 ? `${finalAmount} coin${finalAmount !== 1 ? "s" : ""}` : ""}</>
                  )}
                </button>

                <p className="text-xs text-center mt-2" style={{ color: "var(--muted-foreground)" }}>
                  Author receives 80% · Platform keeps 20%
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
