import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { keyword, targetTagId } = await req.json();
  if (!keyword?.trim()) return NextResponse.json({ error: "keyword required" }, { status: 400 });
  if (!targetTagId) return NextResponse.json({ error: "targetTagId required" }, { status: 400 });

  try {
    const target = await prisma.tag.findUnique({ where: { id: targetTagId }, select: { id: true, name: true } });
    if (!target) return NextResponse.json({ error: "Target tag not found" }, { status: 404 });

    const sources = await prisma.tag.findMany({
      where: {
        isApproved: true,
        id: { not: targetTagId },
        name: { contains: keyword.trim(), mode: "insensitive" },
      },
      include: { stories: { select: { id: true } }, aliases: { select: { alias: true } } },
    });

    if (sources.length === 0) {
      return NextResponse.json({ merged: 0, tagNames: [], targetName: target.name });
    }

    const mergedNames: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const source of sources) {
        // Re-connect all stories to target
        if (source.stories.length > 0) {
          await tx.tag.update({
            where: { id: targetTagId },
            data: { stories: { connect: source.stories.map((s) => ({ id: s.id })) } },
          });
        }

        // Transfer existing aliases to target
        for (const { alias } of source.aliases) {
          await tx.tagAlias.upsert({
            where: { alias },
            update: { tagId: targetTagId },
            create: { alias, tagId: targetTagId },
          });
        }

        // Add source slug as alias so old searches/URLs still resolve
        await tx.tagAlias.upsert({
          where: { alias: source.slug },
          update: { tagId: targetTagId },
          create: { alias: source.slug, tagId: targetTagId },
        });

        // Repoint TagRequests that referenced source
        await tx.tagRequest.updateMany({
          where: { mergedIntoTagId: source.id },
          data: { mergedIntoTagId: targetTagId },
        });

        await tx.tag.delete({ where: { id: source.id } });
        mergedNames.push(source.name);
      }
    });

    return NextResponse.json({ merged: mergedNames.length, tagNames: mergedNames, targetName: target.name });
  } catch (e: unknown) {
    console.error("POST /api/admin/tags/bulk-merge", e);
    return NextResponse.json({ error: "Bulk merge failed" }, { status: 500 });
  }
}
