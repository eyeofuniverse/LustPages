import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BOT_PATTERN = /bot|crawl|spider|slurp|archiv|wget|curl|python|httpclient/i;

export async function POST(req: NextRequest) {
  try {
    let path = "/";
    try {
      const body = await req.json();
      if (typeof body.path === "string") path = body.path.slice(0, 512);
    } catch {
      return NextResponse.json({ ok: true });
    }

    if (path.startsWith("/meminhaj") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : (req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? "unknown");

    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true });

    await prisma.pageVisit.create({
      data: { ip, path, userAgent: ua.slice(0, 512) },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
