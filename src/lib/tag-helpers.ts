import { prisma } from "./prisma";
import { slugifyTag } from "./tag-library";
import { applyKeywordRulesToTag } from "./tag-hierarchy";

export interface NewTagInput { name: string; tier: number; }

// Load all keyword rules once per resolveNewTags call to avoid N+1 queries.
async function getKeywordRules() {
  return prisma.tagKeywordRule.findMany({ select: { keyword: true } });
}

function matchesAnyRule(name: string, rules: { keyword: string }[]) {
  const lower = name.toLowerCase();
  return rules.some((r) => lower.includes(r.keyword.toLowerCase()));
}

export async function resolveNewTags(newTagNames: NewTagInput[]): Promise<string[]> {
  if (newTagNames.length === 0) return [];
  const rules = await getKeywordRules();
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

    const autoApprove = matchesAnyRule(trimmed, rules);

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
