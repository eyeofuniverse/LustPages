"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Coins, Loader2, CheckCircle } from "lucide-react";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import { ComingSoonGate } from "@/components/ui/ComingSoonGate";

interface Props {
  storyId: string;
  coinPrice: number;
  userBalance: number;
  isLoggedIn: boolean;
}

export function UnlockGate({ storyId, coinPrice, userBalance, isLoggedIn }: Props) {
  const router = useRouter();
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!PAYMENTS_ENABLED) {
    return (
      <ComingSoonGate
        title="Premium Content Coming Soon"
        description="Paid story unlocks aren't available yet. We're configuring our payment system — this story will be purchasable very soon."
      />
    );
  }

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    try {
      const res = await fetch("/api/coins/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId }),
      });
      const data = await res.json();
      if (data.success) {
        setUnlocked(true);
        router.refresh();
      } else {
        setError(data.error ?? "Something went wrong");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setUnlocking(false);
    }
  }

  if (unlocked) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-16 rounded-2xl text-center"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <CheckCircle size={36} style={{ color: "#22c55e" }} />
        <p className="font-bold" style={{ color: "var(--foreground)" }}>Story Unlocked!</p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-4 py-14 px-6 rounded-2xl text-center my-8"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "rgba(196,66,106,0.1)" }}
      >
        <Lock size={24} style={{ color: "#c4426a" }} />
      </div>

      <div>
        <h3
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Premium Story
        </h3>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          This story requires {coinPrice} {coinPrice === 1 ? "coin" : "coins"} to unlock
        </p>
      </div>

      {!isLoggedIn ? (
        <Link
          href="/login"
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: "#c4426a" }}
        >
          Login to Unlock
        </Link>
      ) : userBalance >= coinPrice ? (
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
            style={{ background: "#c4426a" }}
          >
            {unlocking ? (
              <><Loader2 size={15} className="animate-spin" /> Unlocking…</>
            ) : (
              <><Coins size={15} /> Unlock for {coinPrice} coins</>
            )}
          </button>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Your balance: {userBalance.toLocaleString()} coins
          </p>
          {error && (
            <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            You need {coinPrice - userBalance} more coins
          </p>
          <Link
            href="/store"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-85"
            style={{ background: "#c4426a" }}
          >
            <Coins size={15} /> Buy Coins
          </Link>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Your balance: {userBalance.toLocaleString()} coins
          </p>
        </div>
      )}

      {/* Only show free-story links when the user cannot currently unlock */}
      {(!isLoggedIn || userBalance < coinPrice) && (
        <div
          className="w-full mt-2 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            While you decide, explore our free stories
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/stories"
              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              Browse Free Stories
            </Link>
            <Link
              href="/trending"
              className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              Trending Now
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
