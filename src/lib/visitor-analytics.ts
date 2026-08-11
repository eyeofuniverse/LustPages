import { prisma } from "@/lib/prisma";

// ── Traffic / Referrer types ──────────────────────────────────────────────────
export type TrafficSource = { source: string; category: string; count: number; pct: number };
export type TopReferrer = { domain: string; count: number; pct: number };
export type DeviceStat = { device: string; count: number; pct: number };
export type HourStat = { hour: number; count: number };

export type TrafficData = {
  totalVisits: number;
  sources: TrafficSource[];
  topReferrers: TopReferrer[];
  topPages: TopPage[];
  devices: DeviceStat[];
  peakHours: HourStat[];
  days: number;
};

const SITE_HOST = "lustpages.com";

function classifyReferrer(referrer: string | null): { source: string; category: string } {
  if (!referrer) return { source: "Direct", category: "direct" };
  try {
    const host = new URL(referrer).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === SITE_HOST || host.endsWith(`.${SITE_HOST}`)) return { source: "Internal", category: "internal" };
    if (/google\./i.test(host))     return { source: "Google", category: "search" };
    if (/bing\.com/i.test(host))    return { source: "Bing", category: "search" };
    if (/yandex\./i.test(host))     return { source: "Yandex", category: "search" };
    if (/duckduckgo\.com/i.test(host)) return { source: "DuckDuckGo", category: "search" };
    if (/yahoo\./i.test(host))      return { source: "Yahoo", category: "search" };
    if (/baidu\.com/i.test(host))   return { source: "Baidu", category: "search" };
    if (/twitter\.com|x\.com/i.test(host)) return { source: "Twitter / X", category: "social" };
    if (/facebook\.com|fb\.com/i.test(host)) return { source: "Facebook", category: "social" };
    if (/reddit\.com/i.test(host))  return { source: "Reddit", category: "social" };
    if (/pinterest\./i.test(host))  return { source: "Pinterest", category: "social" };
    if (/tiktok\.com/i.test(host))  return { source: "TikTok", category: "social" };
    if (/instagram\.com/i.test(host)) return { source: "Instagram", category: "social" };
    if (/t\.me|telegram\./i.test(host)) return { source: "Telegram", category: "social" };
    if (/tumblr\.com/i.test(host))  return { source: "Tumblr", category: "social" };
    return { source: host, category: "referral" };
  } catch {
    return { source: "Direct", category: "direct" };
  }
}

export async function getTrafficAnalytics(days: number): Promise<TrafficData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const visits = await prisma.pageVisit.findMany({
    where: { visitedAt: { gte: since } },
    select: { path: true, referrer: true, deviceType: true, userAgent: true, visitedAt: true },
    orderBy: { visitedAt: "desc" },
    take: 20000,
  });

  const total = visits.length;

  // Traffic sources
  const sourceMap = new Map<string, { category: string; count: number }>();
  const referrerDomainMap = new Map<string, number>();
  const pageMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const hourBuckets = new Array(24).fill(0) as number[];

  for (const visit of visits) {
    const { source, category } = classifyReferrer(visit.referrer);
    const existing = sourceMap.get(source);
    if (existing) existing.count++;
    else sourceMap.set(source, { category, count: 1 });

    if (visit.referrer && category !== "internal") {
      referrerDomainMap.set(visit.referrer, (referrerDomainMap.get(visit.referrer) ?? 0) + 1);
    }

    pageMap.set(visit.path, (pageMap.get(visit.path) ?? 0) + 1);

    // Device: prefer stored deviceType, fall back to parsing userAgent
    let device = visit.deviceType ?? "unknown";
    if (device === "unknown" && visit.userAgent) {
      const ua = visit.userAgent;
      if (/tablet|ipad/i.test(ua)) device = "tablet";
      else if (/mobile|iphone|ipod|android/i.test(ua)) device = "mobile";
      else device = "desktop";
    }
    deviceMap.set(device, (deviceMap.get(device) ?? 0) + 1);

    hourBuckets[new Date(visit.visitedAt).getUTCHours()]++;
  }

  const sources: TrafficSource[] = [...sourceMap.entries()]
    .map(([source, { category, count }]) => ({
      source,
      category,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const topReferrers: TopReferrer[] = [...referrerDomainMap.entries()]
    .map(([domain, count]) => ({ domain, count, pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  const topPages: TopPage[] = [...pageMap.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 25);

  const deviceTotal = [...deviceMap.values()].reduce((s, n) => s + n, 0);
  const devices: DeviceStat[] = [...deviceMap.entries()]
    .map(([device, count]) => ({
      device,
      count,
      pct: deviceTotal > 0 ? Math.round((count / deviceTotal) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const peakHours: HourStat[] = hourBuckets.map((count, hour) => ({ hour, count }));

  return { totalVisits: total, sources, topReferrers, topPages, devices, peakHours, days };
}

// All dates are ISO strings to avoid RSC Date serialization issues
export type VisitorGroup = {
  ip: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  paths: string[];
  visitCount: number;
  firstSeen: string;
  lastSeen: string;
};

export type TopPage = { path: string; count: number };
export type DailyTraffic = { date: string; visits: number };
export type CountryStat = { country: string; countryCode: string | null; count: number };

export type RecentVisit = {
  id: string;
  ip: string;
  country: string | null;
  countryCode: string | null;
  path: string;
  visitedAt: string;
};

export type VisitorData = {
  totalVisits: number;
  uniqueVisitors: number;
  onlineNow: number;
  avgPagesPerVisitor: number;
  topCountry: string | null;
  topCountries: CountryStat[];
  visitors: VisitorGroup[];
  topPages: TopPage[];
  recentVisits: RecentVisit[];
  dailyTraffic: DailyTraffic[];
  days: number;
};

type IpApiResult = {
  query: string;
  status: string;
  country?: string;
  countryCode?: string;
  city?: string;
};

async function resolveGeo(uncachedIps: string[]): Promise<Map<string, { country: string | null; countryCode: string | null; city: string | null }>> {
  const map = new Map<string, { country: string | null; countryCode: string | null; city: string | null }>();
  if (uncachedIps.length === 0) return map;

  const ipsToResolve = uncachedIps.slice(0, 300);
  for (let i = 0; i < ipsToResolve.length; i += 100) {
    const batch = ipsToResolve.slice(i, i + 100);
    try {
      const res = await fetch(
        "http://ip-api.com/batch?fields=query,status,country,countryCode,city",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(batch.map((ip) => ({ query: ip }))),
          signal: AbortSignal.timeout(4000),
        }
      );
      if (!res.ok) continue;
      const results: IpApiResult[] = await res.json();
      const upserts = results
        .filter((r) => r.query)
        .map((r) => {
          const geo = {
            country: r.status === "success" ? (r.country ?? null) : null,
            countryCode: r.status === "success" ? (r.countryCode ?? null) : null,
            city: r.status === "success" ? (r.city ?? null) : null,
          };
          map.set(r.query, geo);
          return prisma.ipGeoCache.upsert({
            where: { ip: r.query },
            create: { ip: r.query, ...geo },
            update: geo,
          });
        });
      if (upserts.length > 0) await prisma.$transaction(upserts);
    } catch {
      // Non-fatal
    }
  }
  return map;
}

function toDate(val: Date | string): Date {
  return val instanceof Date ? val : new Date(val);
}

export async function getVisitorData(days = 7): Promise<VisitorData> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [visits, cachedGeo] = await Promise.all([
    prisma.pageVisit.findMany({
      where: { visitedAt: { gte: since } },
      orderBy: { visitedAt: "desc" },
      take: 10000,
      select: { id: true, ip: true, path: true, visitedAt: true },
    }),
    prisma.ipGeoCache.findMany(),
  ]);

  const geoMap = new Map(cachedGeo.map((g) => [g.ip, g]));
  const uniqueIps = [...new Set(visits.map((v) => v.ip))].filter((ip) => ip !== "unknown");
  const uncachedIps = uniqueIps.filter((ip) => !geoMap.has(ip));
  if (uncachedIps.length > 0) {
    const resolved = await resolveGeo(uncachedIps);
    for (const [ip, geo] of resolved) geoMap.set(ip, { ip, ...geo, cachedAt: new Date() });
  }

  // Build visitor groups
  const visitorMap = new Map<string, VisitorGroup>();
  let onlineNow = 0;
  for (const v of visits) {
    const geo = geoMap.get(v.ip);
    const vDate = toDate(v.visitedAt as Date | string);
    const visitedAt = vDate.toISOString();
    const existing = visitorMap.get(v.ip);
    if (!existing) {
      visitorMap.set(v.ip, {
        ip: v.ip,
        country: geo?.country ?? null,
        countryCode: geo?.countryCode ?? null,
        city: geo?.city ?? null,
        paths: [v.path],
        visitCount: 1,
        firstSeen: visitedAt,
        lastSeen: visitedAt,
      });
    } else {
      if (!existing.paths.includes(v.path)) existing.paths.push(v.path);
      existing.visitCount++;
      if (visitedAt < existing.firstSeen) existing.firstSeen = visitedAt;
      if (visitedAt > existing.lastSeen) existing.lastSeen = visitedAt;
    }
    if (vDate >= fiveMinutesAgo) onlineNow++;
  }

  // Daily traffic — fill all days including zero-visit days
  const dayMap = new Map<string, number>();
  for (const v of visits) {
    const day = toDate(v.visitedAt as Date | string).toISOString().slice(0, 10);
    dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
  }
  const dailyTraffic: DailyTraffic[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dailyTraffic.push({ date: key, visits: dayMap.get(key) ?? 0 });
  }

  // Page hit counts
  const pageHitMap = new Map<string, number>();
  for (const v of visits) pageHitMap.set(v.path, (pageHitMap.get(v.path) ?? 0) + 1);
  const topPages = [...pageHitMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  // Country breakdown
  const countryMap = new Map<string, { count: number; countryCode: string | null }>();
  for (const vg of visitorMap.values()) {
    if (vg.country) {
      const e = countryMap.get(vg.country);
      if (e) e.count++;
      else countryMap.set(vg.country, { count: 1, countryCode: vg.countryCode });
    }
  }
  const topCountries = [...countryMap.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([country, { count, countryCode }]) => ({ country, countryCode, count }));

  const topCountry = topCountries[0]?.country ?? null;

  const totalPaths = [...visitorMap.values()].reduce((s, v) => s + v.paths.length, 0);
  const avgPagesPerVisitor = visitorMap.size > 0
    ? Math.round((totalPaths / visitorMap.size) * 10) / 10
    : 0;

  const recentVisits: RecentVisit[] = visits.slice(0, 100).map((v) => {
    const geo = geoMap.get(v.ip);
    return {
      id: v.id,
      ip: v.ip,
      country: geo?.country ?? null,
      countryCode: geo?.countryCode ?? null,
      path: v.path,
      visitedAt: toDate(v.visitedAt as Date | string).toISOString(),
    };
  });

  return {
    totalVisits: visits.length,
    uniqueVisitors: visitorMap.size,
    onlineNow,
    avgPagesPerVisitor,
    topCountry,
    topCountries,
    visitors: [...visitorMap.values()].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen)),
    topPages,
    recentVisits,
    dailyTraffic,
    days,
  };
}
