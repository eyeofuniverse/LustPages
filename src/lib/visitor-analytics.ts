import { prisma } from "@/lib/prisma";

export type VisitorGroup = {
  ip: string;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  paths: string[];
  visitCount: number;
  firstSeen: Date;
  lastSeen: Date;
};

export type TopPage = { path: string; count: number };

export type RecentVisit = {
  id: string;
  ip: string;
  country: string | null;
  countryCode: string | null;
  path: string;
  visitedAt: Date;
};

export type VisitorData = {
  totalVisits: number;
  uniqueVisitors: number;
  topCountry: string | null;
  visitors: VisitorGroup[];
  topPages: TopPage[];
  recentVisits: RecentVisit[];
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

  const MAX_RESOLVE = 300;
  const ipsToResolve = uncachedIps.slice(0, MAX_RESOLVE);

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
      // Non-fatal — geo resolution is best-effort
    }
  }
  return map;
}

export async function getVisitorData(): Promise<VisitorData> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [visits, cachedGeo] = await Promise.all([
    prisma.pageVisit.findMany({
      where: { visitedAt: { gte: since } },
      orderBy: { visitedAt: "desc" },
      take: 5000,
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
  for (const v of visits) {
    const geo = geoMap.get(v.ip);
    const existing = visitorMap.get(v.ip);
    if (!existing) {
      visitorMap.set(v.ip, {
        ip: v.ip,
        country: geo?.country ?? null,
        countryCode: geo?.countryCode ?? null,
        city: geo?.city ?? null,
        paths: [v.path],
        visitCount: 1,
        firstSeen: v.visitedAt,
        lastSeen: v.visitedAt,
      });
    } else {
      if (!existing.paths.includes(v.path)) existing.paths.push(v.path);
      existing.visitCount++;
      if (v.visitedAt < existing.firstSeen) existing.firstSeen = v.visitedAt;
      if (v.visitedAt > existing.lastSeen) existing.lastSeen = v.visitedAt;
    }
  }

  // Page hit counts
  const pageHitMap = new Map<string, number>();
  for (const v of visits) pageHitMap.set(v.path, (pageHitMap.get(v.path) ?? 0) + 1);
  const topPages = [...pageHitMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([path, count]) => ({ path, count }));

  // Top country
  const countryCount = new Map<string, number>();
  for (const vg of visitorMap.values()) {
    if (vg.country) countryCount.set(vg.country, (countryCount.get(vg.country) ?? 0) + 1);
  }
  const topCountry = countryCount.size > 0
    ? [...countryCount.entries()].sort((a, b) => b[1] - a[1])[0][0]
    : null;

  // Recent visits enriched with geo
  const recentVisits: RecentVisit[] = visits.slice(0, 100).map((v) => {
    const geo = geoMap.get(v.ip);
    return { id: v.id, ip: v.ip, country: geo?.country ?? null, countryCode: geo?.countryCode ?? null, path: v.path, visitedAt: v.visitedAt };
  });

  return {
    totalVisits: visits.length,
    uniqueVisitors: visitorMap.size,
    topCountry,
    visitors: [...visitorMap.values()].sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime()),
    topPages,
    recentVisits,
  };
}
