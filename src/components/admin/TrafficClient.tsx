"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Globe, Monitor, Smartphone, Tablet, Link2, FileText, Clock,
  TrendingUp, RefreshCw, ExternalLink,
} from "lucide-react";
import type { TrafficData, TrafficSource, TopReferrer, DeviceStat, HourStat, TopPage } from "@/lib/visitor-analytics";

const PERIODS = [
  { label: "24h", days: 1 },
  { label: "7d",  days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
];

const CATEGORY_COLORS: Record<string, string> = {
  direct:   "#6366f1",
  search:   "#10b981",
  social:   "#f59e0b",
  referral: "#3b82f6",
  internal: "#8b5cf6",
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  desktop: <Monitor size={14} />,
  mobile:  <Smartphone size={14} />,
  tablet:  <Tablet size={14} />,
};

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function fmtHour(h: number) {
  const ap = h < 12 ? "am" : "pm";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}${ap}`;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  const c = color ?? "#c4426a";
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-2 rounded-xl shrink-0" style={{ background: `${c}20`, color: c }}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{label}</p>
        <p className="text-xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>}
      </div>
    </div>
  );
}

// ── Horizontal bar ────────────────────────────────────────────────────────────
function HBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)", width: "60px" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
    </div>
  );
}

// ── Traffic Sources panel ─────────────────────────────────────────────────────
function SourcesPanel({ sources, total }: { sources: TrafficSource[]; total: number }) {
  const max = sources[0]?.count ?? 1;

  // Group into categories for summary row
  const grouped: Record<string, number> = {};
  for (const s of sources) {
    grouped[s.category] = (grouped[s.category] ?? 0) + s.count;
  }

  const categoryLabels: Record<string, string> = {
    direct: "Direct", search: "Organic Search", social: "Social Media",
    referral: "Referral", internal: "Internal",
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Globe size={14} style={{ color: "#c4426a" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Traffic Sources</h2>
        <span className="ml-auto text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
          {fmt(total)} total visits
        </span>
      </div>

      {/* Category summary pills */}
      <div className="flex flex-wrap gap-2 px-4 pt-3 pb-2">
        {Object.entries(grouped).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: `${CATEGORY_COLORS[cat] ?? "#888"}18`, color: CATEGORY_COLORS[cat] ?? "#888" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[cat] ?? "#888" }} />
            {categoryLabels[cat] ?? cat}: {fmt(count)}
          </div>
        ))}
      </div>

      {/* Per-source rows */}
      {sources.length === 0 ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
          No traffic data yet. It appears once visitors start arriving.
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {sources.slice(0, 20).map((s) => {
            const color = CATEGORY_COLORS[s.category] ?? "#888";
            return (
              <div key={s.source} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                <span className="flex-1 text-sm truncate" style={{ color: "var(--foreground)" }}>{s.source}</span>
                <HBar value={s.count} max={max} color={color} />
                <span className="w-10 text-right text-xs tabular-nums font-semibold shrink-0" style={{ color }}>
                  {s.pct}%
                </span>
                <span className="w-12 text-right text-xs tabular-nums shrink-0" style={{ color: "var(--muted-foreground)" }}>
                  {fmt(s.count)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Top Referrers panel ───────────────────────────────────────────────────────
function ReferrersPanel({ referrers }: { referrers: TopReferrer[] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link2 size={14} style={{ color: "#3b82f6" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Top Referrers</h2>
      </div>
      {referrers.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No external referrers yet.</div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {referrers.map((r, i) => (
            <div key={r.domain} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs w-5 text-right shrink-0 tabular-nums" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
              <a
                href={r.domain}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm truncate flex items-center gap-1 hover:opacity-75"
                style={{ color: "var(--foreground)" }}
              >
                {r.domain.replace(/^https?:\/\//, "")}
                <ExternalLink size={10} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
              </a>
              <span className="text-xs tabular-nums shrink-0" style={{ color: "var(--muted-foreground)" }}>{r.pct}%</span>
              <span className="text-xs tabular-nums shrink-0 font-semibold" style={{ color: "#3b82f6" }}>{fmt(r.count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Device Breakdown panel ────────────────────────────────────────────────────
function DevicesPanel({ devices }: { devices: DeviceStat[] }) {
  const deviceColors: Record<string, string> = {
    desktop: "#6366f1", mobile: "#10b981", tablet: "#f59e0b",
  };
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Monitor size={14} style={{ color: "#6366f1" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Device Breakdown</h2>
      </div>
      <div className="p-4 space-y-3">
        {devices.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: "var(--muted-foreground)" }}>No data yet.</p>
        ) : (
          devices.map((d) => {
            const color = deviceColors[d.device] ?? "#888";
            return (
              <div key={d.device}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="flex items-center gap-1.5 text-sm capitalize font-medium" style={{ color: "var(--foreground)" }}>
                    <span style={{ color }}>{DEVICE_ICONS[d.device] ?? <Monitor size={14} />}</span>
                    {d.device}
                  </span>
                  <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                    {fmt(d.count)} · {d.pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(d.pct, 1)}%`, background: color }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Peak Hours panel ──────────────────────────────────────────────────────────
function PeakHoursPanel({ hours }: { hours: HourStat[] }) {
  const max = Math.max(...hours.map((h) => h.count), 1);
  const peakHour = hours.reduce((a, b) => (b.count > a.count ? b : a), hours[0]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <Clock size={14} style={{ color: "#f59e0b" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Peak Hours</h2>
        {peakHour && max > 0 && (
          <span className="ml-auto text-xs" style={{ color: "var(--muted-foreground)" }}>
            Peak: {fmtHour(peakHour.hour)} UTC
          </span>
        )}
      </div>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-end gap-0.5 h-20">
          {hours.map(({ hour, count }) => {
            const pct = (count / max) * 100;
            const isPeak = hour === peakHour?.hour;
            return (
              <div key={hour} className="flex-1 flex flex-col items-center group relative">
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    background: isPeak ? "#f59e0b" : "rgba(245,158,11,0.3)",
                    minHeight: "3px",
                  }}
                />
                <div
                  className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  style={{ background: "var(--foreground)", color: "var(--background)" }}
                >
                  {fmtHour(hour)}: {count}
                </div>
              </div>
            );
          })}
        </div>
        {/* X-axis labels: every 6h */}
        <div className="relative mt-1" style={{ height: "14px" }}>
          {[0, 6, 12, 18, 23].map((h) => (
            <span
              key={h}
              className="absolute text-[9px] tabular-nums -translate-x-1/2"
              style={{ left: `${(h / 23) * 100}%`, color: "var(--muted-foreground)" }}
            >
              {fmtHour(h)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Top Pages panel ───────────────────────────────────────────────────────────
function TopPagesPanel({ pages }: { pages: TopPage[] }) {
  const max = pages[0]?.count ?? 1;
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
        <FileText size={14} style={{ color: "#c4426a" }} />
        <h2 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Top Pages</h2>
      </div>
      {pages.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>No page data yet.</div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {pages.map((p, i) => (
            <div key={p.path} className="flex items-center gap-3 px-4 py-2.5">
              <span className="text-xs w-5 text-right shrink-0 tabular-nums" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
              <a
                href={p.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-xs font-mono truncate hover:opacity-75"
                style={{ color: "var(--foreground)" }}
              >
                {p.path}
              </a>
              <HBar value={p.count} max={max} color="#c4426a" />
              <span className="text-xs tabular-nums font-semibold shrink-0" style={{ color: "#c4426a" }}>
                {fmt(p.count)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function TrafficClient({ data: initial }: { data: TrafficData }) {
  const [data, setData] = useState(initial);
  const [days, setDays] = useState(initial.days);
  const [loading, setLoading] = useState(false);
  const mounted = useRef(false);

  const load = useCallback(async (d: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/traffic?days=${d}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  // Skip initial mount — SSR already provided initial data for the default period
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    load(days);
  }, [days, load]);

  const mobile = data.devices.find((d) => d.device === "mobile");
  const directSrc = data.sources.find((s) => s.source === "Direct");
  const topSrc = data.sources.filter((s) => s.category !== "direct" && s.category !== "internal")[0];

  return (
    <div>
      {/* Period selector */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {fmt(data.totalVisits)} page visits in the last {days === 1 ? "24 hours" : `${days} days`}
        </p>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw size={13} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />}
          <div className="flex gap-1">
            {PERIODS.map(({ label, days: d }) => (
              <button
                key={label}
                onClick={() => setDays(d)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: days === d ? "#c4426a" : "var(--card)",
                  color: days === d ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<TrendingUp size={16} />}
          label="Total Visits"
          value={fmt(data.totalVisits)}
          color="#c4426a"
        />
        <StatCard
          icon={<Globe size={16} />}
          label="Top Source"
          value={topSrc?.source ?? directSrc?.source ?? "Direct"}
          sub={topSrc ? `${topSrc.pct}% of traffic` : undefined}
          color={CATEGORY_COLORS[topSrc?.category ?? "direct"]}
        />
        <StatCard
          icon={<Smartphone size={16} />}
          label="Mobile Share"
          value={mobile ? `${mobile.pct}%` : "—"}
          sub={mobile ? `${fmt(mobile.count)} visits` : undefined}
          color="#10b981"
        />
        <StatCard
          icon={<Link2 size={16} />}
          label="Direct Traffic"
          value={directSrc ? `${directSrc.pct}%` : "—"}
          sub={directSrc ? `${fmt(directSrc.count)} visits` : undefined}
          color="#6366f1"
        />
      </div>

      {/* Main panels — 2 column on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SourcesPanel sources={data.sources} total={data.totalVisits} />
        <div className="space-y-6">
          <DevicesPanel devices={data.devices} />
          <PeakHoursPanel hours={data.peakHours} />
        </div>
        <ReferrersPanel referrers={data.topReferrers} />
        <TopPagesPanel pages={data.topPages} />
      </div>
    </div>
  );
}
