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
  const { name, tier, description, isApproved, addAlias, removeAliasId, action, targetTagId } = await req.json();

  // Merge a pending tag into an approved tag — migrates all story connections then deletes it
  if (action === "mergeInto" && targetTagId) {
    const merged = await prisma.$transaction(async (tx) => {
      const pending = await tx.tag.findUnique({
        where: { id },
        include: { stories: { select: { id: true } } },
      });
      if (!pending) throw new Error("Tag not found");
      if (pending.stories.length > 0) {
        await tx.tag.update({
          where: { id: targetTagId as string },
          data: { stories: { connect: pending.stories.map((s) => ({ id: s.id })) } },
        });
      }
      await tx.tag.delete({ where: { id } });
      return { mergedCount: pending.stories.length };
    });
    return NextResponse.json(merged);
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) { updates.name = name.trim(); updates.slug = slugifyTag(name); }
  if (tier !== undefined) {
    const t = Number(tier);
    if (![1, 2, 3].includes(t)) return NextResponse.json({ error: "tier must be 1, 2, or 3" }, { status: 400 });
    updates.tier = t;
  }
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
