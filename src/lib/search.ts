// Maps the normalized (lowercase, no hyphens/spaces) form of a term to every
// surface variant that might appear in story content or titles. This lets a
// search for "gangbang" also match "gang bang" and "gang-bang", and vice versa.
const COMPOUND_VARIANTS: Record<string, string[]> = {
  gangbang:      ["gangbang", "gang bang", "gang-bang"],
  blowjob:       ["blowjob", "blow job", "blow-job"],
  handjob:       ["handjob", "hand job", "hand-job"],
  footjob:       ["footjob", "foot job", "foot-job"],
  rimjob:        ["rimjob", "rim job", "rim-job"],
  creampie:      ["creampie", "cream pie", "cream-pie"],
  cumshot:       ["cumshot", "cum shot", "cum-shot"],
  threesome:     ["threesome", "3some", "three-some"],
  foursome:      ["foursome", "four-some"],
  roleplay:      ["roleplay", "role play", "role-play"],
  roleplaying:   ["roleplaying", "role playing", "role-playing"],
  bisexual:      ["bisexual", "bi-sexual", "bi sexual"],
  stepsister:    ["stepsister", "step sister", "step-sister", "stepsis", "step sis"],
  stepbrother:   ["stepbrother", "step brother", "step-brother", "stepbro", "step bro"],
  stepmom:       ["stepmom", "step mom", "step-mom", "stepmother", "step mother", "step-mother"],
  stepdad:       ["stepdad", "step dad", "step-dad", "stepfather", "step father", "step-father"],
  stepmommy:     ["stepmommy", "step mommy", "step-mommy"],
  stepson:       ["stepson", "step son", "step-son"],
  stepdaughter:  ["stepdaughter", "step daughter", "step-daughter"],
  stepfamily:    ["stepfamily", "step family", "step-family"],
  interracial:   ["interracial", "inter-racial", "inter racial"],
  exhibitionist: ["exhibitionist", "exhibitionism"],
  groupsex:      ["group sex", "group-sex"],
};

// Returns all surface variants for a search token. If no compound variants are
// known, returns the original token in a one-element array.
export function getTermVariants(token: string): string[] {
  const compact = token.toLowerCase().replace(/[-\s]+/g, "");
  return COMPOUND_VARIANTS[compact] ?? [token];
}

// Builds a Prisma WHERE clause for multi-word story searches.
// Each token must match at least one field (OR), and all tokens must match (AND).
// Compound terms are expanded to all known surface variants.
export function buildStorySearchWhere(query: string) {
  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const tokens = words.length > 0 ? words : [query.trim()];

  const matchToken = (word: string) => {
    const variants = getTermVariants(word);
    return {
      OR: variants.flatMap((v) => [
        { title:   { contains: v, mode: "insensitive" as const } },
        { excerpt: { contains: v, mode: "insensitive" as const } },
        { content: { contains: v, mode: "insensitive" as const } },
        { tags:    { contains: v.toLowerCase() } },
      ]),
    };
  };

  if (tokens.length === 1) return matchToken(tokens[0]);
  return { AND: tokens.map(matchToken) };
}

// Builds a Prisma WHERE clause for series searches (name + description only).
export function buildSeriesSearchWhere(query: string) {
  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const tokens = words.length > 0 ? words : [query.trim()];

  const matchToken = (word: string) => {
    const variants = getTermVariants(word);
    return {
      OR: variants.flatMap((v) => [
        { name:        { contains: v, mode: "insensitive" as const } },
        { description: { contains: v, mode: "insensitive" as const } },
      ]),
    };
  };

  if (tokens.length === 1) return matchToken(tokens[0]);
  return { AND: tokens.map(matchToken) };
}
