import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "admin" ? session : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  if (body.price !== undefined && Number(body.price) <= 0) {
    return NextResponse.json({ error: "price must be greater than 0" }, { status: 400 });
  }
  if (body.coins !== undefined && Number(body.coins) <= 0) {
    return NextResponse.json({ error: "coins must be greater than 0" }, { status: 400 });
  }
  const pkg = await prisma.coinPackage.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.coins !== undefined && { coins: Number(body.coins) }),
      ...(body.bonusCoins !== undefined && { bonusCoins: Number(body.bonusCoins) }),
      ...(body.price !== undefined && { price: Number(body.price) }),
      ...(body.subscriberDiscount !== undefined && { subscriberDiscount: Number(body.subscriberDiscount) }),
      ...(body.isActive !== undefined && { isActive: Boolean(body.isActive) }),
      ...(body.order !== undefined && { order: Number(body.order) }),
    },
  });
  return NextResponse.json(pkg);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.coinPackage.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
