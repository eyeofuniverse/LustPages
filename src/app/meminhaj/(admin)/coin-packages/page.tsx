import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { Check, Zap, Flame, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Subscription Tiers" };

const TIER_ICONS = {
  spark: Zap,
  flame: Flame,
  inferno: Sparkles,
};

export default function SubscriptionTiersPage() {
  const tiers = Object.values(SUBSCRIPTION_TIERS);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Subscription Tiers
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Current tier configuration — edit <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--muted)" }}>src/lib/subscription-tiers.ts</code> to change tiers.
          Payments processed by Atlos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const Icon = TIER_ICONS[tier.id as keyof typeof TIER_ICONS];
          return (
            <div
              key={tier.id}
              className="rounded-2xl p-5 space-y-4"
              style={{ background: "var(--card)", border: `2px solid ${tier.color}40` }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: tier.color + "20" }}>
                  <Icon size={16} style={{ color: tier.color }} />
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: "var(--foreground)" }}>{tier.name}</p>
                  {tier.badge && (
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{ background: tier.color + "20", color: tier.color }}>
                      {tier.badge}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Price</span>
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>${tier.price}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Coins (one-time)</span>
                  <span className="font-semibold" style={{ color: tier.color }}>{tier.coinsPerMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>Coins (auto-renew)</span>
                  <span className="font-semibold" style={{ color: tier.color }}>{tier.coinsAutoRenew.toLocaleString()} <span className="text-xs font-normal" style={{ color: "var(--muted-foreground)" }}>(+25%)</span></span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--muted-foreground)" }}>$/coin (one-time)</span>
                  <span className="font-mono text-xs" style={{ color: "var(--foreground)" }}>
                    ${(tier.price / tier.coinsPerMonth).toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>Perks</p>
                <ul className="space-y-1">
                  {tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                      {perk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="rounded-2xl p-4 text-sm"
        style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
      >
        <p className="font-semibold mb-1" style={{ color: "#f59e0b" }}>Note</p>
        <p style={{ color: "var(--muted-foreground)" }}>
          Tiers are defined in code, not in the database. To add, remove, or reprice tiers you must edit{" "}
          <code className="px-1 py-0.5 rounded text-xs" style={{ background: "var(--muted)" }}>src/lib/subscription-tiers.ts</code>{" "}
          and redeploy. Auto-renew carries a built-in +25% bonus to incentivise recurring subscriptions.
          Payout rate is 100 coins = $1.00 to authors (80% of unlock/tip value).
        </p>
      </div>
    </div>
  );
}
