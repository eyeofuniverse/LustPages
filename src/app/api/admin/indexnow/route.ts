import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { storyUrl, seriesUrl } from "@/lib/indexnow";

const KEY = process.env.INDEXNOW_KEY ?? "8bb1fb4104ef4d268bfca97bcc53076e";
const HOST = "lustpages.com";
const BASE = "https://lustpages.com";
const BATCH = 10000;

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

// POST /api/admin/indexnow — submit all published stories + series to IndexNow
export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [stories, series] = await Promise.all([
    prisma.story.findMany({
      where: { published: true },
      select: { slug: true },
    }),
    prisma.series.findMany({
      where: { stories: { some: { published: true } } },
      select: { slug: true },
    }),
  ]);

  const urls = [
    ...stories.map((s) => storyUrl(s.slug)),
    ...series.map((s) => seriesUrl(s.slug)),
  ];

  const body = {
    host: HOST,
    key: KEY,
    keyLocation: `${BASE}/${KEY}.txt`,
    urlList: [] as string[],
  };

  let submitted = 0;
  for (let i = 0; i < urls.length; i += BATCH) {
    body.urlList = urls.slice(i, i + BATCH);
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    if (res.ok || res.status === 202) submitted += body.urlList.length;
  }

  return NextResponse.json({
    ok: true,
    stories: stories.length,
    series: series.length,
    submitted,
  });
}
