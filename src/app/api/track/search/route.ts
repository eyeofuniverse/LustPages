import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // 30 search events per IP per minute
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "unknown");
  const { allowed } = rateLimit(`track-search:${ip}`, 30, 60 * 1000);
  if (!allowed) return NextResponse.json({ ok: false });

  try {
    const { query, results } = await req.json();
    const q = (query ?? "").trim().toLowerCase().slice(0, 200);
    if (q.length < 2) return NextResponse.json({ ok: false });
    await prisma.searchQuery.create({
      data: { query: q, results: Math.max(0, Number(results) || 0) },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
