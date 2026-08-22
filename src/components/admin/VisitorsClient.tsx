"use client";

import { useState, useCallback, useEffect } from "react";
import { RefreshCw, Globe, Users, Activity, TrendingUp, Zap, BarChart2 } from "lucide-react";
import type { VisitorData, VisitorGroup, RecentVisit, TopPage, CountryStat, DailyTraffic } from "@/lib/visitor-analytics";

// ── Helpers ──────────────────────────────────────────────────────────────────

function flag(code: string | null) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

function timeAgo(iso: string, now: number) {
  const ts = new Date(iso).getTime();
  if (isNaN(ts)) return "unknown";
  const diff = now - ts;
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return `${Math.floor(d / 30)}mo ago`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-2 rounded-xl shrink-0" style={{ background: accent ? `${accent}20` : "rgba(196,66,106,0.12)", color: accent ?? "#c4426a" }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{label}</p>
        <p className="text-xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>}
      </div>
    </div>
  );
}

function TrafficChart({ data, days }: { data: DailyTraffic[]; days: number }) {
  const max = Math.max(...data.map((d) => d.visits), 1);
  const show = days <= 14 ? data : data.filter((_, i) => i % Math.ceil(days / 14) === 0 || i === data.length - 1);

  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {show.map((d) => {
          const pct = (d.visits / max) * 100;
          const isToday = d.date === new Date().toISOString().slice(0, 10);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div
                className="w-full rounded-t-sm transition-all"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: isToday ? "#c4426a" : "rgba(196,66,106,0.35)",
                  minHeight: "3px",
                }}
              />
              {/* Tooltip */}
              <div
                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
                style={{ background: "var(--foreground)", color: "var(--background)" }}
              >
                {fmtDate(d.date)}: {d.visits.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{fmtDate(data[0]?.date ?? "")}</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{fmtDate(data[data.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}

function VisitorTable({ visitors, now }: { visitors: VisitorGroup[]; now: number }) {
  if (visitors.length === 0) return <EmptyState msg="No visitors yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["IP Address", "Location", "Pages Visited", "Visits", "Last Seen"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visitors.map((v) => (
            <tr key={v.ip} style={{ borderBottom: "1px solid var(--border)" }} className="hover:opacity-75 transition-opacity">
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: "var(--foreground)" }}>{v.ip}</td>
              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
                <span className="mr-1">{flag(v.countryCode)}</span>
                <span>{v.country ?? <span style={{ color: "var(--muted-foreground)" }}>Unknown</span>}</span>
                {v.city && <span className="ml-1 text-xs" style={{ color: "var(--muted-foreground)" }}>· {v.city}</span>}
              </td>
              <td className="px-3 py-2.5 max-w-xs">
                <div className="flex flex-wrap gap-1">
                  {v.paths.slice(0, 3).map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded text-xs font-mono truncate max-w-[140px]" style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>{p}</span>
                  ))}
                  {v.paths.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>+{v.paths.length - 3} more</span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 text-center font-semibold" style={{ color: "var(--foreground)" }}>{v.visitCount}</td>
              <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{timeAgo(v.lastSeen, now)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityTable({ visits, now }: { visits: RecentVisit[]; now: number }) {
  if (visits.length === 0) return <EmptyState msg="No activity yet." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Time", "IP Address", "Country", "Page"].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }} className="hover:opacity-75 transition-opacity">
              <td className="px-3 py-2.5 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{timeAgo(v.visitedAt, now)}</td>
              <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap" style={{ color: "var(--foreground)" }}>{v.ip}</td>
              <td className="px-3 py-2.5 whitespace-nowrap" style={{ color: "var(--foreground)" }}>
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

function CountriesTable({ countries, total }: { countries: CountryStat[]; total: number }) {
  if (countries.length === 0) return <EmptyState msg="No country data yet." />;
  const max = countries[0]?.count ?? 1;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Country", "Visitors", "Share", ""].map((h) => (
              <th key={h} className="px-3 py-2 text-left text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {countries.map((c) => (
            <tr key={c.country} style={{ borderBottom: "1px solid var(--border)" }} className="hover:opacity-75 transition-opacity">
              <td className="px-3 py-2.5" style={{ color: "var(--foreground)" }}>
                <span className="mr-2">{flag(c.countryCode)}</span>{c.country}
              </td>
              <td className="px-3 py-2.5 font-semibold" style={{ color: "var(--foreground)" }}>{c.count.toLocaleString()}</td>
              <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                {total > 0 ? `${Math.round((c.count / total) * 100)}%` : "—"}
              </td>
              <td className="px-3 py-2.5 w-32">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                  <div className="h-full rounded-full" style={{ width: `${(c.count / max) * 100}%`, background: "#c4426a" }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopPagesList({ pages }: { pages: TopPage[] }) {
  const max = pages[0]?.count ?? 1;
  if (pages.length === 0) return <EmptyState msg="No data yet." />;
  return (
    <div className="space-y-2.5">
      {pages.map((p, i) => (
        <div key={p.path} className="flex items-center gap-2">
          <span className="text-xs font-semibold w-4 shrink-0 text-right" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
          <span className="font-mono text-xs truncate flex-1" style={{ color: "var(--muted-foreground)" }} title={p.path}>{p.path}</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
              <div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: "#c4426a" }} />
            </div>
            <span className="text-xs font-semibold w-8 text-right" style={{ color: "var(--foreground)" }}>{p.count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return <p className="text-sm py-8 text-center" style={{ color: "var(--muted-foreground)" }}>{msg}</p>;
}

// ── Main component ────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
] as const;

const TABS = [
  { key: "visitors", label: "Visitors" },
  { key: "activity", label: "Activity" },
  { key: "countries", label: "Countries" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function VisitorsClient({ data: initialData }: { data: VisitorData }) {
  const [data, setData] = useState(initialData);
  const [activeDays, setActiveDays] = useState(initialData.days);
  const [tab, setTab] = useState<Tab>("visitors");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  const fetchRange = useCallback(async (days: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/visitors?days=${days}`);
      if (res.ok) {
        setData(await res.json());
        setActiveDays(days);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = () => fetchRange(activeDays);

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {RANGE_OPTIONS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => fetchRange(days)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              style={{
                background: activeDays === days ? "#c4426a" : "transparent",
                color: activeDays === days ? "white" : "var(--muted-foreground)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-75 disabled:opacity-50"
          style={{ background: "var(--card)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Activity size={16} />} label="Total Visits" value={data.totalVisits.toLocaleString()} sub={`last ${activeDays}d`} />
        <StatCard icon={<Users size={16} />} label="Unique Visitors" value={data.uniqueVisitors.toLocaleString()} />
        <StatCard
          icon={<Zap size={16} />}
          label="Online Now"
          value={data.onlineNow}
          sub="last 5 minutes"
          accent={data.onlineNow > 0 ? "#22c55e" : undefined}
        />
        <StatCard icon={<TrendingUp size={16} />} label="Pages / Visitor" value={data.avgPagesPerVisitor} />
      </div>

      {/* Traffic chart */}
      <div className="p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} style={{ color: "#c4426a" }} />
          <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            Daily Traffic
          </h2>
          <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>
            peak: {Math.max(...data.dailyTraffic.map((d) => d.visits)).toLocaleString()} visits
          </span>
        </div>
        <TrafficChart data={data.dailyTraffic} days={activeDays} />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {/* Tabs */}
          <div className="flex items-center gap-2 px-4 pt-3 pb-0" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex gap-0.5">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="px-3 py-2 text-xs font-semibold transition-all relative"
                  style={{ color: tab === key ? "#c4426a" : "var(--muted-foreground)" }}
                >
                  {label}
                  {tab === key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#c4426a" }} />
                  )}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
              {tab === "visitors" && `${data.visitors.length} IPs`}
              {tab === "activity" && `last ${data.recentVisits.length} hits`}
              {tab === "countries" && `${data.topCountries.length} countries`}
            </span>
          </div>
          <div className="p-1">
            {tab === "visitors" && <VisitorTable visitors={data.visitors} now={now} />}
            {tab === "activity" && <ActivityTable visits={data.recentVisits} now={now} />}
            {tab === "countries" && <CountriesTable countries={data.topCountries} total={data.uniqueVisitors} />}
          </div>
        </div>

        {/* Top pages */}
        <div className="rounded-2xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Globe size={14} style={{ color: "#c4426a" }} />
            <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Top Pages</h2>
          </div>
          <TopPagesList pages={data.topPages} />
        </div>
      </div>
    </div>
  );
}
