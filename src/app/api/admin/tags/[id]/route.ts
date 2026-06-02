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

  // Merge a tag into another — source becomes an alias, all stories re-assigned, source deleted
  if (action === "mergeInto" && targetTagId) {
    if (id === targetTagId) return NextResponse.json({ error: "Cannot merge a tag into itself" }, { status: 400 });
    const result = await prisma.$transaction(async (tx) => {
      const [source, target] = await Promise.all([
        tx.tag.findUnique({
          where: { id },
          include: { stories: { select: { id: true } }, aliases: { select: { alias: true } } },
        }),
        tx.tag.findUnique({ where: { id: targetTagId as string }, select: { id: true, name: true } }),
      ]);
      if (!source) throw new Error("Tag not found");
      if (!target) throw new Error("Target tag not found");

      // Re-connect all stories to target
      if (source.stories.length > 0) {
        await tx.tag.update({
          where: { id: targetTagId as string },
          data: { stories: { connect: source.stories.map((s) => ({ id: s.id })) } },
        });
      }

      // Transfer existing aliases to target
      for (const { alias } of source.aliases) {
        await tx.tagAlias.upsert({
          where: { alias },
          update: { tagId: targetTagId as string },
          create: { alias, tagId: targetTagId as string },
        });
      }

      // Add source slug as alias on target so searches/URLs still resolve
      await tx.tagAlias.upsert({
        where: { alias: source.slug },
        update: { tagId: targetTagId as string },
        create: { alias: source.slug, tagId: targetTagId as string },
      });

      // Repoint any TagRequests that referenced source
      await tx.tagRequest.updateMany({
        where: { mergedIntoTagId: id },
        data: { mergedIntoTagId: targetTagId as string },
      });

      await tx.tag.delete({ where: { id } });
      return { mergedCount: source.stories.length, targetName: target.name };
    });
    return NextResponse.json(result);
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
