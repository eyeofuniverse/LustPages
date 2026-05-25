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
    description: "Between story metadata/actions and the story body",
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
} as const;

export type AdSlotId = keyof typeof AD_SLOTS;
