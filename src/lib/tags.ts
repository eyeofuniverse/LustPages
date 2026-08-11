import { prisma } from "./prisma";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TagEntry {
  name: string;
  slug: string;
  tier: number;
  description?: string;
}

export interface NewTagInput { name: string; tier: number; }

// ─── Static data ──────────────────────────────────────────────────────────────

export const INITIAL_TAGS: TagEntry[] = [
  // Tier 1 — Subgenre / Universe (mandatory, pick 1–2)
  { name: "Dark Romance", slug: "dark-romance", tier: 1, description: "Morally grey heroes, dark themes, intense love stories" },
  { name: "Contemporary Romance", slug: "contemporary-romance", tier: 1, description: "Modern-day settings and relationships" },
  { name: "Paranormal Romance", slug: "paranormal-romance", tier: 1, description: "Supernatural elements: vampires, wolves, witches" },
  { name: "Sci-Fi & Monster", slug: "sci-fi-monster", tier: 1, description: "Aliens, monsters, futuristic worlds" },
  { name: "Historical Romance", slug: "historical-romance", tier: 1, description: "Set in the past — Regency, Victorian, Medieval" },
  { name: "Romantic Suspense", slug: "romantic-suspense", tier: 1, description: "Thrillers, danger, and romance intertwined" },
  { name: "Fantasy Romance", slug: "fantasy-romance", tier: 1, description: "Magic, dragons, mythical worlds" },
  { name: "Erotic Romance", slug: "erotic-romance", tier: 1, description: "Explicit, heat-first romance stories" },
  { name: "Taboo Romance", slug: "taboo-romance", tier: 1, description: "Forbidden, controversial pairings" },
  { name: "LGBTQ+ Romance", slug: "lgbtq-romance", tier: 1, description: "Queer love stories across all identities" },
  { name: "Reverse Harem", slug: "reverse-harem", tier: 1, description: "One woman, multiple love interests" },
  { name: "Steamy Romance", slug: "steamy-romance", tier: 1, description: "High heat, sensual contemporary romance" },

  // Tier 2 — Tropes / Hook (mandatory, pick 2–4)
  { name: "Enemies to Lovers", slug: "enemies-to-lovers", tier: 2, description: "Rivals who fall for each other" },
  { name: "Age Gap", slug: "age-gap", tier: 2, description: "Significant age difference between partners" },
  { name: "Billionaire", slug: "billionaire", tier: 2, description: "Wealthy, powerful hero" },
  { name: "Alpha Hero", slug: "alpha-hero", tier: 2, description: "Dominant, protective, possessive hero" },
  { name: "Boss and Employee", slug: "boss-employee", tier: 2, description: "Workplace power dynamic" },
  { name: "Second Chance", slug: "second-chance", tier: 2, description: "Former lovers reunited" },
  { name: "Friends to Lovers", slug: "friends-to-lovers", tier: 2, description: "Best friends falling in love" },
  { name: "Forced Proximity", slug: "forced-proximity", tier: 2, description: "Stuck together by circumstance" },
  { name: "Arranged Marriage", slug: "arranged-marriage", tier: 2, description: "Married first, feelings second" },
  { name: "Fake Dating", slug: "fake-dating", tier: 2, description: "Pretending to date, feelings become real" },
  { name: "Mafia Romance", slug: "mafia-romance", tier: 2, description: "Organized crime and dangerous love" },
  { name: "MC Romance", slug: "mc-romance", tier: 2, description: "Motorcycle club lifestyle and romance" },
  { name: "Insta Love", slug: "insta-love", tier: 2, description: "Immediate, overwhelming attraction" },
  { name: "Love Triangle", slug: "love-triangle", tier: 2, description: "Torn between two love interests" },
  { name: "Slow Burn", slug: "slow-burn", tier: 2, description: "Long, tension-filled build to romance" },
  { name: "Best Friend's Brother", slug: "best-friends-brother", tier: 2, description: "Forbidden attraction in friend group" },
  { name: "Office Romance", slug: "office-romance", tier: 2, description: "Love blooming at work" },
  { name: "Military Romance", slug: "military-romance", tier: 2, description: "Heroes in uniform" },
  { name: "Small Town Romance", slug: "small-town-romance", tier: 2, description: "Love in a tight-knit community" },
  { name: "Stalker Romance", slug: "stalker-romance", tier: 2, description: "Dark obsession and possessive love" },
  { name: "Obsessed Hero", slug: "obsessed-hero", tier: 2, description: "Hero consumed by the heroine" },
  { name: "Possessive Hero", slug: "possessive-hero", tier: 2, description: "Mine-and-only-mine dynamic" },
  { name: "Protector Hero", slug: "protector-hero", tier: 2, description: "Bodyguard, guardian, or shield dynamic" },
  { name: "Hurt and Comfort", slug: "hurt-comfort", tier: 2, description: "Healing through love and care" },
  { name: "Grumpy Sunshine", slug: "grumpy-sunshine", tier: 2, description: "Brooding hero meets bright heroine" },
  { name: "Fated Mates", slug: "fated-mates", tier: 2, description: "Destined to be together" },
  { name: "Stepbrother", slug: "stepbrother", tier: 2, description: "Forbidden family-adjacent romance" },
  { name: "Professor and Student", slug: "professor-student", tier: 2, description: "Forbidden academic power dynamic" },
  { name: "Bodyguard", slug: "bodyguard", tier: 2, description: "Protection leading to passion" },
  { name: "Single Parent", slug: "single-parent", tier: 2, description: "Love finds a way for a parent" },
  { name: "Royal Romance", slug: "royal-romance", tier: 2, description: "Princes, kings, and noble love" },

  // Tier 3 — Content / Kinks (optional, max 5)
  { name: "BDSM", slug: "bdsm", tier: 3, description: "Bondage, discipline, dominance, submission" },
  { name: "Exhibitionism", slug: "exhibitionism", tier: 3, description: "Public exposure and watching" },
  { name: "M/F", slug: "mf", tier: 3, description: "Male / Female pairing" },
  { name: "M/M", slug: "mm", tier: 3, description: "Male / Male pairing" },
  { name: "F/F", slug: "ff", tier: 3, description: "Female / Female pairing" },
  { name: "M/F/M", slug: "mfm", tier: 3, description: "Two men, one woman" },
  { name: "F/F/M", slug: "ffm", tier: 3, description: "Two women, one man" },
  { name: "High Spice", slug: "high-spice", tier: 3, description: "Very explicit content" },
  { name: "Medium Spice", slug: "medium-spice", tier: 3, description: "Moderately explicit content" },
  { name: "Light Spice", slug: "light-spice", tier: 3, description: "Steamy but not graphic" },
  { name: "Dom/Sub", slug: "dom-sub", tier: 3, description: "Dominant and submissive dynamic" },
  { name: "Daddy Dom", slug: "daddy-dom", tier: 3, description: "Daddy Dom / little dynamic" },
  { name: "Breeding Kink", slug: "breeding-kink", tier: 3, description: "Impregnation and ownership themes" },
  { name: "Bondage", slug: "bondage", tier: 3, description: "Restraint play" },
  { name: "Voyeurism", slug: "voyeurism", tier: 3, description: "Watching others" },
  { name: "Public Play", slug: "public-play", tier: 3, description: "Sexual acts in public settings" },
  { name: "Ménage", slug: "menage", tier: 3, description: "Three or more partners together" },
  { name: "Dirty Talk", slug: "dirty-talk", tier: 3, description: "Explicit verbal play" },
  { name: "Rough", slug: "rough", tier: 3, description: "Intensity and physicality in intimacy" },
  { name: "Dubcon", slug: "dubcon", tier: 3, description: "Dubious consent themes — reader discretion" },
  { name: "Non-con", slug: "non-con", tier: 3, description: "Non-consent themes — reader discretion" },
];

export const TIER_LABELS: Record<number, { title: string; subtitle: string; min: number; max: number }> = {
  1: { title: "Subgenre / Universe", subtitle: "The macro-world of your story", min: 1, max: 2 },
  2: { title: "Tropes / Hook", subtitle: "The plot dynamic readers search for", min: 2, max: 4 },
  3: { title: "Content & Kinks", subtitle: "Explicit details and content warnings", min: 0, max: 5 },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export function slugifyTag(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function displayTag(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

async function getKeywordRules() {
  return prisma.tagKeywordRule.findMany({ select: { keyword: true } });
}

function matchesAnyRule(name: string, rules: { keyword: string }[]) {
  const lower = name.toLowerCase();
  return rules.some((r) => lower.includes(r.keyword.toLowerCase()));
}

/**
 * Resolves an array of new tag inputs into existing or freshly-created tag IDs.
 * Handles alias lookups, keyword-rule auto-approval, and concurrent-create races.
 */
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
      // Concurrent create — another request won the race; resolve it
      const winner = await prisma.tag.findFirst({
        where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
      });
      if (winner) ids.push(winner.id);
    }
  }
  return ids;
}
