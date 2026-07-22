import {
  getTagAnalytics,
  getCategoryAnalytics,
  getSearchAnalytics,
} from "@/lib/queries";
import { getVisitorData } from "@/lib/visitor-analytics";
import { VisitorsClient } from "@/components/admin/VisitorsClient";
import Link from "next/link";
import {
  Eye, Heart, MessageCircle, Star, Search, BarChart2, Tag, FolderOpen,
  Users, TrendingUp, AlertCircle,
} from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

const TABS = [
  { key: "visitors", label: "Visitors", icon: Users },
  { key: "tags", label: "Tags", icon: Tag },
  { key: "categories", label: "Categories", icon: FolderOpen },
  { key: "search", label: "Search Terms", icon: Search },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SEARCH_PERIODS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

interface Props {
  searchParams: Promise<{ tab?: string; days?: string }>;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const activeTab = (TABS.some((t) => t.key === sp.tab) ? sp.tab : "visitors") as TabKey;
  const searchDays = Math.min(90, Math.max(7, parseInt(sp.days ?? "30", 10)));

  const [visitorData, tagData, categoryData, searchData] = await Promise.all([
    activeTab === "visitors" ? getVisitorData(7) : Promise.resolve(null),
    activeTab === "tags" ? getTagAnalytics() : Promise.resolve(null),
    activeTab === "categories" ? getCategoryAnalytics() : Promise.resolve(null),
    activeTab === "search" ? getSearchAnalytics(searchDays) : Promise.resolve(null),
  ]);

  function tabUrl(key: string, extra?: Record<string, string>) {
    const p = new URLSearchParams({ tab: key, ...extra });
    return `/meminhaj/analytics?${p}`;
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          Platform performance across visitors, content, and search
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "var(--muted)" }}
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = activeTab === key;
          return (
            <Link
              key={key}
              href={tabUrl(key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: active ? "var(--card)" : "transparent",
                color: active ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>

      {/* ── VISITORS TAB ──────────────────────────────────────────── */}
      {activeTab === "visitors" && visitorData && (
        <VisitorsClient data={visitorData} />
      )}

      {/* ── TAGS TAB ──────────────────────────────────────────────── */}
      {activeTab === "tags" && tagData && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {tagData.length} approved tags — sorted by total story views
            </p>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {tagData.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>
                No approved tags yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider w-6" style={{ color: "var(--muted-foreground)" }}>#</th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Tag</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Stories</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Views</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Likes</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Comments</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--muted-foreground)" }}>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tagData.map((tag, i) => (
                      <tr
                        key={tag.id}
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/tags/${tag.slug}`}
                            target="_blank"
                            className="font-medium text-sm hover:opacity-75"
                            style={{ color: "var(--foreground)" }}
                          >
                            #{tag.name}
                          </Link>
                          {tag.tier <= 2 && (
                            <span
                              className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
                            >
                              T{tag.tier}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {tag.storyCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-sm font-semibold flex items-center justify-end gap-1" style={{ color: "var(--foreground)" }}>
                            <Eye size={11} style={{ color: "var(--muted-foreground)" }} />
                            {tag.totalViews.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center justify-end gap-1">
                            <Heart size={10} /> {tag.totalLikes.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center justify-end gap-1">
                            <MessageCircle size={10} /> {tag.totalComments.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden lg:table-cell">
                          {tag.avgRating > 0 ? (
                            <span className="flex items-center justify-end gap-1 font-semibold" style={{ color: "#c4426a" }}>
                              <Star size={10} fill="#c4426a" /> {tag.avgRating.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CATEGORIES TAB ──────────────────────────────────────────── */}
      {activeTab === "categories" && categoryData && (
        <div>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            {categoryData.length} categories — sorted by total story views
          </p>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {categoryData.length === 0 ? (
              <div className="py-16 text-center" style={{ color: "var(--muted-foreground)" }}>No categories yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider w-6" style={{ color: "var(--muted-foreground)" }}>#</th>
                      <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Category</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Stories</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Total Views</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Likes</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Comments</th>
                      <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--muted-foreground)" }}>Avg Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((cat, i) => (
                      <tr key={cat.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/categories/${cat.slug}`}
                            target="_blank"
                            className="font-medium text-sm hover:opacity-75 flex items-center gap-2"
                            style={{ color: "var(--foreground)" }}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: cat.color }}
                            />
                            {cat.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {cat.storyCount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className="text-sm font-semibold flex items-center justify-end gap-1" style={{ color: "var(--foreground)" }}>
                            <Eye size={11} style={{ color: "var(--muted-foreground)" }} />
                            {cat.totalViews.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center justify-end gap-1">
                            <Heart size={10} /> {cat.totalLikes.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center justify-end gap-1">
                            <MessageCircle size={10} /> {cat.totalComments.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-xs hidden lg:table-cell">
                          {cat.avgRating > 0 ? (
                            <span className="flex items-center justify-end gap-1 font-semibold" style={{ color: "#c4426a" }}>
                              <Star size={10} fill="#c4426a" /> {cat.avgRating.toFixed(1)}
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted-foreground)" }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SEARCH TERMS TAB ──────────────────────────────────────────── */}
      {activeTab === "search" && searchData && (
        <div>
          {/* Period selector */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {searchData.total.toLocaleString()} searches in the last {searchDays} days
            </p>
            <div className="flex gap-1">
              {SEARCH_PERIODS.map(({ label, days }) => (
                <Link
                  key={label}
                  href={tabUrl("search", { days: String(days) })}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: searchDays === days ? "#c4426a" : "var(--card)",
                    color: searchDays === days ? "white" : "var(--muted-foreground)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top search terms */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <TrendingUp size={14} style={{ color: "#c4426a" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Top Search Terms</h2>
              </div>
              {searchData.topQueries.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No searches recorded yet. They appear here once readers start searching.
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {searchData.topQueries.slice(0, 30).map((q, i) => (
                    <div key={q.query} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-xs tabular-nums w-5 text-right shrink-0" style={{ color: "var(--muted-foreground)" }}>
                        {i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                        {q.query}
                      </span>
                      <span className="text-xs tabular-nums shrink-0 font-semibold" style={{ color: "#c4426a" }}>
                        {q.count}×
                      </span>
                      {q.zeroResults > 0 && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                          title={`${q.zeroResults} searches returned 0 results`}
                        >
                          <AlertCircle size={9} /> {q.zeroResults} no results
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent searches */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <BarChart2 size={14} style={{ color: "#c4426a" }} />
                <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Recent Searches</h2>
              </div>
              {searchData.recentQueries.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  No recent searches.
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {searchData.recentQueries.map((q, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="flex-1 text-sm truncate" style={{ color: "var(--foreground)" }}>{q.query}</span>
                      <span className="text-xs tabular-nums shrink-0" style={{ color: q.results === 0 ? "#ef4444" : "var(--muted-foreground)" }}>
                        {q.results === 0 ? "0 results" : `${q.results} results`}
                      </span>
                      <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--muted-foreground)" }}>
                        {formatDateShort(new Date(q.createdAt))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
