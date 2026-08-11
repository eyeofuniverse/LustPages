import { prisma } from "./prisma";
import { slugifyTag } from "./tags";

export * from "./tags";

// ─── Hierarchy ────────────────────────────────────────────────────────────────

/** Returns the given tag's slug plus all its approved children's slugs (one level deep). */
export async function getTagAndChildrenSlugs(tagSlug: string): Promise<string[]> {
  const tag = await prisma.tag.findUnique({
    where: { slug: tagSlug },
    select: {
      slug: true,
      childRelations: {
        select: { child: { select: { slug: true, isApproved: true } } },
      },
    },
  });
  if (!tag) return [tagSlug];
  const childSlugs = tag.childRelations
    .filter((r) => r.child.isApproved)
    .map((r) => r.child.slug);
  return [tag.slug, ...childSlugs];
}

/** Checks all active keyword rules against a tag name and upserts parent relationships for every match. */
export async function applyKeywordRulesToTag(tagId: string, tagName: string) {
  const rules = await prisma.tagKeywordRule.findMany({
    select: { parentTagId: true, keyword: true },
  });
  const lower = tagName.toLowerCase();
  for (const rule of rules) {
    if (rule.parentTagId === tagId) continue;
    if (!lower.includes(rule.keyword.toLowerCase())) continue;
    await prisma.tagRelationship.upsert({
      where: { parentId_childId: { parentId: rule.parentTagId, childId: tagId } },
      update: {},
      create: { parentId: rule.parentTagId, childId: tagId },
    });
  }
}

// ─── Tag resolution ───────────────────────────────────────────────────────────

/**
 * Resolves an array of new tag inputs into existing or freshly-created tag IDs.
 * Handles alias lookups, keyword-rule auto-approval, and concurrent-create races.
 */
export async function resolveNewTags(newTagNames: { name: string; tier: number }[]): Promise<string[]> {
  if (newTagNames.length === 0) return [];

  const rules = await prisma.tagKeywordRule.findMany({ select: { keyword: true } });
  const matchesAnyRule = (name: string) => {
    const lower = name.toLowerCase();
    return rules.some((r) => lower.includes(r.keyword.toLowerCase()));
  };

  const ids: string[] = [];

  for (const { name, tier } of newTagNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const slug = slugifyTag(trimmed);
    if (slug.length < 2) continue;

    const existing = await prisma.tag.findFirst({
      where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
    });

    if (existing) {
      ids.push(existing.id);
      continue;
    }

    const autoApprove = matchesAnyRule(trimmed);

    try {
      const created = await prisma.tag.create({
        data: { name: trimmed, slug, tier, isApproved: autoApprove },
      });
      if (autoApprove) await applyKeywordRulesToTag(created.id, created.name);
      ids.push(created.id);
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
      const winner = await prisma.tag.findFirst({
        where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
      });
      if (winner) ids.push(winner.id);
    }
  }
  return ids;
}
