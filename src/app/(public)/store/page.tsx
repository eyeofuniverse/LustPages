"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Script from "next/script";
import { Check, Zap, Flame, Sparkles, RefreshCw, Coins } from "lucide-react";
import { SUBSCRIPTION_TIERS, type SubscriptionTierId } from "@/lib/subscription-tiers";

declare global {
  interface Window {
    atlos?: {
      Pay: (opts: Record<string, unknown>) => void;
      RECURRENCE_NONE: number;
      RECURRENCE_MONTH: number;
    };
  }
}

const TIER_ICONS = {
  spark: Zap,
  flame: Flame,
  inferno: Sparkles,
};

interface CurrentSub {
  tier: string;
  status: string;
  autoRenew: boolean;
  subscriptionCoins: number;
  currentPeriodEnd: string;
}

export default function StorePage() {
  const { data: session } = useSession();
  const [autoRenew, setAutoRenew] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const [currentSub, setCurrentSub] = useState<CurrentSub | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const fetchSub = useCallback(async () => {
    const res = await fetch("/api/coins/subscribe");
    const data = await res.json();
    setCurrentSub(data.subscription ?? null);
  }, []);

  const fetchBalance = useCallback(async () => {
    const res = await fetch("/api/coins/balance");
    const data = await res.json();
    setCoinBalance(data.balance ?? 0);
  }, []);

  useEffect(() => {
    if (session?.user) {
      fetchSub();
      fetchBalance();
    }
  }, [session, fetchSub, fetchBalance]);

  // A subscription is only truly active if the billing period hasn't ended yet
  const isSubActive = !!(
    currentSub?.status === "active" &&
    new Date(currentSub.currentPeriodEnd) > new Date()
  );

  async function handleSubscribe(tierId: SubscriptionTierId) {
    if (!session?.user) {
      window.location.href = "/login?callbackUrl=/store";
      return;
    }
    if (!scriptReady || !window.atlos) {
      alert("Payment widget is loading, please try again in a moment.");
      return;
    }

    setLoading(tierId);
    try {
      const res = await fetch("/api/coins/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: tierId, autoRenew }),
      });
      const { orderId, merchantId, orderAmount, error } = await res.json();
      if (error) { alert(error); return; }

      window.atlos.Pay({
        merchantId,
        orderId,
        orderAmount,
        orderCurrency: "USD",
        recurrence: autoRenew ? window.atlos.RECURRENCE_MONTH : window.atlos.RECURRENCE_NONE,
        theme: "dark",
        onCompleted: () => {
          setLoading(null);
          fetchSub();
          fetchBalance();
          alert("Payment successful! Your coins will be credited shortly.");
        },
        onCanceled: () => setLoading(null),
      });
    } catch {
      alert("Something went wrong. Please try again.");
      setLoading(null);
    }
  }

  const tiers = Object.values(SUBSCRIPTION_TIERS);

  return (
    <>
      <Script
        src="https://atlos.io/packages/app/atlos.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
      />

      <div className="min-h-screen py-16 px-4">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
              Get Your Coins
            </h1>
            <p className="text-lg" style={{ color: "var(--muted-foreground)" }}>
              Unlock premium stories, tip authors, and enjoy an ad-free experience.
            </p>
          </div>

          {/* Current subscription banner — only shown when period is still active */}
          {isSubActive ? (
            <div
              className="mb-8 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(196,66,106,0.1)", border: "1px solid rgba(196,66,106,0.3)" }}
            >
              <Check size={18} style={{ color: "#c4426a" }} className="shrink-0" />
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                You&apos;re on the <strong>{SUBSCRIPTION_TIERS[currentSub!.tier as SubscriptionTierId]?.name ?? currentSub!.tier}</strong> plan.{" "}
                <span style={{ color: "var(--muted-foreground)" }}>
                  Period ends {new Date(currentSub!.currentPeriodEnd).toLocaleDateString()}.
                  {currentSub!.autoRenew ? " Auto-renew on." : " One-time (no auto-renew)."}
                  {coinBalance !== null && coinBalance > 0 && (
                    <> · <span style={{ color: "#f59e0b" }}>{coinBalance.toLocaleString()} coins</span> remaining.</>
                  )}
                </span>
              </div>
            </div>
          ) : coinBalance !== null && coinBalance > 0 ? (
            /* User has coins but no active subscription (legacy coins, welcome bonus, or expired period) */
            <div
              className="mb-8 rounded-2xl p-4 flex items-center gap-3"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)" }}
            >
              <Coins size={18} style={{ color: "#f59e0b" }} className="shrink-0" />
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                You have <span style={{ color: "#f59e0b" }} className="font-semibold">{coinBalance.toLocaleString()} coins</span> remaining.{" "}
                <span style={{ color: "var(--muted-foreground)" }}>Subscribe to get more coins every month.</span>
              </div>
            </div>
          ) : null}

          {/* Auto-renew toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setAutoRenew(v => !v)}
                className="relative w-11 h-6 rounded-full transition-colors"
                style={{ background: autoRenew ? "#c4426a" : "var(--border)" }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-transform"
                  style={{ left: autoRenew ? "calc(100% - 1.25rem)" : "0.25rem" }}
                />
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Auto-renew monthly
              </span>
            </label>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}
            >
              +25% bonus coins
            </span>
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const Icon = TIER_ICONS[tier.id as SubscriptionTierId];
              const coins = autoRenew ? tier.coinsAutoRenew : tier.coinsPerMonth;
              const isPopular = tier.badge === "Most Popular";
              const isCurrent = currentSub?.tier === tier.id && isSubActive;

              return (
                <div
                  key={tier.id}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={{
                    background: "var(--card)",
                    border: `2px solid ${isPopular ? tier.color : "var(--border)"}`,
                    boxShadow: isPopular ? `0 0 24px ${tier.color}22` : "none",
                  }}
                >
                  {tier.badge && (
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: tier.color }}
                    >
                      {tier.badge}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <Icon size={20} style={{ color: tier.color }} />
                    <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
                      {tier.name}
                    </h2>
                  </div>

                  <div className="mb-1">
                    <span className="text-3xl font-extrabold" style={{ color: "var(--foreground)" }}>
                      ${tier.price}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "var(--muted-foreground)" }}>
                      / month
                    </span>
                  </div>

                  <div className="mb-5">
                    <span className="text-2xl font-bold" style={{ color: tier.color }}>
                      {coins.toLocaleString()}
                    </span>
                    <span className="text-sm ml-1" style={{ color: "var(--muted-foreground)" }}>
                      coins / month
                    </span>
                    {autoRenew && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                        vs {tier.coinsPerMonth.toLocaleString()} without auto-renew
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.perks.map((perk) => (
                      <li key={perk} className="flex items-start gap-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        <Check size={14} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSubscribe(tier.id as SubscriptionTierId)}
                    disabled={loading !== null || isCurrent}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{ background: tier.color }}
                  >
                    {loading === tier.id ? (
                      <><RefreshCw size={14} className="animate-spin" /> Processing…</>
                    ) : isCurrent ? (
                      "Current plan"
                    ) : isSubActive ? (
                      "Switch to this plan"
                    ) : (
                      "Get started"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Welcome coins note */}
          <p className="text-center text-sm mt-8" style={{ color: "var(--muted-foreground)" }}>
            New users get <strong>150 free coins</strong> to try premium content — no subscription required.
            Coins expire after 7 days if you don&apos;t subscribe.
          </p>

          {/* Coin info */}
          <div
            className="mt-10 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div>
              <div className="text-xl font-bold mb-1" style={{ color: "#c4426a" }}>50 coins</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>unlock a premium chapter</div>
            </div>
            <div>
              <div className="text-xl font-bold mb-1" style={{ color: "#c4426a" }}>120 coins</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>unlock a full story</div>
            </div>
            <div>
              <div className="text-xl font-bold mb-1" style={{ color: "#c4426a" }}>300 coins</div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>unlock an entire series</div>
            </div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
            Payments processed by Atlos — accepts crypto (USDC, USDT, ETH, and more).
            Subscription coins expire 30 days from purchase. Unused coins do not roll over.
          </p>
        </div>
      </div>
    </>
  );
}
