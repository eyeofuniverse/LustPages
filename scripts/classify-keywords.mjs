// Auto-classifies existing tags as isKeyword = true when they look like
// SEO keyword phrases rather than clean display tags.
// Run once with: node --env-file=.env.local scripts/classify-keywords.mjs
//
// Rules (isKeyword = true if ANY matches):
//   1. Name has 3+ words
//   2. Name contains a common erotic action verb pattern
//   3. Name contains digits + a word (e.g. "18 year old")
//   4. Slug matches patterns like "X-fucks-Y", "gets-Y", "takes-Y", etc.
//
// Safe-list: all 84 INITIAL_TAGS slugs are always kept as display tags.

import pg from "pg";
const { Client } = pg;

// These are the official display tag slugs from lib/tags.ts — always isKeyword = false
const DISPLAY_TAG_SLUGS = new Set([
  "dark-romance","contemporary-romance","paranormal-romance","sci-fi-monster",
  "historical-romance","romantic-suspense","fantasy-romance","erotic-romance",
  "taboo-romance","lgbtq-romance","reverse-harem","steamy-romance",
  "enemies-to-lovers","age-gap","billionaire","alpha-hero","boss-employee",
  "second-chance","friends-to-lovers","forced-proximity","arranged-marriage",
  "fake-dating","mafia-romance","mc-romance","insta-love","love-triangle",
  "slow-burn","best-friends-brother","office-romance","military-romance",
  "small-town-romance","stalker-romance","obsessed-hero","possessive-hero",
  "protector-hero","hurt-comfort","grumpy-sunshine","fated-mates","stepbrother",
  "professor-student","bodyguard","single-parent","royal-romance",
  "bdsm","exhibitionism","mf","mm","ff","mfm","ffm","high-spice","medium-spice",
  "light-spice","dom-sub","daddy-dom","breeding-kink","bondage","voyeurism",
  "public-play","menage","dirty-talk","rough","dubcon","non-con",
]);

// Action verb segments that signal a keyword phrase when found in slug
const KEYWORD_VERB_PATTERNS = [
  "fucks","fucked","fucking","gets-fucked","gets-used","gets-caught","gets-creampied",
  "takes","sucks","blows","rides","bangs","pounds","uses","fills","makes","gives",
  "seduces","teaches","trains","punishes","rewards","watches","catches","films",
  "sleeps-with","sneaks","sneaking","begs","forced","forces","dominated","dominated-by",
];

function isKeywordPhrase(name, slug) {
  // Always a display tag if in the safe-list
  if (DISPLAY_TAG_SLUGS.has(slug)) return false;

  const words = name.trim().split(/\s+/);

  // Rule 1: 3+ word names
  if (words.length >= 3) return true;

  // Rule 2: contains a digit (e.g. "18 year old", "50 shades")
  if (/\d/.test(name)) return true;

  // Rule 3: slug contains an action verb segment
  if (KEYWORD_VERB_PATTERNS.some((v) => slug.includes(v))) return true;

  // Rule 4: slug has 4+ hyphen-separated segments (very specific phrase)
  if (slug.split("-").length >= 5) return true;

  return false;
}

const client = new Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

try {
  const { rows: tags } = await client.query(
    `SELECT id, name, slug, "isKeyword" FROM "Tag" ORDER BY name`
  );

  let displayCount = 0;
  let keywordCount = 0;
  let updatedCount = 0;

  for (const tag of tags) {
    const shouldBeKeyword = isKeywordPhrase(tag.name, tag.slug);
    if (shouldBeKeyword !== tag.isKeyword) {
      await client.query(
        `UPDATE "Tag" SET "isKeyword" = $1 WHERE id = $2`,
        [shouldBeKeyword, tag.id]
      );
      updatedCount++;
    }
    if (shouldBeKeyword) keywordCount++;
    else displayCount++;
  }

  console.log(`\n✓ Classification complete`);
  console.log(`  Display tags (isKeyword=false): ${displayCount}`);
  console.log(`  SEO keywords (isKeyword=true):  ${keywordCount}`);
  console.log(`  Rows updated:                   ${updatedCount}`);
  console.log(`\n  Admin can review and flip any tag via Admin → Tag Library`);
} finally {
  await client.end();
}
