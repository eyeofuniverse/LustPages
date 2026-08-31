import { getDashboardMetrics } from "@/lib/queries";
import Link from "next/link";
import {
  BookOpen, Heart, Eye, Users, PenSquare, TrendingUp,
  Activity, UserPlus, Clock, AlertCircle, Tag, BarChart2,
  MessageSquare, Bookmark, Coins, FileWarning, ChevronRight,
  Globe, Sparkles,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { IndexNowButton } from "@/components/admin/IndexNowButton";
import { DashboardRefresher } from "@/components/admin/DashboardRefresher";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toLocaleString("en-US");
}

function StatCard({
  label, value, sub, icon, href, highlight,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon: React.ReactNode;
  href?: string;
  highlight?: "pink" | "green" | "amber" | "indigo";
}) {
  const colors: Record<string, { bg: string; border: string; val: string }> = {
    pink:   { bg: "rgba(196,66,106,0.06)",  border: "rgba(196,66,106,0.2)",  val: "#c4426a" },
    green:  { bg: "rgba(34,197,94,0.06)",   border: "rgba(34,197,94,0.2)",   val: "#22c55e" },
    amber:  { bg: "rgba(245,158,11,0.06)",  border: "rgba(245,158,11,0.2)",  val: "#f59e0b" },
    indigo: { bg: "rgba(99,102,241,0.06)",  border: "rgba(99,102,241,0.2)",  val: "#6366f1" },
  };
  const c = highlight ? colors[highlight] : null;

  const inner = (
    <div
      className="p-4 lg:p-5 rounded-2xl h-full flex flex-col justify-between"
      style={{
        background: c ? c.bg : "var(--card)",
        border: `1px solid ${c ? c.border : "var(--border)"}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wider leading-tight" style={{ color: "var(--muted-foreground)" }}>
          {label}
        </span>
        {icon}
      </div>
      <div>
        <div
          className="text-xl lg:text-2xl font-bold mb-0.5"
          style={{ fontFamily: "var(--font-playfair), serif", color: c ? c.val : "var(--foreground)" }}
        >
          {value}
        </div>
        {sub && <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{sub}</div>}
      </div>
    </div>
  );

  if (href) return <Link href={href} className="block transition-opacity hover:opacity-80">{inner}</Link>;
  return inner;
}

function BarRow({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium truncate pr-2" style={{ color: "var(--foreground)" }}>{label}</span>
        <span className="text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>{sub ?? fmt(value)}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, (value / Math.max(1, max)) * 100)}%`, background: color }} />
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, action, children }: { title: string; icon: React.ElementType; action?: { label: string; href: string }; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color: "#c4426a" }} />
          <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{title}</h3>
        </div>
        {action && (
          <Link href={action.href} className="text-xs font-medium transition-opacity hover:opacity-75 flex items-center gap-0.5" style={{ color: "#c4426a" }}>
            {action.label} <ChevronRight size={12} />
          </Link>
        )}
      </div>
      <div className="p-5 flex-1">{children}</div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
      {children}
    </p>
  );
}

export default async function AdminDashboard() {
  const m = await getDashboardMetrics();

  const maxTagCount     = m.topTags[0]?.storyCount || 1;
  const maxCatCount     = m.topCategories[0]?.storyCount || 1;
  const maxStoryViews   = m.topStoriesByViews[0]?.views || 1;
  const maxCoinEarnings = m.topAuthors[0]?.coinEarnings || 1;

  const actionItems = [
    m.pendingStories > 0    && { label: `${m.pendingStories} pending ${m.pendingStories === 1 ? "story" : "stories"}`, href: "/meminhaj/approvals", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
    m.pendingReports > 0    && { label: `${m.pendingReports} open ${m.pendingReports === 1 ? "report" : "reports"}`, href: "/meminhaj/reports", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    m.pendingTagRequests > 0 && { label: `${m.pendingTagRequests} tag ${m.pendingTagRequests === 1 ? "request" : "requests"}`, href: "/meminhaj/tag-requests", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  ].filter(Boolean) as { label: string; href: string; color: string; bg: string }[];

  return (
    <div className="max-w-5xl space-y-8">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            LustPages platform overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DashboardRefresher />
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
            style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <Globe size={13} /> View Site
          </Link>
          <Link
            href="/meminhaj/stories/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#c4426a" }}
          >
            <PenSquare size={13} /> New Story
          </Link>
        </div>
      </div>

      {/* Action Required */}
      {actionItems.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <AlertCircle size={14} style={{ color: "#f59e0b" }} />
          <span className="text-xs font-semibold mr-1" style={{ color: "#f59e0b" }}>Action required</span>
          {actionItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ background: item.bg, color: item.color }}
            >
              {item.label} <ChevronRight size={10} />
            </Link>
          ))}
        </div>
      )}

      {/* ── Audience ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Audience</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Readers"
            value={fmt(m.totalUsers)}
            sub={`+${fmt(m.newUsersMonth)} this month`}
            icon={<Users size={16} style={{ color: "#c4426a" }} />}
          />
          <StatCard
            label="New Today"
            value={`+${fmt(m.newUsersToday)}`}
            sub={`+${fmt(m.newUsersWeek)} this week`}
            icon={<UserPlus size={16} style={{ color: "#c4426a" }} />}
            highlight={m.newUsersToday > 0 ? "pink" : undefined}
          />
          <StatCard
            label="Active Today"
            value={fmt(m.activeUsersToday)}
            sub="liked, commented, or saved"
            icon={<Activity size={16} style={{ color: "#c4426a" }} />}
          />
          <StatCard
            label="Total Authors"
            value={fmt(m.totalAuthors)}
            sub="registered creators"
            icon={<Sparkles size={16} style={{ color: "#c4426a" }} />}
            href="/meminhaj/authors"
          />
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Content</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Stories"
            value={fmt(m.totalStories)}
            sub={`${fmt(m.publishedStories)} published · ${fmt(m.draftStories)} draft`}
            icon={<BookOpen size={16} style={{ color: "#c4426a" }} />}
            href="/meminhaj/stories"
          />
          <StatCard
            label="Total Views"
            value={fmt(m.totalViews)}
            sub="across all published stories"
            icon={<Eye size={16} style={{ color: "#c4426a" }} />}
          />
          <StatCard
            label="Avg Read Time"
            value={`${m.avgReadingTime} min`}
            sub="per published story"
            icon={<Clock size={16} style={{ color: "#c4426a" }} />}
          />
          <StatCard
            label="Moderation Queue"
            value={fmt(m.pendingStories)}
            sub={m.pendingStories > 0 ? "stories pending review" : "all clear"}
            icon={<FileWarning size={16} style={{ color: m.pendingStories > 0 ? "#6366f1" : "var(--muted-foreground)" }} />}
            href="/meminhaj/approvals"
            highlight={m.pendingStories > 0 ? "indigo" : undefined}
          />
        </div>
      </div>

      {/* ── Engagement ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Engagement</SectionLabel>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Likes"
            value={fmt(m.totalLikes)}
            sub={`+${fmt(m.newLikesToday)} today`}
            icon={<Heart size={16} style={{ color: "#c4426a" }} />}
            highlight={m.newLikesToday > 0 ? "pink" : undefined}
          />
          <StatCard
            label="Total Comments"
            value={fmt(m.totalComments)}
            sub={`+${fmt(m.newCommentsToday)} today`}
            icon={<MessageSquare size={16} style={{ color: "#c4426a" }} />}
            highlight={m.newCommentsToday > 0 ? "pink" : undefined}
          />
          <StatCard
            label="Total Bookmarks"
            value={fmt(m.totalBookmarks)}
            sub="saved by readers"
            icon={<Bookmark size={16} style={{ color: "#c4426a" }} />}
          />
          <StatCard
            label="Coin Transactions"
            value={fmt(m.coinTransactionsMonth)}
            sub={`${fmt(m.tipsMonth)} tips this month`}
            icon={<Coins size={16} style={{ color: "#f59e0b" }} />}
            highlight="amber"
          />
        </div>
      </div>

      {/* ── Top Stories + Top Categories ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Top Stories by Views" icon={TrendingUp} action={{ label: "All stories", href: "/meminhaj/stories" }}>
          {m.topStoriesByViews.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No published stories yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topStoriesByViews.map((story, i) => (
                <div key={story.id} className="flex items-start gap-3">
                  <span
                    className="text-xs font-bold w-5 shrink-0 mt-0.5 text-center"
                    style={{ color: i === 0 ? "#f59e0b" : "var(--muted-foreground)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/meminhaj/stories/${story.id}/edit`}
                      className="text-sm font-medium line-clamp-1 transition-opacity hover:opacity-75 block"
                      style={{ color: "var(--foreground)" }}
                    >
                      {story.title}
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>{story.author.name}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Eye size={10} />{fmt(story.views)}</span>
                      <span className="flex items-center gap-0.5"><Heart size={10} />{fmt(story._count.likes)}</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(3, (story.views / Math.max(1, maxStoryViews)) * 100)}%`, background: "#c4426a" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Categories by Stories" icon={BarChart2}>
          {m.topCategories.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No categories yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topCategories.map(({ name, color, storyCount }) => (
                <BarRow
                  key={name}
                  label={name}
                  value={storyCount}
                  max={maxCatCount}
                  color={color}
                  sub={`${fmt(storyCount)} ${storyCount === 1 ? "story" : "stories"}`}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Top Authors + Top Tags ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title="Top Authors by Earnings" icon={Sparkles} action={{ label: "All authors", href: "/meminhaj/authors" }}>
          {m.topAuthors.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No authors yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topAuthors.map((author) => (
                <div key={author.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold"
                    style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                  >
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/authors/${author.slug}`}
                        target="_blank"
                        className="text-sm font-medium truncate transition-opacity hover:opacity-75"
                        style={{ color: "var(--foreground)" }}
                      >
                        {author.name}
                      </Link>
                      <span
                        className="text-xs font-semibold shrink-0 flex items-center gap-0.5"
                        style={{ color: "#f59e0b" }}
                      >
                        <Coins size={11} />{fmt(author.coinEarnings)}
                      </span>
                    </div>
                    <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(3, (author.coinEarnings / Math.max(1, maxCoinEarnings)) * 100)}%`, background: "#f59e0b" }} />
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                      {author._count.stories} {author._count.stories === 1 ? "story" : "stories"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Top Tags by Stories" icon={Tag} action={{ label: "All tags", href: "/meminhaj/tags" }}>
          {m.topTags.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No tags yet.</p>
          ) : (
            <div className="space-y-3">
              {m.topTags.map(({ name, storyCount }) => (
                <BarRow
                  key={name}
                  label={`#${name}`}
                  value={storyCount}
                  max={maxTagCount}
                  color="#c4426a"
                  sub={`${fmt(storyCount)} ${storyCount === 1 ? "story" : "stories"}`}
                />
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* ── Recent Stories ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} style={{ color: "#c4426a" }} />
            <h2 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>Recent Stories</h2>
          </div>
          <Link href="/meminhaj/stories" className="text-xs font-medium transition-opacity hover:opacity-75 flex items-center gap-0.5" style={{ color: "#c4426a" }}>
            View all <ChevronRight size={12} />
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Title", "Author", "Status", "Views", "Likes", "Updated"].map((h, i) => (
                    <th
                      key={h}
                      className={`text-left px-4 py-3 text-xs font-medium uppercase tracking-wider ${i > 1 && i < 4 ? "hidden sm:table-cell" : ""} ${i >= 4 ? "hidden md:table-cell" : ""}`}
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {m.recentStories.map((story) => {
                  const statusLabel =
                    story.published ? "Published"
                    : story.status === "pending" ? "Pending"
                    : story.status === "scheduled" ? "Scheduled"
                    : "Draft";
                  const statusColor =
                    story.published ? { bg: "rgba(34,197,94,0.1)", color: "#22c55e" }
                    : story.status === "pending" ? { bg: "rgba(99,102,241,0.1)", color: "#6366f1" }
                    : story.status === "scheduled" ? { bg: "rgba(245,158,11,0.1)", color: "#f59e0b" }
                    : { bg: "rgba(156,163,175,0.15)", color: "var(--muted-foreground)" };

                  return (
                    <tr key={story.id} className="transition-opacity hover:opacity-80" style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 max-w-[180px]">
                        <Link
                          href={`/meminhaj/stories/${story.id}/edit`}
                          className="font-medium line-clamp-1 block"
                          style={{ color: "var(--foreground)" }}
                        >
                          {story.title}
                        </Link>
                        <span className="text-xs sm:hidden" style={{ color: "var(--muted-foreground)" }}>
                          {story.categories.map(c => c.name).join(", ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {story.author.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap" style={statusColor}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {fmt(story.views)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {fmt(story._count.likes)}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {formatDateShort(story.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tools */}
      <div className="mt-8 p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>SEO Tools</h2>
        <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>
          Run once to submit all existing published stories and series to Bing and other IndexNow-compatible search engines. New stories are submitted automatically on approval.
        </p>
        <IndexNowButton />
      </div>
    </div>
  );
}
