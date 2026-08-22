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
    let bodyReferrer: string | null = null;
    try {
      const body = await req.json();
      if (typeof body.path === "string") path = body.path.slice(0, 512);
      // PageTracker sends document.referrer for the first page load only.
      // Subsequent soft navigations send null so we don't overwrite attribution.
      if (typeof body.referrer === "string" && body.referrer) {
        bodyReferrer = body.referrer.slice(0, 512);
      }
    } catch {
      return NextResponse.json({ ok: true });
    }

    if (path.startsWith("/meminhaj") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_PATTERN.test(ua)) return NextResponse.json({ ok: true });

    // Use the referrer from the request body (PageTracker sends document.referrer,
    // which is the real external landing referrer). The HTTP Referer header is
    // always the previous same-site page for Next.js client-side navigation, so
    // it would misclassify everything as "Internal".
    const referrer = cleanReferrer(bodyReferrer);
    const deviceType = parseDeviceType(ua);

    await prisma.pageVisit.create({
      data: { ip, path, userAgent: ua.slice(0, 512), referrer, deviceType },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
