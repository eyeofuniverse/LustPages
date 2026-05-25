import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminComments } from "@/lib/queries";

export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const take = parseInt(searchParams.get("take") ?? "100", 10);
  const skip = parseInt(searchParams.get("skip") ?? "0", 10);

  const data = await getAdminComments({ take, skip });
  return NextResponse.json(data);
}
