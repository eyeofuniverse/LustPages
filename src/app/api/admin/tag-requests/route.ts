import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const requests = await prisma.tagRequest.findMany({
    where: status && status !== "all" ? { status } : undefined,
    include: {
      requestedBy: { select: { id: true, name: true } },
      mergedIntoTag: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}
