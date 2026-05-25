import { getDashboardMetrics } from "@/lib/queries";
import Link from "next/link";
import {
  BookOpen,
  Heart,
  Eye,
  Users,
  PenSquare,
  TrendingUp,
  Activity,
  UserPlus,
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  BarChart2,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MessageSquare,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

function fmt(n: number) {
  return n.toLocaleString("en-US");
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className="p-4 lg:p-5 rounded-2xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: "var(--muted-foreground)" }}
        >
          {label}
        </span>
        {icon}
      </div>
      <div
        className="text-xl lg:text-2xl font-bold mb-0.5"
        style={{
          fontFamily: "var(--font-playfair), serif",
          color: accent ? "#c4426a" : "var(--foreground)",
        }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-bold text-sm uppercase tracking-wider mb-3"
      style={{ color: "var(--muted-foreground)" }}
    >
      {children}
    </h2>
  );
}

const TRAFFIC_SOURCES = [
  { source: "Organic Search", pct: 45, color: "#22c55e" },
  { source: "Direct", pct: 28, color: "#6366f1" },
  { source: "Social Media", pct: 18, color: "#f59e0b" },
  { source: "Referral", pct: 9, color: "#c4426a" },
];

const DEVICES = [
  { device: "Mobile", pct: 58, icon: Smartphone, color: "#6366f1" },
  { device: "Desktop", pct: 35, icon: Monitor, color: "#22c55e" },
  { device: "Tablet", pct: 7, icon: Tablet, color: "#f59e0b" },
];

export default async function AdminDashboard() {
  const m = await getDashboardMetrics();

  const maxTagViews = m.topTags[0]?.views ?? 1;
  const maxCatViews = m.topCategories[0]?.views ?? 1;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            Overview of your LustPages site
          </p>
        </div>
        <Link
          href="/meminhaj/stories/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#c4426a" }}
        >
          <PenSquare size={15} />
          New Story
        </Link>
      </div>

      {/* ── Section 1: Audience & Activity ─────────────────────────────── */}
      <SectionTitle>Audience &amp; Activity</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Daily Active Users"
          value={fmt(m.activeUsersToday)}
          sub="users active today"
          icon={<Activity size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="New Registrations"
          value={fmt(m.newUsersToday)}
          sub={
            <span>
              +{fmt(m.newUsersWeek)} this week &middot; +{fmt(m.newUsersMonth)} this month
            </span>
          }
          icon={<UserPlus size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Paid Subscribers"
          value={fmt(m.paidSubscribers)}
          sub={`${((m.paidSubscribers / Math.max(1, m.totalUsers)) * 100).toFixed(1)}% conversion`}
          icon={<CreditCard size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Total Readers"
          value={fmt(m.totalUsers)}
          sub="registered accounts"
          icon={<Users size={18} style={{ color: "#c4426a" }} />}
        />
      </div>

      {/* ── Section 2: Revenue ─────────────────────────────────────────── */}
      <SectionTitle>Revenue</SectionTitle>
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatCard
          label="Revenue Today"
          value={fmtMoney(m.dailyRevenue)}
          sub="subscriptions"
          icon={<DollarSign size={18} style={{ color: "#22c55e" }} />}
          accent
        />
        <StatCard
          label="This Week"
          value={fmtMoney(m.weeklyRevenue)}
          sub="last 7 days"
          icon={<DollarSign size={18} style={{ color: "#22c55e" }} />}
          accent
        />
        <StatCard
          label="This Month"
          value={fmtMoney(m.monthlyRevenue)}
          sub="current month"
          icon={<DollarSign size={18} style={{ color: "#22c55e" }} />}
          accent
        />
      </div>

      {/* ── Section 3: Content Performance ────────────────────────────── */}
      <SectionTitle>Content Performance</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Story Reads"
          value={fmt(m.totalViews)}
          sub={`+${fmt(m.newLikesToday)} likes today`}
          icon={<Eye size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Avg Reading Time"
          value={`${m.avgReadingTime} min`}
          sub="per published story"
          icon={<Clock size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Completion Rate"
          value={`${m.completionRate}%`}
          sub="avg per story"
          icon={<CheckCircle2 size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Comments Today"
          value={fmt(m.newCommentsToday)}
          sub={`${fmt(m.totalLikes)} total likes`}
          icon={<MessageSquare size={18} style={{ color: "#c4426a" }} />}
        />
      </div>

      {/* ── Section 4: Creator & Moderation ───────────────────────────── */}
      <SectionTitle>Creator &amp; Moderation</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard
          label="Creator Earnings"
          value={fmtMoney(m.creatorEarningsMonth)}
          sub="paid out this month"
          icon={<DollarSign size={18} style={{ color: "#f59e0b" }} />}
        />
        <StatCard
          label="Total Stories"
          value={fmt(m.totalStories)}
          sub={`${fmt(m.publishedStories)} published`}
          icon={<BookOpen size={18} style={{ color: "#c4426a" }} />}
        />
        <StatCard
          label="Total Likes"
          value={fmt(m.totalLikes)}
          sub="across all stories"
          icon={<Heart size={18} style={{ color: "#c4426a" }} />}
        />
        <div
          className="p-4 lg:p-5 rounded-2xl"
          style={{
            background: m.pendingStories > 0 ? "rgba(99,102,241,0.06)" : "var(--card)",
            border: m.pendingStories > 0 ? "1px solid rgba(99,102,241,0.25)" : "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--muted-foreground)" }}
            >
              Moderation Queue
            </span>
            <AlertCircle size={18} style={{ color: m.pendingStories > 0 ? "#6366f1" : "var(--muted-foreground)" }} />
          </div>
          <div
            className="text-xl lg:text-2xl font-bold mb-0.5"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: m.pendingStories > 0 ? "#6366f1" : "var(--foreground)",
            }}
          >
            {fmt(m.pendingStories)}
          </div>
          <div className="text-xs flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <span>stories pending review</span>
            {m.pendingStories > 0 && (
              <Link
                href="/meminhaj/approvals"
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: "#6366f1" }}
              >
                Review →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Section 5: Top Tags & Categories ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Top Tags */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Tag size={14} style={{ color: "#c4426a" }} />
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Top Performing Tags
            </h3>
          </div>
          {m.topTags.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No tags yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topTags.map(({ tag, views, count }) => (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      #{tag}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {fmt(views)} views · {count} {count === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (views / maxTagViews) * 100)}%`,
                        background: "#c4426a",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Categories */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={14} style={{ color: "#c4426a" }} />
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Top Categories
            </h3>
          </div>
          {m.topCategories.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topCategories.map(({ name, color, views, count }) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {fmt(views)} views · {count} {count === 1 ? "story" : "stories"}
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(2, (views / maxCatViews) * 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 6: Traffic Sources & Device Breakdown ─────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Traffic Sources */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} style={{ color: "#c4426a" }} />
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Traffic Sources
            </h3>
          </div>
          <div className="space-y-3">
            {TRAFFIC_SOURCES.map(({ source, pct, color }) => (
              <div key={source}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    {source}
                  </span>
                  <span className="text-xs font-semibold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div
          className="p-5 rounded-2xl"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Smartphone size={14} style={{ color: "#c4426a" }} />
            <h3 className="font-bold text-sm" style={{ color: "var(--foreground)" }}>
              Device Breakdown
            </h3>
          </div>
          <div className="space-y-4">
            {DEVICES.map(({ device, pct, icon: Icon, color }) => (
              <div key={device} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: color + "18" }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {device}
                    </span>
                    <span className="text-xs font-semibold" style={{ color }}>
                      {pct}%
                    </span>
                  </div>
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 7: Recent Stories ──────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold flex items-center gap-2" style={{ color: "var(--foreground)" }}>
            <TrendingUp size={16} style={{ color: "#c4426a" }} />
            Recent Stories
          </h2>
          <Link
            href="/meminhaj/stories"
            className="text-sm transition-opacity hover:opacity-75"
            style={{ color: "#c4426a" }}
          >
            View all
          </Link>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Title
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Category
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Status
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Views
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {m.recentStories.map((story) => (
                  <tr key={story.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3 max-w-[160px] sm:max-w-xs">
                      <Link
                        href={`/meminhaj/stories/${story.id}/edit`}
                        className="font-medium line-clamp-1 transition-opacity hover:opacity-75"
                        style={{ color: "var(--foreground)" }}
                      >
                        {story.title}
                      </Link>
                    </td>
                    <td
                      className="px-4 py-3 hidden sm:table-cell"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {story.categories.map((c) => c.name).join(", ")}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{
                          background: story.published
                            ? "rgba(34,197,94,0.1)"
                            : "rgba(234,179,8,0.1)",
                          color: story.published ? "#22c55e" : "#eab308",
                        }}
                      >
                        {story.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 hidden sm:table-cell"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {fmt(story.views)}
                    </td>
                    <td
                      className="px-4 py-3 hidden md:table-cell"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {formatDateShort(story.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
