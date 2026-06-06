// ─── COMPOUND VARIANTS ────────────────────────────────────────────────────────
// Maps the normalized (lowercase, no hyphens/spaces) form of a term to every
// surface variant that may appear in story content. Handles the same word
// written differently: "gangbang" ↔ "gang bang" ↔ "gang-bang".
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

// ─── PHRASE SYNONYMS ──────────────────────────────────────────────────────────
// Maps a normalized (compact, lowercase) query or concept keyword to a list of
// semantically related phrases. When the full search query matches a key, these
// phrases are added as additional OR conditions alongside the token-based search,
// so results include both exact matches AND conceptually related stories.
//
// Rule: only add synonyms that a reader would genuinely expect to find. Err on
// the side of fewer, more accurate synonyms rather than too many loose ones.
const PHRASE_SYNONYMS: Record<string, string[]> = {
  // ── Gangbang / group sex / wife sharing cluster ──────────────────────────
  gangbang:          ["orgy", "group sex", "multiple men", "multiple partners"],
  wifegangbang:      ["hotwife", "hot wife", "slut wife", "wife sharing", "multiple partners", "cuckold", "gang bang wife"],
  gangbangwife:      ["hotwife", "hot wife", "slut wife", "wife sharing", "multiple partners", "cuckold"],
  hotwife:           ["slut wife", "wife sharing", "wife gangbang", "multiple partners", "cuckold"],
  slutwife:          ["hotwife", "wife gangbang", "wife sharing", "multiple partners", "cuckold"],
  wifesharing:       ["hotwife", "slut wife", "cuckold", "wife gangbang", "multiple partners"],
  multiplepartners:  ["gangbang", "orgy", "group sex", "hotwife", "wife sharing"],
  cuckold:           ["hotwife", "wife sharing", "wife gangbang", "slut wife", "cuckolding"],
  cuckolding:        ["cuckold", "hotwife", "wife sharing", "slut wife"],

  // ── Cheating / affair cluster ─────────────────────────────────────────────
  cheating:          ["affair", "infidelity", "adultery", "unfaithful", "cheat"],
  cheatwife:         ["cheating wife", "unfaithful wife", "hotwife", "adultery"],
  affair:            ["cheating", "infidelity", "adultery", "unfaithful"],
  infidelity:        ["cheating", "affair", "adultery", "unfaithful"],
  adultery:          ["cheating", "affair", "infidelity", "unfaithful"],

  // ── MILF / mature cluster ─────────────────────────────────────────────────
  milf:              ["mature", "cougar", "older woman", "experienced woman"],
  cougar:            ["milf", "mature", "older woman"],

  // ── Oral sex cluster ──────────────────────────────────────────────────────
  blowjob:           ["oral sex", "fellatio", "giving head", "sucking cock"],
  oralsex:           ["blowjob", "blow job", "fellatio", "giving head", "cunnilingus"],
  cunnilingus:       ["oral sex", "eating out", "going down on"],

  // ── Threesome cluster ─────────────────────────────────────────────────────
  threesome:         ["menage a trois", "mmf", "ffm", "two on one", "two men one woman", "two women one man"],

  // ── Lesbian cluster ───────────────────────────────────────────────────────
  lesbian:           ["girl on girl", "sapphic", "female on female", "girls together", "women together"],
  girlongirl:        ["lesbian", "sapphic", "female on female"],
  sapphic:           ["lesbian", "girl on girl", "female on female"],

  // ── BDSM cluster ──────────────────────────────────────────────────────────
  bdsm:              ["bondage", "domination", "submission", "kinky", "dominatrix", "master slave"],
  bondage:           ["bdsm", "tied up", "restrained", "rope play"],
  domination:        ["bdsm", "bondage", "dominant", "submission", "master slave"],
  submission:        ["bdsm", "bondage", "submissive", "obedience", "dominated"],
  dominatrix:        ["bdsm", "femdom", "female domination", "mistress"],
  femdom:            ["dominatrix", "female domination", "mistress", "bdsm"],

  // ── Exhibitionism / voyeur cluster ────────────────────────────────────────
  exhibitionist:     ["public sex", "flashing", "nudism", "voyeur", "outdoor sex"],
  publicsex:         ["exhibitionist", "outdoor sex", "voyeur", "in public"],
  voyeur:            ["watching", "peeping", "exhibitionist", "spy"],

  // ── Taboo / forbidden cluster ─────────────────────────────────────────────
  taboo:             ["forbidden", "stepfamily", "step family", "incest"],

  // ── Anal cluster ──────────────────────────────────────────────────────────
  anal:              ["anal sex", "ass fuck", "butt fuck", "backdoor", "behind"],
  analsex:           ["anal", "ass fuck", "butt sex", "backdoor"],

  // ── Virgin / first time cluster ───────────────────────────────────────────
  virgin:            ["first time", "first experience", "inexperienced", "deflowered"],
  firsttime:         ["virgin", "first experience", "first sexual", "inexperienced"],

  // ── Romance cluster ───────────────────────────────────────────────────────
  romance:           ["love story", "romantic", "love making", "passionate"],

  // ── Office / workplace cluster ────────────────────────────────────────────
  officesex:         ["workplace sex", "boss", "secretary", "coworker", "colleague"],
  bosssex:           ["office sex", "workplace", "forbidden office", "secretary"],
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Returns all surface variants for a single search token.
export function getTermVariants(token: string): string[] {
  const compact = token.toLowerCase().replace(/[-\s]+/g, "");
  return COMPOUND_VARIANTS[compact] ?? [token];
}

// Returns the normalized (compact) form of a full query string.
function compactQuery(query: string): string {
  return query.trim().toLowerCase().replace(/[-\s]+/g, "");
}

// Builds a single Prisma OR condition that matches a phrase across all story fields.
function matchPhrase(phrase: string) {
  return {
    OR: [
      { title:   { contains: phrase, mode: "insensitive" as const } },
      { excerpt: { contains: phrase, mode: "insensitive" as const } },
      { content: { contains: phrase, mode: "insensitive" as const } },
      { tags:    { contains: phrase.toLowerCase() } },
    ],
  };
}

// ─── PUBLIC SEARCH BUILDERS ───────────────────────────────────────────────────

// Builds a Prisma WHERE clause for story searches with two layers:
//   1. Token layer (AND): every word in the query must appear somewhere.
//      Compound-word variants are expanded ("gang bang" ↔ "gangbang").
//   2. Synonym layer (OR): if the full query matches a known concept, results
//      also include stories matching any semantic synonym phrase.
//
// Final shape: tokenClause  (when no synonyms)
//           OR { OR: [tokenClause, ...synonymMatches] }  (when synonyms exist)
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

  const tokenClause =
    tokens.length === 1 ? matchToken(tokens[0]) : { AND: tokens.map(matchToken) };

  // Check for semantic synonyms on the full query
  const synonymPhrases = PHRASE_SYNONYMS[compactQuery(query)] ?? [];
  if (synonymPhrases.length === 0) return tokenClause;

  return {
    OR: [tokenClause, ...synonymPhrases.map(matchPhrase)],
  };
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
