export type RevenueLevel = "very_high" | "high" | "medium";

export type SlotHint = {
  revenue: RevenueLevel;
  format: string;
  size: string;
  why: string;
};

// ExoClick Banner sizes: 160×600 · 300×250 · 300×500 · 728×90 · 900×250
// Native format adapts to container width (no fixed size required).
// For banner slots: create two separate ExoClick zones — one 728×90 for
// desktop and one 300×250 for mobile — then add both as separate ad entries.

export const AD_SLOTS = {
  homepage_top_banner: {
    label: "Homepage — Top Banner",
    description: "Below the stats bar, above Latest Stories section",
    recommended: "728×90 desktop · 300×250 mobile",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90 desktop · 300×250 mobile",
      why: "Above-the-fold on the highest-traffic page. Create two ExoClick Banner zones — 728×90 for desktop and 300×250 for mobile — and add both as separate ad entries in this slot.",
    },
  },
  homepage_mid_banner: {
    label: "Homepage — Mid Banner",
    description: "Between Latest Stories and Author Spotlight sections",
    recommended: "Native or 728×90",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native",
      size: "Native (fluid — adapts to container width)",
      why: "Mid-page engagement zone. ExoClick Native is the right choice here — it blends with content carousels and achieves 2–3× the CTR of a fixed-size banner.",
    },
  },
  stories_list_top: {
    label: "Stories — Above List",
    description: "Below the trending carousel, above the story list",
    recommended: "728×90 desktop · 300×250 mobile",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90 desktop · 300×250 mobile",
      why: "High-intent browsing moment — users pause before selecting a story. Create a 728×90 zone for desktop and a 300×250 zone for mobile as separate entries.",
    },
  },
  stories_list_mid: {
    label: "Stories — Mid List",
    description: "Inline between stories, after position 8",
    recommended: "Native (in-feed)",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Native (In-Feed)",
      size: "Native (fluid — adapts to container width)",
      why: "Best slot for ExoClick Native — in-feed ads that mimic story cards achieve 3–5× higher CTR than banner formats in list contexts.",
    },
  },
  stories_list_bottom: {
    label: "Stories — Below List",
    description: "Below all stories, above pagination",
    recommended: "300×250",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Post-scroll position with moderate viewability. 300×250 Rectangle is the most universal ExoClick Banner size — highest fill rates and works on both desktop and mobile.",
    },
  },
  story_detail_before_content: {
    label: "Story Detail — Before Content",
    description: "Above the story body, below the series navigation",
    recommended: "728×90 desktop · 300×250 mobile",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Leaderboard) or Interstitial",
      size: "728×90 desktop · 300×250 mobile",
      why: "Pre-content pause point — readers stop here before diving in, giving maximum attention dwell time. One of the highest-CPM positions on the site.",
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
      why: "Highest-engagement position on the site — immersed readers pause naturally at paragraph breaks. ExoClick In-Read is specifically designed for this placement.",
    },
  },
  story_detail_after_content: {
    label: "Story Detail — After Content",
    description: "After story body, before tags and comments",
    recommended: "300×250",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Post-read satisfaction peak — readers are receptive. Pair a 300×250 Rectangle here with a separate Popunder zone for maximum combined yield.",
    },
  },
  author_profile_banner: {
    label: "Author Profile — Banner",
    description: "Below author bio on individual author pages",
    recommended: "Native or 728×90",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Native",
      size: "Native (fluid — adapts to container width)",
      why: "Author fans are a niche but loyal segment. ExoClick Native feels organic here and consistently outperforms fixed-size banners in CTR for this placement type.",
    },
  },
  authors_list_banner: {
    label: "Authors List — Banner",
    description: "Above the authors grid on /authors",
    recommended: "728×90 desktop · 300×250 mobile",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90 desktop · 300×250 mobile",
      why: "Discovery browsing audience. A 728×90 Leaderboard fills the visual space above the grid cleanly; add a 300×250 entry for mobile users.",
    },
  },
  category_page_banner: {
    label: "Category Page — Banner",
    description: "Below filter bar on category listing pages",
    recommended: "Native or 728×90",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native or Banner (Leaderboard)",
      size: "Native (fluid) · or 728×90 banner",
      why: "Category intent is a strong relevance signal. Native blends with the filter UI; a 728×90 Leaderboard also works well. Either beats a generic run-of-site zone.",
    },
  },
  tags_page_banner: {
    label: "Tags Page — Banner",
    description: "Below filter bar on tag listing pages",
    recommended: "728×90 desktop · 300×250 mobile",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Banner (Leaderboard)",
      size: "728×90 desktop · 300×250 mobile",
      why: "Tag browsers have moderate intent. The Leaderboard between filters and results is the standard ad position for this page type — use 300×250 as the mobile entry.",
    },
  },
  series_detail_banner: {
    label: "Series Detail — Banner",
    description: "Below the chapter list on individual series pages",
    recommended: "300×250 or Sticky Banner",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Medium Rectangle) or Sticky Banner",
      size: "300×250",
      why: "Series readers are committed — they're choosing their next chapter. A Sticky Banner format maintains visibility as they scroll; 300×250 Rectangle is the reliable fallback.",
    },
  },
  trending_page_banner: {
    label: "Trending Page — Banner",
    description: "Between the header and the trending story list",
    recommended: "Native or 728×90",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native or Banner (Leaderboard)",
      size: "Native (fluid) · or 728×90 banner",
      why: "Trending pages attract high-engagement users. Native adjacent to trending stories looks like another trending pick — consistently higher CTR than a Leaderboard here.",
    },
  },
  search_results_banner: {
    label: "Search Results — Banner",
    description: "Between story results and series results on the search page",
    recommended: "Native",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Native",
      size: "Native (fluid — adapts to container width)",
      why: "Search intent is the highest-converting signal on any site. ExoClick Native between story and series results looks like a sponsored recommendation — top CTR on the platform.",
    },
  },
  story_detail_pre_comments: {
    label: "Story Detail — Before Comments",
    description: "Below author bio, above the comment section",
    recommended: "300×250",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250",
      why: "Readers who reach the comment section are deeply engaged. A 300×250 Rectangle here converts better than a Leaderboard — the square format holds attention at this scroll depth.",
    },
  },
  story_detail_gate_bottom: {
    label: "Story Detail — Below Lock Gate",
    description: "Below the coin unlock gate, visible only to locked-out users",
    recommended: "300×250 or CPA affiliate",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle) or CPA Affiliate",
      size: "300×250",
      why: "Locked-out users are at a decision point. A relevant CPA or premium-content affiliate offer here captures conversion intent before they bounce — the highest ROI slot on the site.",
    },
  },
  story_sidebar_rectangle: {
    label: "Story Detail — Sticky Sidebar Rectangle",
    description: "Sticky sidebar ad shown during reading on desktop (≥1280px screens)",
    recommended: "300×250 or 300×500",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Banner (Medium Rectangle)",
      size: "300×250 or 300×500",
      why: "Stays visible throughout the entire reading session — the highest viewability score on the site. 300×250 Rectangle has the deepest advertiser demand; 300×500 commands a 30–50% CPM premium.",
    },
  },
  premium_stories_banner: {
    label: "Premium Stories Page — Banner",
    description: "Between the Premium Series section and Premium Stories list",
    recommended: "728×90 or CPA affiliate",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Banner (Leaderboard) or CPA Affiliate",
      size: "728×90",
      why: "Visitors here are already primed to spend. A premium-content affiliate offer or a high-CPM ExoClick Banner zone both perform well — this audience converts above site average.",
    },
  },
  collections_page_banner: {
    label: "Collections Page — Banner",
    description: "Between the Live Rankings section and Best by Category",
    recommended: "Native or 300×250",
    hint: {
      revenue: "medium" as RevenueLevel,
      format: "Native",
      size: "Native (fluid — adapts to container width)",
      why: "Collections browsing is discovery mode. ExoClick Native ads look like curated content picks — lower disruption and better engagement than a fixed-size banner here.",
    },
  },
  series_list_banner: {
    label: "Series List — Banner",
    description: "Between the search bar and the series grid on /series",
    recommended: "Native or 728×90",
    hint: {
      revenue: "high" as RevenueLevel,
      format: "Native (In-Feed)",
      size: "Native (fluid — adapts to container width)",
      why: "Series browsers are long-form readers looking for their next commitment. Native story ads are indistinguishable from organic recommendations — highest CTR for this page.",
    },
  },
  global_popunder: {
    label: "Global — Pop-Under",
    description: "Fires once per hour on first user click across the entire site. Not a visual slot — paste the ExoClick Pop-Under zone script here.",
    recommended: "Pop-Under script only",
    hint: {
      revenue: "very_high" as RevenueLevel,
      format: "Pop-Under",
      size: "Full page (opens behind current tab)",
      why: "Pop-under is the single highest RPM format on adult networks. ExoClick enforces the frequency cap (set to 1/hour in your zone settings). Set Ad Type to 'Ad Network' and paste the zone script.",
    },
  },
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;
