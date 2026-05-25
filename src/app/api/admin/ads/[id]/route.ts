import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await auth();
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ad);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const ad = await prisma.ad.update({
    where: { id },
    data: {
      slot: body.slot,
      name: body.name,
      type: body.type ?? "affiliate",
      networkCode: body.networkCode ?? null,
      imageUrl: body.imageUrl ?? null,
      linkUrl: body.linkUrl ?? null,
      altText: body.altText ?? null,
      adTitle: body.adTitle ?? null,
      adDescription: body.adDescription ?? null,
      isActive: body.isActive ?? true,
      priority: Number(body.priority) || 0,
    },
  });
  return NextResponse.json(ad);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.ad.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
