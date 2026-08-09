export const AD_SLOTS = {
  homepage_top_banner: {
    label: "Homepage — Top Banner",
    description: "Below the stats bar, above Latest Stories section",
    recommended: "728×90 leaderboard or responsive",
  },
  homepage_mid_banner: {
    label: "Homepage — Mid Banner",
    description: "Between Latest Stories and Author Spotlight sections",
    recommended: "728×90 or responsive",
  },
  stories_list_top: {
    label: "Stories — Above List",
    description: "Below the trending carousel, above the story list",
    recommended: "728×90 or responsive",
  },
  stories_list_mid: {
    label: "Stories — Mid List",
    description: "Inline between stories, after position 8",
    recommended: "728×90 or responsive",
  },
  stories_list_bottom: {
    label: "Stories — Below List",
    description: "Below all stories, above pagination",
    recommended: "728×90 or responsive",
  },
  story_detail_before_content: {
    label: "Story Detail — Before Content",
    description: "Above the story body, below the series navigation",
    recommended: "728×90 or 300×250",
  },
  story_detail_mid_content: {
    label: "Story Detail — Mid Content",
    description: "Injected at ~65% through the story body, at a natural paragraph break",
    recommended: "728×90 or 300×250",
  },
  story_detail_after_content: {
    label: "Story Detail — After Content",
    description: "After story body, before tags and comments",
    recommended: "728×90 or 300×250",
  },
  author_profile_banner: {
    label: "Author Profile — Banner",
    description: "Below author bio on individual author pages",
    recommended: "728×90 or responsive",
  },
  authors_list_banner: {
    label: "Authors List — Banner",
    description: "Above the authors grid on /authors",
    recommended: "728×90 or responsive",
  },
  category_page_banner: {
    label: "Category Page — Banner",
    description: "Below filter bar on category listing pages",
    recommended: "728×90 or responsive",
  },
  tags_page_banner: {
    label: "Tags Page — Banner",
    description: "Below filter bar on tag listing pages",
    recommended: "728×90 or responsive",
  },
  series_detail_banner: {
    label: "Series Detail — Banner",
    description: "Below the chapter list on individual series pages",
    recommended: "728×90 or 300×250",
  },
  trending_page_banner: {
    label: "Trending Page — Banner",
    description: "Between the header and the trending story list",
    recommended: "728×90 or responsive",
  },
  search_results_banner: {
    label: "Search Results — Banner",
    description: "Between story results and series results on the search page",
    recommended: "728×90 or responsive",
  },
  story_detail_pre_comments: {
    label: "Story Detail — Before Comments",
    description: "Below author bio, above the comment section",
    recommended: "728×90 or 300×250",
  },
  story_detail_gate_bottom: {
    label: "Story Detail — Below Lock Gate",
    description: "Below the coin unlock gate, visible only to locked-out users",
    recommended: "728×90 or 300×250",
  },
  story_sidebar_rectangle: {
    label: "Story Detail — Sticky Sidebar Rectangle",
    description: "Sticky sidebar ad shown during reading on desktop (≥1280px screens)",
    recommended: "300×250 or 300×600",
  },
  premium_stories_banner: {
    label: "Premium Stories Page — Banner",
    description: "Between the Premium Series section and Premium Stories list",
    recommended: "728×90 or responsive",
  },
  collections_page_banner: {
    label: "Collections Page — Banner",
    description: "Between the Live Rankings section and Best by Category",
    recommended: "728×90 or responsive",
  },
  series_list_banner: {
    label: "Series List — Banner",
    description: "Between the search bar and the series grid on /series",
    recommended: "728×90 or responsive",
  },
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;
