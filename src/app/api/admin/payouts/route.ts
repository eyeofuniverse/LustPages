import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string; isSuperAdmin?: boolean; adminPermissions?: string[] } | undefined;
  if (!user || user.role !== "admin") return null;
  if (!user.isSuperAdmin && !user.adminPermissions?.includes("payouts")) return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "pending";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = 25;
  const skip = (page - 1) * limit;

  const where = status !== "all" ? { status } : {};

  const [requests, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        author: {
          select: { id: true, name: true, slug: true, user: { select: { email: true } } },
        },
      },
    }),
    prisma.payoutRequest.count({ where }),
  ]);

  return NextResponse.json({ requests, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await req.json();
  if (!id || !["paid", "rejected"].includes(status)) {
    return NextResponse.json({ error: "id and status (paid|rejected) are required" }, { status: 400 });
  }

  const updated = await prisma.payoutRequest.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(updated);
}
