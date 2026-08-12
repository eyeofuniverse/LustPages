import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getVisitorData } from "@/lib/visitor-analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const rawDays = parseInt(req.nextUrl.searchParams.get("days") ?? "7", 10);
  const days = isNaN(rawDays) ? 7 : Math.min(90, Math.max(1, rawDays));
  const data = await getVisitorData(days);
  return NextResponse.json(data);
}
