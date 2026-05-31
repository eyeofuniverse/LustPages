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
    } else {
      const created = await prisma.tag.create({
        data: { name: trimmed, slug, tier, isApproved: false },
      });
      ids.push(created.id);
    }
  }
  return ids;
}
