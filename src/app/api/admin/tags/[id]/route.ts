import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTag } from "@/lib/tag-library";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name, tier, description, isApproved, addAlias, removeAliasId } = await req.json();

  const updates: Record<string, unknown> = {};
  if (name !== undefined) { updates.name = name.trim(); updates.slug = slugifyTag(name); }
  if (tier !== undefined) updates.tier = Number(tier);
  if (description !== undefined) updates.description = description;
  if (isApproved !== undefined) updates.isApproved = isApproved;

  const tag = await prisma.tag.update({
    where: { id },
    data: {
      ...updates,
      ...(addAlias && {
        aliases: { create: { alias: slugifyTag(addAlias) } },
      }),
      ...(removeAliasId && {
        aliases: { delete: { id: removeAliasId } },
      }),
    },
    include: { aliases: { select: { id: true, alias: true } } },
  });

  return NextResponse.json(tag);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.tag.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
