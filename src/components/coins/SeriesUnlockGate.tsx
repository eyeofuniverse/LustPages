"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Coins, Loader2, CheckCircle, BookOpen } from "lucide-react";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import { ComingSoonGate } from "@/components/ui/ComingSoonGate";

interface Props {
  seriesId: string;
  seriesSlug: string;
  seriesName: string;
  coinPrice: number;
  freeChapters: number;
  chapterNumber: number;
  userBalance: number;
  isLoggedIn: boolean;
}

export function SeriesUnlockGate({
  seriesId,
  seriesSlug,
  seriesName,
  coinPrice,
  freeChapters,
  chapterNumber,
  userBalance,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [unlocking, setUnlocking] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!PAYMENTS_ENABLED) {
    return (
      <ComingSoonGate
        title="Premium Series Coming Soon"
        description="Series unlocks aren't available yet. We're configuring our payment system — premium chapters will be purchasable very soon."
      />
    );
  }

  async function handleUnlock() {
    setUnlocking(true);
    setError(null);
    try {
      const res = await fetch("/api/coins/unlock-series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seriesId }),
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
        <p className="font-bold" style={{ color: "var(--foreground)" }}>Series Unlocked!</p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          You now have access to all premium chapters in this series.
        </p>
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
          Premium Series
        </h3>
        <p className="text-sm mb-1" style={{ color: "var(--muted-foreground)" }}>
          Chapter {chapterNumber} is part of{" "}
          <Link href={`/series/${seriesSlug}`} className="font-semibold hover:opacity-75 transition-opacity" style={{ color: "#c4426a" }}>
            {seriesName}
          </Link>
        </p>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          First {freeChapters} {freeChapters === 1 ? "chapter is" : "chapters are"} free.
          Unlock the full series for <span className="font-semibold" style={{ color: "#c4426a" }}>{coinPrice} coins</span> and read everything.
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
              <><Coins size={15} /> Unlock series for {coinPrice} coins</>
            )}
          </button>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Your balance: {userBalance.toLocaleString()} coins · one-time unlock for all chapters
          </p>
          {error && <p className="text-xs" style={{ color: "#ef4444" }}>{error}</p>}
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

      <Link
        href={`/series/${seriesSlug}`}
        className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <BookOpen size={12} /> View series overview
      </Link>

      {/* While you decide — surface free content */}
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
            href="/series"
            className="px-4 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            Free Series
          </Link>
        </div>
      </div>
    </div>
  );
}
