export type RevenueLevel = "very_high" | "high" | "medium";

export type SlotHint = {
  revenue: RevenueLevel;
  format: string;
  size: string;
  why: string;
};

export const AD_SLOTS = {
  homepage_top_banner: {
    label: "Homepage — Top Banner",
    description: "Below the stats bar, above Latest Stories section",
    recommended: "728×90 leaderboard or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90 desktop · 320×50 mobile",
      why: "Above-the-fold placement on the highest-traffic page guarantees maximum viewability — use ExoClick's responsive zone so it auto-sizes for mobile.",
    },
  },
  homepage_mid_banner: {
    label: "Homepage — Mid Banner",
    description: "Between Latest Stories and Author Spotlight sections",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native",
      size: "Responsive",
      why: "Mid-page engagement zone — Native blends with content carousels and achieves 2–3× the CTR of a standard display banner here.",
    },
  },
  stories_list_top: {
    label: "Stories — Above List",
    description: "Below the trending carousel, above the story list",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90",
      why: "High-intent browsing moment — users pause here before selecting a story, giving the ad maximum dwell time and viewability.",
    },
  },
  stories_list_mid: {
    label: "Stories — Mid List",
    description: "Inline between stories, after position 8",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Native (In-Feed)",
      size: "Responsive",
      why: "Best slot for Native — in-feed ads that mimic story cards achieve 3–5× higher CTR than banners in list contexts and pass as organic content.",
    },
  },
  stories_list_bottom: {
    label: "Stories — Below List",
    description: "Below all stories, above pagination",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Post-scroll position with moderate viewability. 300×250 has the deepest advertiser demand pool, ensuring high fill rates even at lower traffic.",
    },
  },
  story_detail_before_content: {
    label: "Story Detail — Before Content",
    description: "Above the story body, below the series navigation",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Leaderboard) or Interstitial",
      size: "728×90",
      why: "Pre-content pause point — readers stop here before diving in, giving the ad maximum attention. One of your highest-CPM positions.",
    },
  },
  story_detail_mid_content: {
    label: "Story Detail — Mid Content",
    description: "Injected at ~65% through the story body, at a natural paragraph break",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "In-Read Banner or Native",
      size: "728×90 or 300×250",
      why: "Highest-engagement position on the site — immersed readers pause naturally at paragraph breaks. Use ExoClick In-Read for the best CPM here.",
    },
  },
  story_detail_after_content: {
    label: "Story Detail — After Content",
    description: "After story body, before tags and comments",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Post-read satisfaction peak — readers feel good and are receptive. Pair a 300×250 here with a Popunder zone for maximum combined yield.",
    },
  },
  author_profile_banner: {
    label: "Author Profile — Banner",
    description: "Below author bio on individual author pages",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Native",
      size: "Responsive",
      why: "Author fans are a niche but loyal segment. Native content-recommendation ads feel organic here and outperform display in CTR.",
    },
  },
  authors_list_banner: {
    label: "Authors List — Banner",
    description: "Above the authors grid on /authors",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90",
      why: "Discovery browsing audience. A standard leaderboard fills the visual space cleanly without disrupting the grid layout below.",
    },
  },
  category_page_banner: {
    label: "Category Page — Banner",
    description: "Below filter bar on category listing pages",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native or Banner (Leaderboard)",
      size: "728×90",
      why: "Category intent is a strong relevance signal. Native blends with the filter UI; a leaderboard works well too. Either beats a generic run-of-site unit.",
    },
  },
  tags_page_banner: {
    label: "Tags Page — Banner",
    description: "Below filter bar on tag listing pages",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90",
      why: "Tag browsers have moderate intent. The leaderboard between filters and results is the expected ad position for this page type.",
    },
  },
  series_detail_banner: {
    label: "Series Detail — Banner",
    description: "Below the chapter list on individual series pages",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Medium Rectangle) or Sticky Banner",
      size: "300×250",
      why: "Series readers are committed — they're choosing their next chapter. A Sticky Banner maintains visibility while they scroll the chapter list.",
    },
  },
  trending_page_banner: {
    label: "Trending Page — Banner",
    description: "Between the header and the trending story list",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native or Banner (Leaderboard)",
      size: "728×90",
      why: "Trending pages attract high-engagement users. Native adjacent to trending stories outperforms display here — it looks like another trending pick.",
    },
  },
  search_results_banner: {
    label: "Search Results — Banner",
    description: "Between story results and series results on the search page",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Native",
      size: "Responsive",
      why: "Search intent is the highest-converting signal on any site. A Native unit between story and series results looks like a sponsored recommendation — top CTR.",
    },
  },
  story_detail_pre_comments: {
    label: "Story Detail — Before Comments",
    description: "Below author bio, above the comment section",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Readers who reach the comment section are deeply engaged — above-average conversion rates. A 300×250 here converts better than a leaderboard.",
    },
  },
  story_detail_gate_bottom: {
    label: "Story Detail — Below Lock Gate",
    description: "Below the coin unlock gate, visible only to locked-out users",
    recommended: "728×90 or 300×250",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle) or CPA Affiliate",
      size: "300×250",
      why: "Locked-out users are at a decision point. A relevant CPA or premium-content affiliate offer here captures conversion intent before they bounce — highest ROI slot.",
    },
  },
  story_sidebar_rectangle: {
    label: "Story Detail — Sticky Sidebar Rectangle",
    description: "Sticky sidebar ad shown during reading on desktop (≥1280px screens)",
    recommended: "300×250 or 300×600",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250 or 300×600",
      why: "Stays visible throughout the entire reading session. 300×250 has the highest advertiser demand; 300×600 (half-page) commands a 30–50% CPM premium.",
    },
  },
  premium_stories_banner: {
    label: "Premium Stories Page — Banner",
    description: "Between the Premium Series section and Premium Stories list",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard) or CPA Affiliate",
      size: "728×90",
      why: "Visitors here are already primed to spend. A premium-content affiliate offer or a high-CPM network unit both perform well with this audience.",
    },
  },
  collections_page_banner: {
    label: "Collections Page — Banner",
    description: "Between the Live Rankings section and Best by Category",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Native",
      size: "Responsive",
      why: "Collections browsing is discovery mode. Native recommendation ads look like curated content picks — lower disruption, better engagement.",
    },
  },
  series_list_banner: {
    label: "Series List — Banner",
    description: "Between the search bar and the series grid on /series",
    recommended: "728×90 or responsive",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native (In-Feed)",
      size: "Responsive",
      why: "Series browsers are long-form readers looking for their next commitment. Native story ads are indistinguishable from organic recommendations here.",
    },
  },
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;
