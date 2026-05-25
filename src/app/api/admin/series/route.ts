import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminSeriesList } from "@/lib/queries";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sp = req.nextUrl.searchParams;
  const take = Math.min(50, Math.max(1, parseInt(sp.get("take") ?? "20", 10)));
  const skip = Math.max(0, parseInt(sp.get("skip") ?? "0", 10));
  const search = sp.get("q") ?? "";

  const { series, total } = await getAdminSeriesList({ take, skip, search });
  return NextResponse.json({ series, total });
}
