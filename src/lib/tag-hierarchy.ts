import { prisma } from "./prisma";

// Returns the given tag's slug plus all its approved children's slugs.
// Used to expand story queries so browsing a parent tag includes children's stories.
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

// Checks all active keyword rules against a tag name and creates parent
// relationships for every matching rule. Safe to call multiple times (upsert).
export async function applyKeywordRulesToTag(tagId: string, tagName: string) {
  const rules = await prisma.tagKeywordRule.findMany({
    select: { parentTagId: true, keyword: true },
  });
  const lower = tagName.toLowerCase();
  for (const rule of rules) {
    if (rule.parentTagId === tagId) continue; // no self-reference
    if (!lower.includes(rule.keyword.toLowerCase())) continue;
    await prisma.tagRelationship.upsert({
      where: { parentId_childId: { parentId: rule.parentTagId, childId: tagId } },
      update: {},
      create: { parentId: rule.parentTagId, childId: tagId },
    });
  }
}
