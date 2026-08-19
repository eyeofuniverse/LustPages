import { prisma } from "./prisma";

// ─── IN-MEMORY CACHE ──────────────────────────────────────────────────────────
// Synonyms are loaded from the DB once and cached for 5 minutes. This avoids a
// DB hit on every search while still picking up admin changes promptly.

type SynonymMaps = {
  token:  Map<string, string[]>; // compact term → related phrases (single-token expansion)
  phrase: Map<string, string[]>; // compact query → related phrases (full-query expansion)
};

let _cache: { maps: SynonymMaps; expiresAt: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function clearSynonymCache() {
  _cache = null;
}

async function getSynonymMaps(): Promise<SynonymMaps> {
  if (_cache && _cache.expiresAt > Date.now()) return _cache.maps;

  const rows = await prisma.searchSynonym.findMany({ where: { isActive: true } });

  const token  = new Map<string, string[]>();
  const phrase = new Map<string, string[]>();

  for (const row of rows) {
    if (row.type === "TOKEN") token.set(row.term, row.synonyms);
    else                       phrase.set(row.term, row.synonyms);
  }

  _cache = { maps: { token, phrase }, expiresAt: Date.now() + CACHE_TTL };
  return _cache.maps;
}

// ─── HARDCODED COMPOUND VARIANTS ─────────────────────────────────────────────
// These handle the same word written differently (spacing/hyphens). They live
// in code rather than the DB because they're orthographic, not semantic.
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

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function compact(s: string) {
  return s.trim().toLowerCase().replace(/[-\s]+/g, "");
}

function getCompoundVariants(token: string): string[] {
  return COMPOUND_VARIANTS[compact(token)] ?? [token];
}

function matchPhrase(phrase: string) {
  return {
    OR: [
      { title:   { contains: phrase, mode: "insensitive" as const } },
      { excerpt: { contains: phrase, mode: "insensitive" as const } },
      { content: { contains: phrase, mode: "insensitive" as const } },
      { tags:    { contains: phrase, mode: "insensitive" as const } },
      { author:  { name: { contains: phrase, mode: "insensitive" as const } } },
    ],
  };
}

// ─── SEARCH BUILDERS ──────────────────────────────────────────────────────────

// Builds a Prisma WHERE clause for story searches with three layers:
//
//   1. Compound variants: "gang bang" ↔ "gangbang" ↔ "gang-bang" (hardcoded)
//   2. Token synonyms (DB): each word in the query expands to related terms.
//      E.g. "wife" → also searches "married woman", "spouse", "hotwife".
//   3. Phrase synonyms (DB): if the full query matches a known concept, results
//      also include stories matching any related phrase.
//      E.g. "wife gangbang" → also finds "slut wife", "hotwife", "wife sharing".
//
// Token + phrase layers are loaded from the DB (5-minute in-memory cache).
export async function buildStorySearchWhere(query: string) {
  const maps = await getSynonymMaps();

  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const tokens = words.length > 0 ? words : [query.trim()];

  const matchToken = (word: string) => {
    // Compound variants (orthographic)
    const variants = getCompoundVariants(word);
    // Token-level DB synonyms: if "wife" maps to ["married woman","spouse","hotwife"]
    const tokenSyns = maps.token.get(compact(word)) ?? [];

    const allPhrases = [...new Set([...variants, ...tokenSyns])];

    return {
      OR: allPhrases.flatMap((v) => [
        { title:   { contains: v, mode: "insensitive" as const } },
        { excerpt: { contains: v, mode: "insensitive" as const } },
        { content: { contains: v, mode: "insensitive" as const } },
        { tags:    { contains: v, mode: "insensitive" as const } },
        { author:  { name: { contains: v, mode: "insensitive" as const } } },
      ]),
    };
  };

  const tokenClause =
    tokens.length === 1
      ? matchToken(tokens[0])
      : { AND: tokens.map(matchToken) };

  // Phrase-level DB synonyms + compound variant expansion for the full query.
  // The compound check handles e.g. "step sister" → compact = "stepsister" → known variants.
  const phraseSyns  = maps.phrase.get(compact(query)) ?? [];
  const compoundSyns = COMPOUND_VARIANTS[compact(query)] ?? [];
  const allExpansions = [...new Set([...phraseSyns, ...compoundSyns])];

  if (allExpansions.length === 0) return tokenClause;
  return {
    OR: [tokenClause, ...allExpansions.map(matchPhrase)],
  };
}

// Builds a Prisma WHERE clause for series searches (name + description only).
export async function buildSeriesSearchWhere(query: string) {
  const maps = await getSynonymMaps();

  const words = query.trim().split(/\s+/).filter((w) => w.length >= 2);
  const tokens = words.length > 0 ? words : [query.trim()];

  const matchToken = (word: string) => {
    const variants = getCompoundVariants(word);
    const tokenSyns = maps.token.get(compact(word)) ?? [];
    const allPhrases = [...new Set([...variants, ...tokenSyns])];

    return {
      OR: allPhrases.flatMap((v) => [
        { name:        { contains: v, mode: "insensitive" as const } },
        { description: { contains: v, mode: "insensitive" as const } },
        { author:      { name: { contains: v, mode: "insensitive" as const } } },
      ]),
    };
  };

  const tokenClause =
    tokens.length === 1
      ? matchToken(tokens[0])
      : { AND: tokens.map(matchToken) };

  // Add phrase and compound-variant expansion, mirroring story search behaviour.
  const phraseSyns   = maps.phrase.get(compact(query)) ?? [];
  const compoundSyns = COMPOUND_VARIANTS[compact(query)] ?? [];
  const allExpansions = [...new Set([...phraseSyns, ...compoundSyns])];

  if (allExpansions.length === 0) return tokenClause;
  return {
    OR: [
      tokenClause,
      ...allExpansions.map((phrase) => ({
        OR: [
          { name:        { contains: phrase, mode: "insensitive" as const } },
          { description: { contains: phrase, mode: "insensitive" as const } },
          { author:      { name: { contains: phrase, mode: "insensitive" as const } } },
        ],
      })),
    ],
  };
}

// ─── DEFAULT SYNONYMS (used for seeding the DB) ───────────────────────────────
// Admin can import these via the admin panel. Kept here so defaults travel
// with the code rather than being lost in DB.

export const DEFAULT_TOKEN_SYNONYMS: Array<{ term: string; synonyms: string[] }> = [
  { term: "wife",           synonyms: ["wife", "married woman", "spouse", "hotwife", "housewife"] },
  { term: "husband",        synonyms: ["husband", "married man", "spouse", "hubby"] },
  { term: "gangbang",       synonyms: ["gangbang", "gang bang", "orgy", "group sex", "multiple men", "multiple partners", "train"] },
  { term: "milf",           synonyms: ["milf", "mature", "cougar", "older woman", "experienced woman"] },
  { term: "blowjob",        synonyms: ["blowjob", "blow job", "oral sex", "fellatio", "giving head"] },
  { term: "lesbian",        synonyms: ["lesbian", "girl on girl", "sapphic", "female on female"] },
  { term: "bdsm",           synonyms: ["bdsm", "bondage", "domination", "submission", "kinky"] },
  { term: "anal",           synonyms: ["anal", "anal sex", "ass fuck", "butt sex", "backdoor"] },
  { term: "threesome",      synonyms: ["threesome", "3some", "mmf", "ffm", "two on one"] },
  { term: "cheating",       synonyms: ["cheating", "affair", "infidelity", "adultery", "unfaithful"] },
  { term: "virgin",         synonyms: ["virgin", "first time", "first experience", "inexperienced"] },
  { term: "cuckold",        synonyms: ["cuckold", "cuckolding", "hotwife", "wife sharing"] },
  { term: "teacher",        synonyms: ["teacher", "professor", "instructor", "educator"] },
  { term: "boss",           synonyms: ["boss", "manager", "supervisor", "employer"] },
  { term: "nurse",          synonyms: ["nurse", "doctor", "medical", "hospital"] },
  { term: "voyeur",         synonyms: ["voyeur", "watching", "peeping", "spy", "exhibitionist"] },
  { term: "exhibitionist",  synonyms: ["exhibitionist", "public sex", "flashing", "outdoor sex", "voyeur"] },
  { term: "interracial",    synonyms: ["interracial", "inter-racial", "mixed", "bbc", "bwc"] },
  { term: "dominant",       synonyms: ["dominant", "domination", "master", "sir", "bdsm"] },
  { term: "submissive",     synonyms: ["submissive", "submission", "slave", "obedient", "bdsm"] },
  // Family / relationship terms
  { term: "family",         synonyms: ["family", "stepfamily", "step family", "taboo"] },
  { term: "mom",            synonyms: ["mom", "mother", "mommy", "stepmom", "stepmother"] },
  { term: "dad",            synonyms: ["dad", "father", "daddy", "stepdad", "stepfather"] },
  { term: "mother",         synonyms: ["mother", "mom", "mommy", "stepmom", "stepmother"] },
  { term: "father",         synonyms: ["father", "dad", "daddy", "stepdad", "stepfather"] },
  { term: "son",            synonyms: ["son", "stepson", "step son"] },
  { term: "daughter",       synonyms: ["daughter", "stepdaughter", "step daughter"] },
  { term: "brother",        synonyms: ["brother", "stepbrother", "step brother"] },
  { term: "sister",         synonyms: ["sister", "stepsister", "step sister"] },
  { term: "taboo",          synonyms: ["taboo", "forbidden", "stepfamily", "step family"] },
];

export const DEFAULT_PHRASE_SYNONYMS: Array<{ term: string; synonyms: string[] }> = [
  { term: "wifegangbang",       synonyms: ["hotwife", "hot wife", "slut wife", "wife sharing", "multiple partners", "cuckold", "gang bang wife"] },
  { term: "gangbangwife",       synonyms: ["hotwife", "hot wife", "slut wife", "wife sharing", "multiple partners", "cuckold"] },
  { term: "hotwife",            synonyms: ["slut wife", "wife sharing", "wife gangbang", "multiple partners", "cuckold"] },
  { term: "slutwife",           synonyms: ["hotwife", "wife gangbang", "wife sharing", "multiple partners", "cuckold"] },
  { term: "wifesharing",        synonyms: ["hotwife", "slut wife", "cuckold", "wife gangbang", "multiple partners"] },
  { term: "multiplepartners",   synonyms: ["gangbang", "orgy", "group sex", "hotwife", "wife sharing"] },
  { term: "cheating",           synonyms: ["affair", "infidelity", "adultery", "unfaithful"] },
  { term: "cheatwife",          synonyms: ["cheating wife", "unfaithful wife", "hotwife", "adultery"] },
  { term: "affair",             synonyms: ["cheating", "infidelity", "adultery", "unfaithful"] },
  { term: "milf",               synonyms: ["mature", "cougar", "older woman", "experienced woman"] },
  { term: "cougar",             synonyms: ["milf", "mature", "older woman"] },
  { term: "blowjob",            synonyms: ["oral sex", "fellatio", "giving head"] },
  { term: "oralsex",            synonyms: ["blowjob", "blow job", "fellatio", "giving head", "cunnilingus"] },
  { term: "threesome",          synonyms: ["menage a trois", "mmf", "ffm", "two on one"] },
  { term: "lesbian",            synonyms: ["girl on girl", "sapphic", "female on female", "girls together"] },
  { term: "girlongirl",         synonyms: ["lesbian", "sapphic", "female on female"] },
  { term: "bdsm",               synonyms: ["bondage", "domination", "submission", "kinky", "dominatrix"] },
  { term: "bondage",            synonyms: ["bdsm", "tied up", "restrained", "rope play"] },
  { term: "domination",         synonyms: ["bdsm", "bondage", "dominant", "submission"] },
  { term: "exhibitionist",      synonyms: ["public sex", "flashing", "nudism", "voyeur", "outdoor sex"] },
  { term: "publicsex",          synonyms: ["exhibitionist", "outdoor sex", "voyeur", "in public"] },
  { term: "cuckold",            synonyms: ["hotwife", "wife sharing", "wife gangbang", "slut wife", "cuckolding"] },
  { term: "firsttime",          synonyms: ["virgin", "first experience", "first sexual", "inexperienced"] },
  { term: "taboo",              synonyms: ["forbidden", "stepfamily", "step family"] },
  { term: "officesex",          synonyms: ["workplace sex", "boss", "secretary", "coworker"] },
  // Family concept expansion
  { term: "family",             synonyms: ["stepfamily", "step family", "stepmom", "stepdad", "stepsister", "stepbrother", "taboo"] },
  { term: "momson",             synonyms: ["mom son", "mother son", "stepmom stepson", "taboo"] },
  { term: "motherson",          synonyms: ["mom son", "mommy son", "stepmom stepson", "taboo"] },
  { term: "dadson",             synonyms: ["dad son", "father son", "stepdad stepson", "taboo"] },
  { term: "fatherson",          synonyms: ["dad son", "daddy son", "stepdad stepson", "taboo"] },
  { term: "mommy",              synonyms: ["mom", "mother", "stepmom", "milf", "mature"] },
  { term: "daddy",              synonyms: ["dad", "father", "stepdad", "dominant", "older man"] },
];
