import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const APP_ID = "86a12f35-8c44-44c7-b1c1-e8e88c8a84d3";
  const key = process.env.ONESIGNAL_REST_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "ONESIGNAL_REST_API_KEY is not set" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${key}`,
      },
      body: JSON.stringify({
        app_id: APP_ID,
        target_channel: "push",
        included_segments: ["All"],
        headings: { en: "Test notification" },
        contents: { en: "This is a server-side test push from LustPages" },
        url: "https://lustpages.com",
      }),
    });

    const body = await res.json();
    return NextResponse.json({ status: res.status, ok: res.ok, body });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
