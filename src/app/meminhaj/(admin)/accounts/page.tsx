import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_TIERS } from "@/lib/subscription-tiers";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import { Clock } from "lucide-react";
import {
  DollarSign, Coins, TrendingUp, TrendingDown, Users,
  CreditCard, AlertCircle, ArrowUp, ArrowDown,
} from "lucide-react";
import { TransactionsTable } from "./TransactionsTable";

const C = 100; // coins per dollar
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const fmtCoins = (n: number) => n.toLocaleString();

export default async function AccountsPage() {
  if (!PAYMENTS_ENABLED) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Clock size={40} className="mb-4" style={{ color: "var(--muted-foreground)" }} />
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>Accounts &amp; Finance</h2>
        <p className="text-sm max-w-sm" style={{ color: "var(--muted-foreground)" }}>
          Payment processing is not yet enabled. This dashboard will become active once coins and payments are live.
        </p>
      </div>
    );
  }

  const now = new Date();

  const [
    atlosRevenue,
    unlockStats,
    tipStats,
    subGrantStats,
    welcomeStats,
    walletStats,
    activeSubs,
    authorRows,
    topHolders,
  ] = await Promise.all([
    // Cash revenue: completed Atlos payments
    prisma.atlosPayment.aggregate({ where: { status: "completed" }, _sum: { amount: true }, _count: true }),
    prisma.storyUnlock.aggregate({ _sum: { coinsSpent: true }, _count: true }),
    prisma.tip.aggregate({ _sum: { amount: true, authorShare: true, platformShare: true }, _count: true }),
    prisma.coinTransaction.aggregate({ where: { type: "subscription_grant" }, _sum: { amount: true }, _count: true }),
    prisma.coinTransaction.aggregate({ where: { type: "welcome_bonus" }, _sum: { amount: true }, _count: true }),
    prisma.user.aggregate({ _sum: { coinBalance: true } }),
    // Only count subscriptions whose billing period has not yet ended
    prisma.subscription.findMany({
      where: { status: "active", currentPeriodEnd: { gte: now } },
      select: { tier: true },
    }),
    prisma.author.findMany({
      select: { id: true, name: true, slug: true, coinEarnings: true, user: { select: { email: true } } },
      orderBy: { coinEarnings: "desc" },
      take: 15,
    }),
    prisma.user.findMany({
      where: { coinBalance: { gt: 0 } },
      select: { id: true, name: true, email: true, coinBalance: true, subscription: { select: { tier: true, status: true, currentPeriodEnd: true } } },
      orderBy: { coinBalance: "desc" },
      take: 10,
    }),
  ]);

  // ── Computed ──────────────────────────────────────────────
  const grossRevenue = atlosRevenue._sum.amount ?? 0; // USD from completed Atlos payments

  const unlockCoins = unlockStats._sum.coinsSpent ?? 0;
  const unlockRevenue = unlockCoins / C;
  const unlockAuthorShare = unlockRevenue * 0.8;
  const unlockPlatformShare = unlockRevenue * 0.2;

  const tipAuthorShare = (tipStats._sum.authorShare ?? 0) / C;
  const tipPlatformShare = (tipStats._sum.platformShare ?? 0) / C;
  const tipTotal = (tipStats._sum.amount ?? 0) / C;

  const subGrantCoins = subGrantStats._sum.amount ?? 0;
  const welcomeCoins = welcomeStats._sum.amount ?? 0;
  const subGrantCost = subGrantCoins / C;

  const outstandingLiability = (walletStats._sum.coinBalance ?? 0) / C;
  const totalAuthorOwed = authorRows.reduce((s, a) => s + a.coinEarnings, 0) / C;

  const platformNet = unlockPlatformShare + tipPlatformShare - subGrantCost;

  // MRR from active subs
  const tierCounts: Record<string, number> = {};
  for (const s of activeSubs) tierCounts[s.tier] = (tierCounts[s.tier] ?? 0) + 1;
  const mrr = Object.entries(tierCounts).reduce((sum, [tierId, count]) => {
    const tier = SUBSCRIPTION_TIERS[tierId as keyof typeof SUBSCRIPTION_TIERS];
    return sum + (tier?.price ?? 0) * count;
  }, 0);
  const totalActiveSubscribers = activeSubs.length;

  // Coin circulation
  const totalCoinsIssued = subGrantCoins + welcomeCoins;
  const totalCoinsSpent = unlockCoins + (tipStats._sum.amount ?? 0);
  const coinsInWallets = walletStats._sum.coinBalance ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
            Accounts & Finance
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Platform accounting — coin economics, P&amp;L, author payouts, liabilities
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}
        >
          <AlertCircle size={12} /> Live — Atlos payments
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          icon={<DollarSign size={16} />}
          label="Gross Revenue"
          value={fmt(grossRevenue)}
          sub={`${atlosRevenue._count} Atlos payments`}
          accent="#22c55e"
        />
        <KpiCard
          icon={<TrendingUp size={16} />}
          label="Platform Net"
          value={fmt(platformNet)}
          sub="After author cuts & sub grants"
          accent={platformNet >= 0 ? "#22c55e" : "#ef4444"}
          trend={platformNet >= 0 ? "up" : "down"}
        />
        <KpiCard
          icon={<TrendingDown size={16} />}
          label="Author Payouts Owed"
          value={fmt(totalAuthorOwed)}
          sub={`${fmtCoins(authorRows.reduce((s, a) => s + a.coinEarnings, 0))} coins`}
          accent="#f59e0b"
        />
        <KpiCard
          icon={<AlertCircle size={16} />}
          label="Coin Liability"
          value={fmt(outstandingLiability)}
          sub={`${fmtCoins(coinsInWallets)} coins in wallets`}
          accent="#6366f1"
        />
        <KpiCard
          icon={<Users size={16} />}
          label="Active Subscribers"
          value={String(totalActiveSubscribers)}
          sub={`Projected MRR ${fmt(mrr)}`}
          accent="#c4426a"
        />
        <KpiCard
          icon={<CreditCard size={16} />}
          label="Total Unlocks"
          value={String(unlockStats._count)}
          sub={`${fmt(unlockRevenue)} unlock pool`}
          accent="#0ea5e9"
        />
      </div>

      {/* ── P&L Statement ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income */}
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <ArrowUp size={14} style={{ color: "#22c55e" }} /> Income
          </h2>
          <div className="space-y-3">
            <PnlRow label="Subscription revenue (Atlos)" coins={null} dollars={grossRevenue} accent="#22c55e" />
            <PnlRow label="Platform share — unlocks (20%)" coins={Math.round(unlockPlatformShare * C)} dollars={unlockPlatformShare} accent="#22c55e" />
            <PnlRow label="Platform share — tips (20%)" coins={Math.round(tipPlatformShare * C)} dollars={tipPlatformShare} accent="#22c55e" />
            <PnlRow label="Projected MRR (subscriptions)" coins={null} dollars={mrr} accent="#22c55e" />
            <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Total Income</span>
                <span className="text-sm font-bold" style={{ color: "#22c55e" }}>
                  {fmt(grossRevenue + unlockPlatformShare + tipPlatformShare + mrr)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <ArrowDown size={14} style={{ color: "#ef4444" }} /> Expenses & Liabilities
          </h2>
          <div className="space-y-3">
            <PnlRow label="Author cut — unlocks (80%)" coins={Math.round(unlockAuthorShare * C)} dollars={unlockAuthorShare} accent="#ef4444" />
            <PnlRow label="Author cut — tips (80%)" coins={Math.round(tipAuthorShare * C)} dollars={tipAuthorShare} accent="#ef4444" />
            <PnlRow label="Subscription coin grants" coins={subGrantCoins} dollars={subGrantCost} accent="#ef4444" />
            <PnlRow label="Outstanding coin liability" coins={coinsInWallets} dollars={outstandingLiability} accent="#f59e0b" note="unrealised" />
            <div className="pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>Total Expenses</span>
                <span className="text-sm font-bold" style={{ color: "#ef4444" }}>
                  {fmt(unlockAuthorShare + tipAuthorShare + subGrantCost + outstandingLiability)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Net P&L ───────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between p-5 rounded-2xl"
        style={{ background: platformNet >= 0 ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${platformNet >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--muted-foreground)" }}>
            Platform Net (realised — excluding liability)
          </p>
          <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: platformNet >= 0 ? "#22c55e" : "#ef4444" }}>
            {platformNet >= 0 ? "+" : ""}{fmt(platformNet)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Breakdown</p>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {fmt(unlockPlatformShare)} unlocks + {fmt(tipPlatformShare)} tips
          </p>
          <p className="text-sm" style={{ color: "#ef4444" }}>− {fmt(subGrantCost)} sub grants</p>
        </div>
      </div>

      {/* ── Coin Circulation ──────────────────────────────────── */}
      <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-5" style={{ color: "var(--foreground)" }}>Coin Circulation</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <CoinFlowCard label="Issued (welcome bonus)" coins={welcomeCoins} color="#22c55e" />
          <CoinFlowCard label="Issued (sub grants)" coins={subGrantCoins} color="#6366f1" />
          <CoinFlowCard label="Spent (unlocks + tips)" coins={totalCoinsSpent} color="#f59e0b" />
          <CoinFlowCard label="Sitting in wallets" coins={coinsInWallets} color="#c4426a" />
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>
            <span>Coins spent vs total issued</span>
            <span>{totalCoinsIssued > 0 ? Math.round((totalCoinsSpent / totalCoinsIssued) * 100) : 0}% utilisation</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${totalCoinsIssued > 0 ? Math.min(100, Math.round((totalCoinsSpent / totalCoinsIssued) * 100)) : 0}%`,
                background: "linear-gradient(90deg, #22c55e, #c4426a)",
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Subscription Breakdown ────────────────────────────── */}
      {totalActiveSubscribers > 0 && (
        <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Active Subscriptions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.values(SUBSCRIPTION_TIERS).map((tier) => {
              const count = tierCounts[tier.id] ?? 0;
              return (
                <div key={tier.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: tier.color + "10", border: `1px solid ${tier.color}30` }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: tier.color + "20" }}>
                    <Users size={14} style={{ color: tier.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{tier.name}</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{count} subscribers · {fmt(tier.price * count)}/mo</p>
                  </div>
                  <div className="text-lg font-bold" style={{ color: tier.color }}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Author Payouts ────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Author Payouts Owed</h2>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>80% of unlocks + tips</span>
        </div>
        {authorRows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>No author earnings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <Th>Author</Th>
                  <Th>Email</Th>
                  <Th align="right">Coins Earned</Th>
                  <Th align="right">$ Owed</Th>
                  <Th align="right">% of Pool</Th>
                </tr>
              </thead>
              <tbody>
                {authorRows.map((a, i) => {
                  const dollarOwed = a.coinEarnings / C;
                  const pct = totalAuthorOwed > 0 ? (dollarOwed / totalAuthorOwed) * 100 : 0;
                  return (
                    <tr key={a.id} style={{ borderBottom: i < authorRows.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <Td>
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{a.name}</span>
                      </Td>
                      <Td>
                        <span style={{ color: "var(--muted-foreground)" }}>{a.user?.email ?? "—"}</span>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-xs" style={{ color: "#f59e0b" }}>{fmtCoins(a.coinEarnings)}</span>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold" style={{ color: a.coinEarnings > 0 ? "#22c55e" : "var(--muted-foreground)" }}>
                          {fmt(dollarOwed)}
                        </span>
                      </Td>
                      <Td align="right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "#c4426a" }} />
                          </div>
                          <span className="text-xs w-10 text-right" style={{ color: "var(--muted-foreground)" }}>{pct.toFixed(1)}%</span>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <Th>Total</Th>
                  <Th />
                  <Th align="right">
                    <span className="font-mono text-xs" style={{ color: "#f59e0b" }}>
                      {fmtCoins(authorRows.reduce((s, a) => s + a.coinEarnings, 0))}
                    </span>
                  </Th>
                  <Th align="right">
                    <span style={{ color: "#22c55e" }}>{fmt(totalAuthorOwed)}</span>
                  </Th>
                  <Th />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* ── Outstanding Coin Holders (Liability) ──────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Coin Holders — Outstanding Liability</h2>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Users with unspent coin balances</span>
        </div>
        {topHolders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>No coin balances</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <Th>User</Th>
                  <Th>Plan</Th>
                  <Th align="right">Coins</Th>
                  <Th align="right">$ Liability</Th>
                </tr>
              </thead>
              <tbody>
                {topHolders.map((u, i) => {
                  const isActiveSub = u.subscription?.status === "active" &&
                    u.subscription.currentPeriodEnd != null &&
                    new Date(u.subscription.currentPeriodEnd) > now;
                  const subTier = isActiveSub
                    ? SUBSCRIPTION_TIERS[u.subscription!.tier as keyof typeof SUBSCRIPTION_TIERS]
                    : null;
                  return (
                    <tr key={u.id} style={{ borderBottom: i < topHolders.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <Td>
                        <div>
                          <p className="font-medium" style={{ color: "var(--foreground)" }}>{u.name}</p>
                          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.email}</p>
                        </div>
                      </Td>
                      <Td>
                        {subTier ? (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: subTier.color + "20", color: subTier.color }}>
                            {subTier.name}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Free</span>
                        )}
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-xs font-semibold" style={{ color: "#f59e0b" }}>{fmtCoins(u.coinBalance)}</span>
                      </Td>
                      <Td align="right">
                        <span className="font-semibold" style={{ color: "#6366f1" }}>{fmt(u.coinBalance / C)}</span>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Transactions Ledger ───────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Transaction Ledger</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Full audit trail of all coin movements</p>
        </div>
        <TransactionsTable />
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, accent, trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  accent: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: accent + "20" }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        {trend && (
          trend === "up"
            ? <ArrowUp size={14} style={{ color: "#22c55e" }} />
            : <ArrowDown size={14} style={{ color: "#ef4444" }} />
        )}
      </div>
      <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
    </div>
  );
}

function PnlRow({
  label, coins, dollars, accent, note,
}: {
  label: string;
  coins: number | null;
  dollars: number;
  accent: string;
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div>
        <span style={{ color: "var(--foreground)" }}>{label}</span>
        {note && <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>{note}</span>}
      </div>
      <div className="text-right">
        <span className="font-semibold" style={{ color: accent }}>{fmt(dollars)}</span>
        {coins !== null && (
          <span className="ml-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{fmtCoins(coins)}c</span>
        )}
      </div>
    </div>
  );
}

function CoinFlowCard({ label, coins, color }: { label: string; coins: number; color: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: color + "10", border: `1px solid ${color}25` }}>
      <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{label}</p>
      <p className="text-lg font-bold font-mono" style={{ color }}>{fmtCoins(coins)}</p>
      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{fmt(coins / C)}</p>
    </div>
  );
}

function Th({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return (
    <th
      className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${align === "right" ? "text-right" : "text-left"}`}
      style={{ color: "var(--muted-foreground)", background: "var(--card)" }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children?: React.ReactNode; align?: "right" }) {
  return (
    <td className={`px-5 py-3 ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </td>
  );
}
