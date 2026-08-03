export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";
export type BadgeCategory = "reader" | "author";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  category: BadgeCategory;
}

export const TIER_COLORS: Record<BadgeTier, { color: string; bg: string; border: string }> = {
  bronze:   { color: "#b45309", bg: "rgba(180,83,9,0.12)",    border: "rgba(180,83,9,0.3)"    },
  silver:   { color: "#6b7280", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)" },
  gold:     { color: "#d97706", bg: "rgba(217,119,6,0.12)",   border: "rgba(217,119,6,0.3)"   },
  platinum: { color: "#7c3aed", bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.3)"  },
};

export const TIER_ORDER: Record<BadgeTier, number> = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
};

// ── Reader Badges ─────────────────────────────────────────────────────────────

export const READER_BADGES: BadgeDef[] = [
  // Reading milestones (stories completed)
  { id: "first-chapter",     name: "First Chapter",      description: "Completed your first story",              icon: "📖", tier: "bronze",   category: "reader" },
  { id: "bookworm",          name: "Bookworm",            description: "Completed 10 stories",                   icon: "📚", tier: "bronze",   category: "reader" },
  { id: "page-turner",       name: "Page Turner",         description: "Completed 25 stories",                   icon: "🔖", tier: "silver",   category: "reader" },
  { id: "literary-devotee",  name: "Literary Devotee",    description: "Completed 50 stories",                   icon: "📕", tier: "silver",   category: "reader" },
  { id: "endless-reader",    name: "Endless Reader",      description: "Completed 100 stories",                  icon: "🌟", tier: "gold",     category: "reader" },
  { id: "legend",            name: "Legend",              description: "Completed 250 stories",                  icon: "👑", tier: "platinum", category: "reader" },
  { id: "bibliophile",       name: "Bibliophile",         description: "Completed 500 stories",                  icon: "📜", tier: "platinum", category: "reader" },

  // Comments
  { id: "first-voice",       name: "First Voice",         description: "Posted your first comment",              icon: "💬", tier: "bronze",   category: "reader" },
  { id: "conversationalist", name: "Conversationalist",   description: "Posted 10 comments",                     icon: "🗣️", tier: "bronze",   category: "reader" },
  { id: "community-pillar",  name: "Community Pillar",    description: "Posted 50 comments",                     icon: "🏛️", tier: "silver",   category: "reader" },
  { id: "forum-legend",      name: "Forum Legend",        description: "Posted 100 comments",                    icon: "🎭", tier: "gold",     category: "reader" },
  { id: "voice-of-the-people", name: "Voice of the People", description: "Posted 500 comments",                 icon: "🎙️", tier: "platinum", category: "reader" },

  // Ratings
  { id: "first-critic",      name: "First Critic",        description: "Rated your first story",                 icon: "⭐", tier: "bronze",   category: "reader" },
  { id: "taste-maker",       name: "Taste Maker",         description: "Rated 25 stories",                       icon: "🎯", tier: "silver",   category: "reader" },
  { id: "connoisseur",       name: "Connoisseur",         description: "Rated 100 stories",                      icon: "🏆", tier: "gold",     category: "reader" },
  { id: "oracle",            name: "Oracle",              description: "Rated 500 stories",                      icon: "🔮", tier: "platinum", category: "reader" },

  // Likes
  { id: "appreciator",       name: "Appreciator",         description: "Liked your first story",                 icon: "❤️", tier: "bronze",   category: "reader" },
  { id: "fan",               name: "Fan",                 description: "Liked 25 stories",                       icon: "💕", tier: "bronze",   category: "reader" },
  { id: "devotee",           name: "Devotee",             description: "Liked 100 stories",                      icon: "💝", tier: "silver",   category: "reader" },
  { id: "love-machine",      name: "Love Machine",        description: "Liked 500 stories",                      icon: "💖", tier: "gold",     category: "reader" },
  { id: "heart-collector",   name: "Heart Collector",     description: "Liked 1,000 stories",                    icon: "💘", tier: "platinum", category: "reader" },

  // Bookmarks
  { id: "first-bookmark",    name: "First Bookmark",      description: "Saved your first story",                 icon: "🔖", tier: "bronze",   category: "reader" },
  { id: "librarian",         name: "Librarian",           description: "Bookmarked 25 stories",                  icon: "📚", tier: "silver",   category: "reader" },
  { id: "archivist",         name: "Archivist",           description: "Bookmarked 100 stories",                 icon: "🗄️", tier: "gold",     category: "reader" },

  // Unlocks
  { id: "first-unlock",      name: "First Unlock",        description: "Unlocked your first premium story or series", icon: "🔓", tier: "bronze",   category: "reader" },
  { id: "treasure-hunter",   name: "Treasure Hunter",     description: "Unlocked 10 premium titles",             icon: "🗝️", tier: "bronze",   category: "reader" },
  { id: "vault-keeper",      name: "Vault Keeper",        description: "Unlocked 25 premium titles",             icon: "🏺", tier: "silver",   category: "reader" },
  { id: "premium-collector", name: "Premium Collector",   description: "Unlocked 50 premium titles",             icon: "💎", tier: "gold",     category: "reader" },
  { id: "grand-collector",   name: "Grand Collector",     description: "Unlocked 100 premium titles",            icon: "👑", tier: "platinum", category: "reader" },

  // Coin spending
  { id: "first-splurge",     name: "First Splurge",       description: "Made your first coin purchase",          icon: "🪙", tier: "bronze",   category: "reader" },
  { id: "coin-collector",    name: "Coin Collector",      description: "Spent 500 coins on the platform",        icon: "💰", tier: "bronze",   category: "reader" },
  { id: "coin-hoarder",      name: "Coin Hoarder",        description: "Spent 2,000 coins on the platform",      icon: "💵", tier: "silver",   category: "reader" },
  { id: "high-roller",       name: "High Roller",         description: "Spent 10,000 coins on the platform",     icon: "💸", tier: "gold",     category: "reader" },
  { id: "whale",             name: "Whale",               description: "Spent 50,000 coins on the platform",     icon: "🐋", tier: "platinum", category: "reader" },

  // Subscription
  { id: "subscriber",        name: "Subscriber",          description: "Became a LustPages subscriber",          icon: "⭐", tier: "silver",   category: "reader" },

  // Tips sent
  { id: "generous",          name: "Generous",            description: "Sent your first tip to an author",       icon: "🎁", tier: "bronze",   category: "reader" },
  { id: "patron",            name: "Patron",              description: "Sent 10 tips to authors",                icon: "🤝", tier: "silver",   category: "reader" },
  { id: "benefactor",        name: "Benefactor",          description: "Sent 50 tips to authors",                icon: "🌟", tier: "gold",     category: "reader" },
  { id: "maecenas",          name: "Maecenas",            description: "Sent 100 tips to authors",               icon: "🏛️", tier: "platinum", category: "reader" },
];

// ── Author Badges ─────────────────────────────────────────────────────────────

export const AUTHOR_BADGES: BadgeDef[] = [
  // Publishing milestones
  { id: "debut-author",       name: "Debut",               description: "Published your first story",             icon: "✏️", tier: "bronze",   category: "author" },
  { id: "storyteller",        name: "Storyteller",          description: "Published 5 stories",                    icon: "📝", tier: "bronze",   category: "author" },
  { id: "prolific",           name: "Prolific",             description: "Published 10 stories",                   icon: "🖊️", tier: "silver",   category: "author" },
  { id: "wordsmith",          name: "Wordsmith",            description: "Published 25 stories",                   icon: "✍️", tier: "silver",   category: "author" },
  { id: "author-legend",      name: "Author Legend",        description: "Published 50 stories",                   icon: "📜", tier: "gold",     category: "author" },
  { id: "century-author",     name: "Century",              description: "Published 100 stories",                  icon: "🏆", tier: "platinum", category: "author" },

  // Series
  { id: "saga-begins",        name: "Saga Begins",          description: "Published your first series",            icon: "📚", tier: "bronze",   category: "author" },
  { id: "serial-author",      name: "Serial Author",        description: "Published 3 series",                     icon: "📖", tier: "silver",   category: "author" },
  { id: "series-master",      name: "Series Master",        description: "Published 10 series",                    icon: "👑", tier: "gold",     category: "author" },

  // Story likes received
  { id: "first-fan",          name: "First Fan",            description: "Your stories received 10 likes",         icon: "❤️", tier: "bronze",   category: "author" },
  { id: "rising-star",        name: "Rising Star",          description: "Your stories received 100 likes",        icon: "⭐", tier: "bronze",   category: "author" },
  { id: "hot-author",         name: "Hot Author",           description: "Your stories received 500 likes",        icon: "🔥", tier: "silver",   category: "author" },
  { id: "love-magnet",        name: "Love Magnet",          description: "Your stories received 2,000 likes",      icon: "💖", tier: "gold",     category: "author" },
  { id: "icon",               name: "Icon",                 description: "Your stories received 10,000 likes",     icon: "👑", tier: "platinum", category: "author" },

  // Comments received on stories
  { id: "discussion-starter", name: "Discussion Starter",   description: "Your stories received 10 comments",      icon: "💬", tier: "bronze",   category: "author" },
  { id: "beloved",            name: "Beloved",              description: "Your stories received 100 comments",     icon: "🌹", tier: "silver",   category: "author" },
  { id: "conversation-king",  name: "Conversation King",    description: "Your stories received 500 comments",     icon: "🎭", tier: "gold",     category: "author" },
  { id: "cultural-phenomenon",name: "Cultural Phenomenon",  description: "Your stories received 2,000 comments",   icon: "🌐", tier: "platinum", category: "author" },

  // Ratings received
  { id: "rated-author",       name: "Rated",                description: "Your stories received 10 ratings",       icon: "⭐", tier: "bronze",   category: "author" },
  { id: "critically-acclaimed", name: "Critically Acclaimed", description: "Your stories received 50 ratings",     icon: "🎬", tier: "silver",   category: "author" },
  { id: "masterful",          name: "Masterful",            description: "Your stories received 200 ratings",      icon: "🎨", tier: "gold",     category: "author" },
  { id: "legendary-quality",  name: "Legendary Quality",    description: "Maintained a 4.5+ average rating with 50+ ratings", icon: "🌟", tier: "platinum", category: "author" },

  // Tips received
  { id: "first-tip-received", name: "First Tip",            description: "Received your first tip from a reader",  icon: "🎁", tier: "bronze",   category: "author" },
  { id: "supported",          name: "Supported",            description: "Received 10 tips from readers",          icon: "🤲", tier: "silver",   category: "author" },
  { id: "fan-favorite",       name: "Fan Favorite",         description: "Received 50 tips from readers",          icon: "🌟", tier: "gold",     category: "author" },
  { id: "celebrated",         name: "Celebrated",           description: "Received 100 tips from readers",         icon: "🎊", tier: "platinum", category: "author" },

  // Author followers (AuthorLike)
  { id: "first-follower",     name: "First Follower",       description: "Got your first follower",                icon: "👤", tier: "bronze",   category: "author" },
  { id: "following-popular",  name: "Popular",              description: "Got 10 followers",                       icon: "👥", tier: "bronze",   category: "author" },
  { id: "popular-author",     name: "Fan Club",             description: "Got 50 followers",                       icon: "🌟", tier: "silver",   category: "author" },
  { id: "influencer",         name: "Influencer",           description: "Got 200 followers",                      icon: "💫", tier: "gold",     category: "author" },
  { id: "superstar",          name: "Superstar",            description: "Got 1,000 followers",                    icon: "🌠", tier: "platinum", category: "author" },

  // Coin earnings
  { id: "earning-author",     name: "Earning",              description: "Earned 100 coins from your stories",     icon: "💰", tier: "bronze",   category: "author" },
  { id: "monetized",          name: "Monetized",            description: "Earned 1,000 coins from your stories",   icon: "💵", tier: "silver",   category: "author" },
  { id: "professional",       name: "Professional",         description: "Earned 5,000 coins from your stories",   icon: "💎", tier: "gold",     category: "author" },
  { id: "wealthy-author",     name: "Wealthy Author",       description: "Earned 25,000 coins from your stories",  icon: "🏆", tier: "platinum", category: "author" },
];

export const ALL_BADGES: BadgeDef[] = [...READER_BADGES, ...AUTHOR_BADGES];

export const BADGE_MAP = new Map<string, BadgeDef>(ALL_BADGES.map((b) => [b.id, b]));

export function getBadge(id: string): BadgeDef | undefined {
  return BADGE_MAP.get(id);
}

/** Returns the most prestigious badge from a list of badgeIds. */
export function getTopBadge(badgeIds: string[]): BadgeDef | undefined {
  let top: BadgeDef | undefined;
  for (const id of badgeIds) {
    const def = BADGE_MAP.get(id);
    if (!def) continue;
    if (!top || TIER_ORDER[def.tier] > TIER_ORDER[top.tier]) top = def;
  }
  return top;
}
