import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

const BOT_PATTERN = /bot|crawl|spider|slurp|archiv|wget|curl|python|httpclient/i;

function parseDeviceType(ua: string): "mobile" | "tablet" | "desktop" {
  if (/tablet|ipad|playbook|silk|(android(?!.*mobi))/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|windows\s*phone|blackberry|android/i.test(ua)) return "mobile";
  return "desktop";
}

function cleanReferrer(ref: string | null): string | null {
  if (!ref) return null;
  try {
    const url = new URL(ref);
    return url.origin; // strip path/query/fragments — keep only protocol+host
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 120 page views per IP per minute — well above any real browser cadence
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : (req.headers.get("x-real-ip") ?? req.headers.get("cf-connecting-ip") ?? "unknown");
  const { allowed } = rateLimit(`track:${ip}`, 120, 60 * 1000);
  if (!allowed) return NextResponse.json({ ok: true });

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

    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true });

    const referrer = cleanReferrer(req.headers.get("referer") ?? req.headers.get("referrer") ?? null);
    const deviceType = parseDeviceType(ua);

    await prisma.pageVisit.create({
      data: { ip, path, userAgent: ua.slice(0, 512), referrer, deviceType },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
