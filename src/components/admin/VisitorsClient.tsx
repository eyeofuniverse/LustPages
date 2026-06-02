"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Globe, Users, Activity, TrendingUp } from "lucide-react";
import type { VisitorData, VisitorGroup, RecentVisit, TopPage } from "@/lib/visitor-analytics";

function flag(code: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div
      className="flex items-center gap-3 p-4 rounded-2xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="p-2 rounded-xl" style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}>
        {icon}
      </div>
      <div>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</p>
        <p className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
      </div>
    </div>
  );
}

function VisitorTable({ visitors }: { visitors: VisitorGroup[] }) {
  if (visitors.length === 0) {
    return <p className="text-sm py-8 text-center" style={{ color: "var(--muted-foreground)" }}>No visitors yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["IP Address", "Country", "City", "Pages Visited", "Visits", "Last Seen"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v.ip} style={{ borderBottom: "1px solid var(--border)" }} className="hover:opacity-80 transition-opacity">
              <td className="px-3 py-2.5 font-mono text-xs" style={{ color: "var(--foreground)" }}>{v.ip}</td>
              <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>
                <span className="mr-1">{flag(v.countryCode)}</span>
                {v.country ?? <span style={{ color: "var(--muted-foreground)" }}>Unknown</span>}
              </td>
              <td className="px-3 py-2.5" style={{ color: "var(--muted-foreground)" }}>{v.city ?? "—"}</td>
              <td className="px-3 py-2.5 max-w-xs">
                <div className="flex flex-wrap gap-1">
                  {v.paths.slice(0, 3).map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded-md text-xs font-mono truncate max-w-[160px]" style={{ background: "var(--background)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                      {p}
                    </span>
                  ))}
                  {v.paths.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded-md text-xs" style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>
                      +{v.paths.length - 3} more
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-center" style={{ color: "var(--foreground)" }}>
                <span className="font-semibold">{v.visitCount}</span>
              </td>
              <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{timeAgo(v.lastSeen)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentTable({ visits }: { visits: RecentVisit[] }) {
  if (visits.length === 0) {
    return <p className="text-sm py-8 text-center" style={{ color: "var(--muted-foreground)" }}>No activity yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Time", "IP Address", "Country", "Page"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:opacity-80 transition-opacity">
              <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{timeAgo(v.visitedAt)}</td>
              <td className="px-3 py-2.5 font-mono text-xs" style={{ color: "var(--foreground)" }}>{v.ip}</td>
              <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>
                <span className="mr-1">{flag(v.countryCode)}</span>
                {v.country ?? <span style={{ color: "var(--muted-foreground)" }}>Unknown</span>}
              </td>
              <td className="px-3 py-2.5 font-mono text-xs max-w-xs truncate" style={{ color: "var(--muted-foreground)" }}>{v.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPagesTable({ pages }: { pages: TopPage[] }) {
  const max = pages[0]?.count ?? 1;
  return (
    <div className="space-y-2">
      {pages.map((p) => (
        <div key={p.path} className="flex items-center gap-3">
          <span className="font-mono text-xs truncate flex-1" style={{ color: "var(--muted-foreground)" }}>{p.path}</span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: "#c4426a" }} />
            </div>
            <span className="text-xs font-semibold w-8 text-right" style={{ color: "var(--foreground)" }}>{p.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { key: "visitors", label: "Visitors" },
  { key: "recent", label: "Recent Activity" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function VisitorsClient({ data }: { data: VisitorData }) {
  const [tab, setTab] = useState<Tab>("visitors");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Activity size={16} />} label="Total Visits" value={data.totalVisits.toLocaleString()} />
        <StatCard icon={<Users size={16} />} label="Unique Visitors" value={data.uniqueVisitors.toLocaleString()} />
        <StatCard icon={<Globe size={16} />} label="Top Country" value={data.topCountry ?? "—"} />
        <StatCard icon={<TrendingUp size={16} />} label="Top Page" value={data.topPages[0]?.path ?? "—"} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main table */}
        <div
          className="lg:col-span-2 rounded-2xl overflow-hidden"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--background)" }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: tab === key ? "var(--card)" : "transparent",
                    color: tab === key ? "#c4426a" : "var(--muted-foreground)",
                    border: tab === key ? "1px solid var(--border)" : "1px solid transparent",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-75"
              style={{ background: "var(--background)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              disabled={refreshing}
            >
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
          <div className="p-1">
            {tab === "visitors" && <VisitorTable visitors={data.visitors} />}
            {tab === "recent" && <RecentTable visits={data.recentVisits} />}
          </div>
        </div>

        {/* Top pages sidebar */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>Top Pages</h2>
          {data.topPages.length === 0
            ? <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No data yet.</p>
            : <TopPagesTable pages={data.topPages} />
          }
        </div>
      </div>
    </div>
  );
}
