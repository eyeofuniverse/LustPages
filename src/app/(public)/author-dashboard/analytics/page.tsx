import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import Link from "next/link";
import {
  getAuthorByUserId,
  getAuthorAnalytics,
} from "@/lib/queries";
import {
  Eye, Heart, MessageCircle, Bookmark, TrendingUp,
  Users, ArrowLeft, Tag, Coins, BarChart2, Layers, BookOpen,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics — Author Dashboard" };

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

// ── Chart components (server-rendered SVG) ───────────────────────────────────

function WeeklyChart({ data }: { data: { label: string; views: number }[] }) {
  const maxViews = Math.max(...data.map((d) => d.views), 1);
  const BAR_W = 52, GAP = 16, MAX_H = 88, SVG_H = 138, START_X = 36;

  return (
    <svg
      viewBox={`0 0 600 ${SVG_H}`}
      className="w-full"
      aria-label="Weekly views bar chart"
      style={{ color: "var(--muted-foreground)" }}
    >
      {[25, 50, 75].map((pct) => {
        const y = MAX_H + 5 - (pct / 100) * MAX_H;
        return (
          <line
            key={pct}
            x1={0} x2={600} y1={y} y2={y}
            stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} strokeDasharray="4 4"
          />
        );
      })}

      {data.map((week, i) => {
        const x = START_X + i * (BAR_W + GAP);
        const barH = week.views === 0 ? 2 : Math.max((week.views / maxViews) * MAX_H, 4);
        const y = MAX_H + 5 - barH;
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={BAR_W} height={barH} rx={6}
              fill="#c4426a" fillOpacity={week.views === 0 ? 0.12 : 0.85}
            />
            {week.views > 0 && (
              <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fontSize="10" fill="currentColor">
                {week.views}
              </text>
            )}
            <text x={x + BAR_W / 2} y={SVG_H - 6} textAnchor="middle" fontSize="9" fill="currentColor">
              {week.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RetentionCurve({ data }: { data: { milestone: number; pct: number }[] }) {
  if (data.length === 0) return null;
  const W = 600, H = 130;
  const PAD = { top: 10, right: 10, bottom: 35, left: 35 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const toX = (m: number) => PAD.left + (m / 100) * plotW;
  const toY = (p: number) => PAD.top + ((100 - p) / 100) * plotH;

  const pts = data.map((d) => `${toX(d.milestone)},${toY(d.pct)}`).join(" ");
  const first = data[0], last = data[data.length - 1];
  const areaPath = [
    `M ${toX(first.milestone)},${toY(first.pct)}`,
    ...data.slice(1).map((d) => `L ${toX(d.milestone)},${toY(d.pct)}`),
    `L ${toX(last.milestone)},${PAD.top + plotH}`,
    `L ${toX(first.milestone)},${PAD.top + plotH}`,
    "Z",
  ].join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ color: "var(--muted-foreground)" }}>
      {[25, 50, 75, 100].map((pct) => (
        <g key={pct}>
          <line
            x1={PAD.left} x2={W - PAD.right}
            y1={toY(pct)} y2={toY(pct)}
            stroke="currentColor" strokeOpacity={0.15} strokeWidth={1}
          />
          <text x={PAD.left - 6} y={toY(pct) + 4} textAnchor="end" fontSize="9" fill="currentColor">
            {pct}%
          </text>
        </g>
      ))}
      <path d={areaPath} fill="#c4426a" fillOpacity={0.12} />
      <polyline points={pts} fill="none" stroke="#c4426a" strokeWidth="2.5" strokeLinejoin="round" />
      {data.map((d) => (
        <circle key={d.milestone} cx={toX(d.milestone)} cy={toY(d.pct)} r={3} fill="#c4426a" />
      ))}
      {[0, 25, 50, 75, 100].map((m) => (
        <text key={m} x={toX(m)} y={H - 8} textAnchor="middle" fontSize="9" fill="currentColor">
          {m}%
        </text>
      ))}
    </svg>
  );
}

function TrafficBars({
  items,
  isTag = false,
}: {
  items: { name: string; color?: string; views: number; stories: number }[];
  isTag?: boolean;
}) {
  const max = Math.max(...items.map((i) => i.views), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name}>
          <div className="flex justify-between text-xs mb-1">
            <span className="font-medium truncate mr-2" style={{ color: "var(--foreground)" }}>
              {isTag ? `#${item.name}` : item.name}
            </span>
            <span style={{ color: "var(--muted-foreground)" }}>
              {fmt(item.views)} · {item.stories}
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.round((item.views / max) * 100)}%`,
                background: item.color ?? "#c4426a",
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label, value, sub, icon, color,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: color + "18" }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
      <div
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        {value}
      </div>
      {sub && <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{sub}</p>}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function AuthorAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getAuthorByUserId(session.user.id);
  if (!author) redirect("/author-signup");

  const {
    storyStats, weeklyViews, topTags, topCategories, retentionCurve,
    totalViews, totalLikes, totalComments, totalBookmarks,
    allReaders, overallCompletionRate, tips, totalTipCoins, totalTipCount,
    totalEarnings, totalUnlockCoins, pendingEarnings,
  } = await getAuthorAnalytics(author.id);

  const hasReaders = allReaders > 0;
  const hasEarnings = totalEarnings > 0 || totalUnlockCoins > 0;
  const hasTips = totalTipCount > 0;
  const allZeroViews = weeklyViews.every((w) => w.views === 0);
  const halfwayPct = retentionCurve.find((d) => d.milestone === 50)?.pct ?? 0;

  if (storyStats.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href="/author-dashboard"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div
          className="text-center py-24 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <BarChart2 size={40} className="mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
          <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>No published stories yet</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Analytics appear once your first story is approved and published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/author-dashboard"
            className="inline-flex items-center gap-1.5 text-sm mb-2 transition-opacity hover:opacity-70"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <h1
            className="text-2xl sm:text-3xl font-bold flex items-center gap-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            <BarChart2 size={24} style={{ color: "#c4426a" }} />
            Analytics
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {storyStats.length} published {storyStats.length === 1 ? "story" : "stories"}
        </p>
      </div>

      {/* ── Summary cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="Total Views"
          value={fmt(totalViews)}
          icon={<Eye size={16} />}
          color="#c4426a"
        />
        <StatCard
          label="Likes & Saves"
          value={fmt(totalLikes)}
          sub={`${fmt(totalBookmarks)} bookmarks · ${fmt(totalComments)} comments`}
          icon={<Heart size={16} />}
          color="#f43f5e"
        />
        <StatCard
          label="Total Readers"
          value={fmt(allReaders)}
          sub={hasReaders ? `${overallCompletionRate}% finish rate` : "No reads tracked yet"}
          icon={<Users size={16} />}
          color="#8b5cf6"
        />
        {PAYMENTS_ENABLED && (
          <StatCard
            label="Coins Earned"
            value={totalEarnings}
            sub={hasTips ? `${totalTipCoins} from tips · ${totalUnlockCoins} from unlocks` : "unlocks + tips"}
            icon={<Coins size={16} />}
            color="#eab308"
          />
        )}
      </div>

      {/* ── Weekly Views Chart ──────────────────────────────────────── */}
      <section className="mb-10">
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
              <TrendingUp size={18} style={{ color: "#c4426a" }} />
              Weekly Views
            </h2>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Last 8 weeks</span>
          </div>
          {allZeroViews ? (
            <p className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
              View tracking just started — data will appear here over the coming weeks.
            </p>
          ) : (
            <WeeklyChart data={weeklyViews} />
          )}
        </div>
      </section>

      {/* ── Story Performance Table ─────────────────────────────────── */}
      <section className="mb-10">
        <h2
          className="font-bold text-lg mb-4 flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <BookOpen size={18} style={{ color: "#c4426a" }} />
          Story Performance
        </h2>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {/* Mobile cards */}
          <div className="sm:hidden divide-y" style={{ borderColor: "var(--border)" }}>
            {storyStats.map((story) => (
              <div key={story.id} className="p-4">
                <Link
                  href={`/stories/${story.slug}`}
                  className="font-semibold text-sm line-clamp-1 hover:opacity-75 transition-opacity"
                  style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                >
                  {story.title}
                </Link>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span className="flex items-center gap-1"><Eye size={11} /> {fmt(story.views)}</span>
                  <span className="flex items-center gap-1"><Heart size={11} /> {fmt(story.likes)}</span>
                  <span className="flex items-center gap-1"><Bookmark size={11} /> {fmt(story.bookmarks)}</span>
                  <span className="flex items-center gap-1"><MessageCircle size={11} /> {fmt(story.comments)}</span>
                  <span className="flex items-center gap-1"><Users size={11} /> {story.totalReaders}</span>
                  <span className="flex items-center gap-1">✓ {story.completionRate}%</span>
                </div>
                {story.unlockCount > 0 && (
                  <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: "#eab308" }}>
                    <Coins size={11} />
                    {story.unlockCoins} coins · {story.unlockCount} unlocks
                  </p>
                )}
                {story.totalReaders > 0 && (
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${story.completionRate}%`,
                        background: story.completionRate >= 70 ? "#22c55e" : story.completionRate >= 40 ? "#eab308" : "#c4426a",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Story", "Views", "Likes", "Saved", "Comments", "Readers", "Finish Rate", "Earnings"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium text-xs"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {storyStats.map((story, i) => (
                  <tr
                    key={story.id}
                    style={{ borderBottom: i < storyStats.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <td className="px-4 py-3 max-w-[190px]">
                      <Link
                        href={`/stories/${story.slug}`}
                        className="font-semibold hover:opacity-75 transition-opacity line-clamp-1 block"
                        style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                      >
                        {story.title}
                      </Link>
                      {story.categories[0] && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full mt-0.5 inline-block"
                          style={{ background: story.categories[0].color + "18", color: story.categories[0].color }}
                        >
                          {story.categories[0].name}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold" style={{ color: "var(--foreground)" }}>
                      {fmt(story.views)}
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{fmt(story.likes)}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{fmt(story.bookmarks)}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{fmt(story.comments)}</td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{story.totalReaders}</td>
                    <td className="px-4 py-3">
                      {story.totalReaders === 0 ? (
                        <span style={{ color: "var(--muted-foreground)" }}>—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${story.completionRate}%`,
                                background: story.completionRate >= 70 ? "#22c55e" : story.completionRate >= 40 ? "#eab308" : "#c4426a",
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>
                            {story.completionRate}%
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {story.unlockCount > 0 ? (
                        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#eab308" }}>
                          <Coins size={11} />
                          {story.unlockCoins} ({story.unlockCount})
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Free</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Tags + Categories ───────────────────────────────────────── */}
      {(topTags.length > 0 || topCategories.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {topTags.length > 0 && (
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Tag size={18} style={{ color: "#c4426a" }} />
                Top Tags by Views
              </h2>
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <TrafficBars items={topTags} isTag />
              </div>
            </section>
          )}

          {topCategories.length > 0 && (
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Layers size={18} style={{ color: "#c4426a" }} />
                Top Categories
              </h2>
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <TrafficBars items={topCategories} />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Reader Retention Curve ──────────────────────────────────── */}
      {hasReaders && retentionCurve.length > 0 && (
        <section className="mb-10">
          <div className="rounded-2xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
              <div>
                <h2 className="font-bold text-lg flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                  <TrendingUp size={18} style={{ color: "#c4426a" }} />
                  Reader Retention Curve
                </h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  % of readers who reached each milestone (approximated by scroll depth)
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <p className="font-bold text-lg" style={{ color: "#8b5cf6", fontFamily: "var(--font-playfair), serif" }}>{halfwayPct}%</p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>reach halfway</p>
                </div>
                <div className="text-center">
                  <p
                    className="font-bold text-lg"
                    style={{
                      color: overallCompletionRate >= 60 ? "#22c55e" : overallCompletionRate >= 30 ? "#eab308" : "#c4426a",
                      fontFamily: "var(--font-playfair), serif",
                    }}
                  >
                    {overallCompletionRate}%
                  </p>
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>finish</p>
                </div>
              </div>
            </div>
            <RetentionCurve data={retentionCurve} />
            <p className="text-xs text-center mt-2" style={{ color: "var(--muted-foreground)" }}>
              Reading progress →
            </p>
          </div>
        </section>
      )}

      {/* ── Earnings + Tips ─────────────────────────────────────────── */}
      {PAYMENTS_ENABLED && (hasEarnings || hasTips) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings breakdown */}
          {hasEarnings && (
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Coins size={18} style={{ color: "#c4426a" }} />
                Earnings Breakdown
              </h2>
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>From unlocks (80%)</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{totalUnlockCoins} coins</span>
                  </div>
                  <div className="flex justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span style={{ color: "var(--muted-foreground)" }}>From tips (80%)</span>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{totalTipCoins} coins</span>
                  </div>
                  <div className="flex justify-between pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>Total earned (all time)</span>
                    <span className="font-bold text-base" style={{ color: "#eab308" }}>{totalEarnings} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--muted-foreground)" }}>Pending withdrawal</span>
                    <span className="font-semibold" style={{ color: "#22c55e" }}>{pendingEarnings} coins</span>
                  </div>
                </div>

                {/* Per-story premium breakdown */}
                {storyStats.filter((s) => s.unlockCount > 0).length > 0 && (
                  <div className="mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs font-semibold tracking-wide mb-3" style={{ color: "var(--muted-foreground)" }}>
                      BY STORY
                    </p>
                    <div className="space-y-2">
                      {storyStats
                        .filter((s) => s.unlockCount > 0)
                        .map((story) => (
                          <div key={story.id} className="flex justify-between items-center text-xs">
                            <Link
                              href={`/stories/${story.slug}`}
                              className="truncate max-w-[150px] hover:opacity-75 transition-opacity"
                              style={{ color: "var(--foreground)" }}
                            >
                              {story.title}
                            </Link>
                            <span style={{ color: "#eab308" }}>
                              {story.unlockCoins}c · {story.unlockCount} unlocks
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Recent tips */}
          {hasTips && (
            <section>
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                <Heart size={18} style={{ color: "#c4426a" }} />
                Recent Tips
              </h2>
              <div className="rounded-2xl p-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex gap-6 mb-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
                    >
                      {totalTipCoins}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>coins from tips</p>
                  </div>
                  <div>
                    <p
                      className="text-2xl font-bold"
                      style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                    >
                      {totalTipCount}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>total tips</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {tips.map((tip) => (
                    <div key={tip.id} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                          {tip.fromUser.name}
                        </p>
                        {tip.story && (
                          <Link
                            href={`/stories/${tip.story.slug}`}
                            className="text-xs truncate block hover:opacity-75 transition-opacity"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            {tip.story.title}
                          </Link>
                        )}
                        {tip.message && (
                          <p
                            className="text-xs italic mt-0.5 line-clamp-1"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            &ldquo;{tip.message}&rdquo;
                          </p>
                        )}
                      </div>
                      <span
                        className="shrink-0 text-sm font-bold flex items-center gap-1"
                        style={{ color: "#c4426a" }}
                      >
                        <Coins size={13} />{tip.authorShare}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
