import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const base = process.env.NEXTAUTH_URL ?? "";
  const redirect = (status: string) =>
    NextResponse.redirect(`${base}/meminhaj/stories?tumblr=${status}`);

  if (error) return redirect("denied");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("tumblr_oauth_state")?.value;

  if (!code || !state || state !== storedState) return redirect("error");

  try {
    const tokenRes = await fetch("https://api.tumblr.com/v2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.TUMBLR_CONSUMER_KEY!,
        client_secret: process.env.TUMBLR_CONSUMER_SECRET!,
        redirect_uri: `${base}/api/admin/social/tumblr/callback`,
      }),
    });

    if (!tokenRes.ok) return redirect("error");

    const tokens = await tokenRes.json();

    await prisma.socialToken.upsert({
      where: { platform: "tumblr" },
      create: {
        platform: "tumblr",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : null,
      },
    });

    cookieStore.delete("tumblr_oauth_state");
    return redirect("connected");
  } catch {
    return redirect("error");
  }
}
