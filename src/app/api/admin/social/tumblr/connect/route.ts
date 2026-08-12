import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("tumblr_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    client_id: process.env.TUMBLR_CONSUMER_KEY!,
    response_type: "code",
    scope: "write offline_access",
    redirect_uri: `${process.env.NEXTAUTH_URL}/api/admin/social/tumblr/callback`,
    state,
  });

  return NextResponse.redirect(
    `https://www.tumblr.com/oauth2/authorize?${params.toString()}`
  );
}
