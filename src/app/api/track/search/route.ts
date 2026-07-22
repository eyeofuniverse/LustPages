import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
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
