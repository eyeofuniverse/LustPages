import { prisma } from "@/lib/prisma";

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
    const visitedAt = v.visitedAt.toISOString();
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
      if (v.visitedAt.toISOString() < existing.firstSeen) existing.firstSeen = visitedAt;
      if (v.visitedAt.toISOString() > existing.lastSeen) existing.lastSeen = visitedAt;
    }
    if (v.visitedAt >= fiveMinutesAgo) onlineNow++;
  }

  // Daily traffic — fill all days including zero-visit days
  const dayMap = new Map<string, number>();
  for (const v of visits) {
    const day = v.visitedAt.toISOString().slice(0, 10);
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
      visitedAt: v.visitedAt.toISOString(),
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
