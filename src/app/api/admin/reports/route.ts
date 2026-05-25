import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminReports } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const data = await getAdminReports({ status });
  return NextResponse.json(data);
}
