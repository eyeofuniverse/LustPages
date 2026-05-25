import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await auth();
  return (session?.user as { role?: string } | undefined)?.role === "admin";
}

export async function GET() {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ads = await prisma.ad.findMany({
    orderBy: [{ slot: "asc" }, { priority: "desc" }],
  });
  return NextResponse.json(ads);
}

export async function POST(req: Request) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const ad = await prisma.ad.create({
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
  return NextResponse.json(ad, { status: 201 });
}
