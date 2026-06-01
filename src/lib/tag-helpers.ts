import { prisma } from "./prisma";
import { slugifyTag } from "./tag-library";

export interface NewTagInput { name: string; tier: number; }

export async function resolveNewTags(newTagNames: NewTagInput[]): Promise<string[]> {
  const ids: string[] = [];
  for (const { name, tier } of newTagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugifyTag(trimmed);
    if (!slug) continue;

    const existing = await prisma.tag.findFirst({
      where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
    });

    if (existing) {
      ids.push(existing.id);
      continue;
    }

    try {
      const created = await prisma.tag.create({
        data: { name: trimmed, slug, tier, isApproved: false },
      });
      ids.push(created.id);
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
      // Concurrent request created the same slug between our findFirst and create.
      // Re-fetch to get the winner's record.
      const winner = await prisma.tag.findFirst({
        where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
      });
      if (winner) ids.push(winner.id);
    }
  }
  return ids;
}
