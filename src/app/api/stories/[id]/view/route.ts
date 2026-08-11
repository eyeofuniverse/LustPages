import { NextRequest, NextResponse } from "next/server";
import { incrementViews } from "@/lib/queries";

// Common bots and crawlers — view increments are skipped for these
const BOT_UA =
  /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|rogerbot|linkedinbot|embedly|showyoubot|outbrain|pinterest|slackbot|vkShare|W3C_Validator|whatsapp|discordbot|telegrambot|googlebot|bingbot|yandexbot|duckduckbot|baiduspider|sogou|exabot|ia_archiver/i;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT_UA.test(ua)) return NextResponse.json({ ok: false });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  // Deduplicate: one count per story per browser per 24 hours
  const cookieName = `sv_${id}`;
  if (req.cookies.get(cookieName)) return NextResponse.json({ ok: false });

  try {
    await incrementViews(id);
  } catch {
    // Story may not exist or DB error — fail silently, don't break the page
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    sameSite: "strict",
    path: "/",
  });
  return res;
}
