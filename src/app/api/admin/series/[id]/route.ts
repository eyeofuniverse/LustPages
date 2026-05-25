import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const series = await prisma.series.findUnique({ where: { id }, select: { id: true } });
  if (!series) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { isPremium, coinPrice, freeChapters, description } = body;

  const data: Record<string, unknown> = {};
  if (description !== undefined) data.description = description || null;
  if (typeof isPremium === "boolean") {
    data.isPremium = isPremium;
    if (!isPremium) data.coinPrice = null;
  }
  if (isPremium && coinPrice !== undefined) {
    const price = parseInt(coinPrice, 10);
    if (!isNaN(price) && price >= 1) data.coinPrice = price;
  }
  if (freeChapters !== undefined) {
    data.freeChapters = Math.max(1, parseInt(freeChapters, 10) || 1);
  }

  const updated = await prisma.series.update({ where: { id }, data });
  return NextResponse.json(updated);
}
