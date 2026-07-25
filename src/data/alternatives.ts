export interface ComparisonRow {
  feature: string;
  lustpages: string;
  competitor: string;
  lustpagesWins: boolean;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface AlternativePage {
  slug: string;
  competitor: string;
  competitorUrl: string;
  headline: string;
  subheadline: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  intro: string;
  whyLeaveReasons: { heading: string; body: string }[];
  comparison: ComparisonRow[];
  lustpagesFeatures: { heading: string; body: string }[];
  faqs: FAQ[];
  verdict: string;
}

const alternatives: AlternativePage[] = [
  {
    slug: "literotica-alternative",
    competitor: "Literotica",
    competitorUrl: "https://www.literotica.com",
    headline: "Best Literotica Alternative in 2026",
    subheadline: "Literotica built the genre. LustPages built what comes next.",
    metaTitle: "Best Literotica Alternative in 2026 — LustPages",
    metaDescription:
      "Looking for a Literotica alternative with a modern design, dark mode, reading lists, and author support? Discover LustPages — the adult fiction platform built for today's readers.",
    keywords: [
      "literotica alternative",
      "sites like literotica",
      "better than literotica",
      "literotica replacement",
      "adult fiction site like literotica",
      "modern literotica",
    ],
    intro:
      "Literotica has been the internet's go-to adult fiction library since 1998. Its sheer volume of stories is unmatched. But a lot has changed in 25 years — mobile-first design, dark mode, curated discovery, author monetization — and Literotica hasn't kept pace. If you've found yourself squinting at a white background on your phone at midnight, or wishing your bookmarks actually worked, you're in the right place.",
    whyLeaveReasons: [
      {
        heading: "A design frozen in the early 2000s",
        body: "Literotica's interface has barely changed since its launch. No dark mode, dense link lists, and a layout built for 800×600 monitors make for a frustrating read on any modern device.",
      },
      {
        heading: "Terrible mobile experience",
        body: "The site was never designed with phones in mind. Text overflows, navigation is clunky, and reading a long story on mobile is genuinely uncomfortable. Roughly 70% of internet users browse on mobile — Literotica serves none of them well.",
      },
      {
        heading: "Authors earn nothing",
        body: "Literotica's writers receive no financial reward for their work, no matter how popular their stories become. There's no tipping system, no subscriptions, and no way for readers to support the creators they love.",
      },
      {
        heading: "Spam comments and weak moderation",
        body: "The comment sections are plagued with low-effort, offensive, and bot-generated messages. Meaningful reader feedback is buried under noise, and there's no robust report or moderation system.",
      },
      {
        heading: "No proper reading lists or bookmarks",
        body: "Saving stories to read later is awkward and unreliable. There's no series-aware reading tracker, no 'continue reading' feature, and no way to organize your library.",
      },
      {
        heading: "Slow story submission and approval",
        body: "Authors regularly report multi-week waits for story approval with no communication or status updates. The submission queue is opaque and discourages new contributors.",
      },
    ],
    comparison: [
      { feature: "Dark mode", lustpages: "Native dark theme", competitor: "Not available", lustpagesWins: true },
      { feature: "Mobile design", lustpages: "Mobile-first, responsive", competitor: "Desktop-only layout", lustpagesWins: true },
      { feature: "Author earnings", lustpages: "Authors keep 80% of tips & earnings", competitor: "None — Literotica pays authors nothing", lustpagesWins: true },
      { feature: "Reading lists / bookmarks", lustpages: "Full bookmark system", competitor: "Basic / unreliable", lustpagesWins: true },
      { feature: "Series support", lustpages: "Full series pages with order", competitor: "Basic list only", lustpagesWins: true },
      { feature: "Story discovery", lustpages: "Tags, categories, collections", competitor: "Category lists only", lustpagesWins: true },
      { feature: "Comment quality", lustpages: "Moderated, threaded", competitor: "Unmoderated, noisy", lustpagesWins: true },
      { feature: "Free to read", lustpages: "Yes", competitor: "Yes", lustpagesWins: false },
      { feature: "Adult content", lustpages: "Yes", competitor: "Yes", lustpagesWins: false },
      { feature: "Story volume", lustpages: "500+ stories, growing daily", competitor: "Massive archive (25+ years)", lustpagesWins: false },
      { feature: "Story ratings", lustpages: "5-star ratings", competitor: "5-star ratings", lustpagesWins: false },
    ],
    lustpagesFeatures: [
      {
        heading: "Built for the way you actually read",
        body: "LustPages is designed mobile-first with a true dark theme, clean typography, and a distraction-free reading mode. Whether you're on a phone at night or a desktop in the afternoon, the experience is polished.",
      },
      {
        heading: "Support the authors you love",
        body: "Every story on LustPages has a tip button. Authors keep 80% of all tips and premium content earnings — Literotica pays authors nothing. Send coins to writers whose work moves you and give them a real income from their craft.",
      },
      {
        heading: "A library that organizes itself",
        body: "Save stories, track your place in a series, and build personal reading lists. LustPages remembers where you are so you don't have to.",
      },
      {
        heading: "Discovery that actually works",
        body: "Rich tagging, genre categories, curated editorial collections, and a trending section mean you find great stories in seconds — not after scrolling through pages of links.",
      },
    ],
    faqs: [
      {
        question: "Is LustPages completely free to use?",
        answer:
          "Yes. Reading the vast majority of stories on LustPages is completely free with no account required. Creating an account (also free) unlocks bookmarks, reading lists, ratings, and the ability to tip authors. Some authors publish premium chapters that require coins to unlock, but those are optional.",
      },
      {
        question: "Does LustPages have as many stories as Literotica?",
        answer:
          "Literotica has a 25-year head start and an enormous archive. LustPages is a newer platform with a growing, curated library that prioritises quality over raw volume. If you're looking for a specific niche, our tag and category system makes it easy to find what you want.",
      },
      {
        question: "Can I publish my own stories on LustPages?",
        answer:
          "Yes. Authors can apply for an author account, publish stories and series, and earn coins from reader tips and premium content. The submission and approval process is faster than most legacy platforms.",
      },
      {
        question: "Is there a mobile app for LustPages?",
        answer:
          "LustPages is a fully responsive Progressive Web App (PWA). You can add it to your home screen on iOS or Android for an app-like experience without downloading anything from an app store.",
      },
      {
        question: "What genres does LustPages cover?",
        answer:
          "LustPages covers all major adult fiction genres: romance, erotica, BDSM, fantasy, sci-fi, taboo, LGBTQ+, and more. Each genre has dedicated categories and curated collections to help you explore.",
      },
    ],
    verdict:
      "Literotica is a landmark site and its archive is genuinely impressive. But if you want to read adult fiction on a modern platform — one that respects your eyes, your phone, and the authors who create the content — LustPages is the natural next step.",
  },

  {
    slug: "ao3-alternative",
    competitor: "Archive of Our Own (AO3)",
    competitorUrl: "https://archiveofourown.org",
    headline: "Best AO3 Alternative for Original Adult Fiction",
    subheadline: "AO3 is the home of fan fiction. LustPages is the home of original adult stories.",
    metaTitle: "Best AO3 Alternative for Original Adult Fiction — LustPages",
    metaDescription:
      "Looking for an AO3 alternative focused on original adult fiction rather than fanfic? LustPages offers curated erotica, dark mode, author tips, and a clean reading experience.",
    keywords: [
      "ao3 alternative",
      "archive of our own alternative",
      "sites like ao3",
      "original adult fiction site",
      "ao3 for original stories",
      "adult fiction not fanfiction",
    ],
    intro:
      "Archive of Our Own is a remarkable achievement — a fan-run, nonprofit archive that has preserved millions of fan works. But if you're looking for original adult fiction that isn't tied to existing franchises, AO3's fanfic-first identity and overwhelming tag system can feel like the wrong tool for the job. LustPages is built specifically for original adult stories, with the curation and reading experience that AO3's mission doesn't prioritise.",
    whyLeaveReasons: [
      {
        heading: "Almost entirely fan fiction",
        body: "AO3 was built for transformative fan works. Original fiction exists there, but it's a small minority. If you want stories with original characters and worlds — not Harry Potter, not Marvel — you're swimming upstream.",
      },
      {
        heading: "Overwhelming tagging and filtering",
        body: "AO3's tagging system is famously powerful but also famously overwhelming. Finding quality original adult fiction among millions of fan works requires expertise with the filter system that new users simply don't have.",
      },
      {
        heading: "No author monetisation whatsoever",
        body: "AO3's nonprofit model means there is no mechanism for readers to tip authors or for authors to offer premium content. Writers who spend hundreds of hours on their work receive nothing but comment kudos.",
      },
      {
        heading: "Frequent server outages",
        body: "AO3 regularly buckles under traffic — especially around major fandom events. 'AO3 is down again' is a recurring complaint in every fandom community. It's a known infrastructure limitation of the nonprofit model.",
      },
      {
        heading: "No dark mode in the default skin",
        body: "AO3's default skin is a stark white. Dark mode requires users to install a custom site skin — a technical step many casual readers never discover.",
      },
      {
        heading: "Limited discovery for original content",
        body: "AO3's discovery tools are designed for navigating fandoms, not for finding original fiction by genre or mood. There's no editorial curation, no featured collections, no trending original content.",
      },
    ],
    comparison: [
      { feature: "Original adult fiction focus", lustpages: "Core focus", competitor: "Secondary to fanfic", lustpagesWins: true },
      { feature: "Dark mode", lustpages: "Native dark theme", competitor: "Requires custom skin", lustpagesWins: true },
      { feature: "Author earnings", lustpages: "Authors keep 80% of tips & earnings", competitor: "None", lustpagesWins: true },
      { feature: "Uptime / reliability", lustpages: "Consistent", competitor: "Frequent outages", lustpagesWins: true },
      { feature: "Editorial curation", lustpages: "Curated collections", competitor: "None", lustpagesWins: true },
      { feature: "Mobile experience", lustpages: "Mobile-first", competitor: "Functional but not optimised", lustpagesWins: true },
      { feature: "Story discovery", lustpages: "Genre, tags, trending", competitor: "Fandom-based filtering", lustpagesWins: true },
      { feature: "Free to use", lustpages: "Yes", competitor: "Yes", lustpagesWins: false },
      { feature: "Fan fiction archive", lustpages: "Not applicable", competitor: "Unmatched (8M+ works)", lustpagesWins: false },
      { feature: "Community reputation", lustpages: "Growing", competitor: "Established, beloved", lustpagesWins: false },
      { feature: "Explicit content policy", lustpages: "Explicitly supported", competitor: "Allowed but not featured", lustpagesWins: false },
    ],
    lustpagesFeatures: [
      {
        heading: "Original stories, original worlds",
        body: "Every story on LustPages is original fiction. No fandoms, no existing IP. Just writers building their own characters, worlds, and relationships — and readers discovering something genuinely new.",
      },
      {
        heading: "Editorial curation you can trust",
        body: "LustPages features hand-picked collections, a moderated approval process, and editorial highlights. You don't need to spend an hour filtering to find something worth reading.",
      },
      {
        heading: "Authors get paid",
        body: "Unlike AO3's purely voluntary model, LustPages lets readers send direct coin tips to authors and unlock premium chapters. Authors keep 80% of all tips and premium content earnings — writers who create the content you love can actually earn a real income from it.",
      },
      {
        heading: "Always on, always fast",
        body: "No traffic-driven outages. LustPages is built on modern infrastructure designed to handle peak load without the 'Error 429: Too Many Requests' screen that AO3 users know too well.",
      },
    ],
    faqs: [
      {
        question: "Can I find fan fiction on LustPages?",
        answer:
          "No — LustPages is focused exclusively on original adult fiction. If fan fiction is what you're after, AO3 remains the gold standard. But if you want original stories and characters, LustPages is the better choice.",
      },
      {
        question: "Is LustPages free like AO3?",
        answer:
          "Yes, reading on LustPages is free. A free account gives you bookmarks, ratings, and reading lists. Some authors publish premium chapters that cost coins to unlock, but the majority of content is freely accessible.",
      },
      {
        question: "How does content moderation work on LustPages compared to AO3?",
        answer:
          "LustPages reviews stories before they go live, maintaining a baseline quality standard. AO3 takes a more open approach — almost anything goes as long as it's legally permissible. LustPages's approach means a smaller but more consistently readable library.",
      },
      {
        question: "Do I need an account to read on LustPages?",
        answer:
          "No. You can browse and read most stories without creating an account. An account is required to bookmark stories, leave ratings, tip authors, or leave comments.",
      },
      {
        question: "What kind of adult fiction does LustPages specialise in?",
        answer:
          "LustPages covers the full spectrum of adult fiction genres: contemporary romance, dark romance, fantasy erotica, sci-fi, paranormal, BDSM, LGBTQ+, and more. The tag and category system makes it easy to find your preferred niche.",
      },
    ],
    verdict:
      "AO3 is the greatest fan fiction archive ever built, and that's worth celebrating. But for readers who want original adult fiction — not stories about existing characters — LustPages offers a focused, modern, and rewarding alternative.",
  },

  {
    slug: "wattpad-alternative",
    competitor: "Wattpad",
    competitorUrl: "https://www.wattpad.com",
    headline: "Best Wattpad Alternative for Adult Fiction in 2026",
    subheadline: "Wattpad banned explicit content. Here's where to read it.",
    metaTitle: "Best Wattpad Alternative for Adult Fiction — LustPages",
    metaDescription:
      "Wattpad removed explicit sexual content. LustPages is the best Wattpad alternative for adult romance and erotica — free, modern, and built for grown-up readers.",
    keywords: [
      "wattpad alternative",
      "wattpad alternative for adults",
      "wattpad adult content alternative",
      "sites like wattpad for adults",
      "wattpad replacement adult",
      "wattpad explicit content alternative",
    ],
    intro:
      "In 2020, Wattpad removed explicit sexual content from its platform, pushing millions of adult readers and authors off the site without warning. If you're one of them — or if you're simply looking for a platform where adult romance and erotica isn't treated as something to be hidden or removed — LustPages was built for you. It's everything Wattpad used to be for adult readers, built with the modern features Wattpad never got around to shipping.",
    whyLeaveReasons: [
      {
        heading: "Wattpad banned explicit adult content",
        body: "In 2020, Wattpad updated its content guidelines to prohibit explicit sexual content, effectively removing a huge category of stories and authors from the platform. Many users felt blindsided and betrayed by a platform they'd invested years building on.",
      },
      {
        heading: "The audience skews very young",
        body: "Wattpad's core demographic is teenagers and young adults. The platform's tone, community, and recommended content is calibrated for that audience — which is fine for YA fiction, but creates a poor environment for mature readers looking for adult content.",
      },
      {
        heading: "Wattpad Paid Stories puts popular content behind a paywall",
        body: "Many popular authors on Wattpad have moved their best content to Wattpad Paid Stories, requiring a paid subscription or per-story purchases. LustPages's free model is more generous to readers.",
      },
      {
        heading: "Inconsistent moderation and reporting",
        body: "Users regularly report that moderation is applied inconsistently — some content that clearly violates guidelines stays up for months, while other content is removed without clear explanation.",
      },
      {
        heading: "Discovery algorithms promote quantity over quality",
        body: "Wattpad's recommendation algorithm tends to surface the same mega-popular titles, making it hard for new authors to find an audience and hard for readers to discover fresh voices.",
      },
    ],
    comparison: [
      { feature: "Explicit adult content", lustpages: "Fully supported", competitor: "Banned since 2020", lustpagesWins: true },
      { feature: "Adult audience focus", lustpages: "Yes, 18+ platform", competitor: "Primarily teens/YA", lustpagesWins: true },
      { feature: "Author earnings", lustpages: "Authors keep 80% of tips & earnings", competitor: "Paid Stories (Wattpad takes cut)", lustpagesWins: true },
      { feature: "Free to read", lustpages: "Mostly free", competitor: "Partly paywalled (Paid Stories)", lustpagesWins: true },
      { feature: "Dark mode", lustpages: "Native dark theme", competitor: "Available", lustpagesWins: false },
      { feature: "Mobile app", lustpages: "Responsive PWA", competitor: "Native iOS/Android app", lustpagesWins: false },
      { feature: "Community size", lustpages: "Growing", competitor: "Very large, established", lustpagesWins: false },
      { feature: "Story volume", lustpages: "500+ stories, growing daily", competitor: "Enormous (billion+ reads)", lustpagesWins: false },
      { feature: "Content moderation", lustpages: "Pre-approval review", competitor: "Post-publication review", lustpagesWins: true },
      { feature: "Series support", lustpages: "Full series pages", competitor: "Part-based stories", lustpagesWins: false },
    ],
    lustpagesFeatures: [
      {
        heading: "Adult content is the whole point",
        body: "LustPages is an 18+ platform designed around adult fiction. There's no risk of your favourite authors being removed, no content going behind an unexpected paywall, and no algorithm quietly downranking mature content.",
      },
      {
        heading: "Tip your favourite authors directly",
        body: "When you find a story you love, you can send coins directly to the author. Authors keep 80% of all tips and premium content earnings — far more than Wattpad's revenue share. It's the most direct way to support independent creators and keep them writing.",
      },
      {
        heading: "No Paid Stories paywall surprises",
        body: "Authors on LustPages choose what to make free and what to lock behind premium chapters. You always know upfront what's available to read before you start.",
      },
      {
        heading: "Curated for quality",
        body: "Stories are reviewed before publication, which maintains a higher baseline quality than open-submission platforms. Editorial collections highlight the best work across every genre.",
      },
    ],
    faqs: [
      {
        question: "Why did Wattpad remove adult content?",
        answer:
          "Wattpad made the decision in 2020 as part of a brand repositioning, likely influenced by advertiser pressure and their plans to sell the company (which was later acquired by Naver). The change was poorly communicated and upset a large portion of their author community.",
      },
      {
        question: "Can I import my Wattpad stories to LustPages?",
        answer:
          "LustPages doesn't currently have a direct import tool, but you can publish any original fiction you own. If you've written stories on Wattpad, you're free to re-publish them on LustPages as long as you hold the rights.",
      },
      {
        question: "Is LustPages safe to use?",
        answer:
          "Yes. LustPages is an 18+ platform that takes user privacy seriously. We don't sell personal data, and all payment and account information is handled securely. No credit card is required to read.",
      },
      {
        question: "Does LustPages have a mobile app like Wattpad?",
        answer:
          "LustPages is a full-featured Progressive Web App (PWA). You can add it to your home screen on iPhone or Android for a native app-like experience — without going through an app store or using storage space.",
      },
      {
        question: "What genres does LustPages offer?",
        answer:
          "LustPages covers dark romance, contemporary erotica, paranormal romance, fantasy, LGBTQ+, BDSM, and many more adult fiction genres. Each category has its own curated section and tag-based discovery.",
      },
    ],
    verdict:
      "Wattpad's decision to remove explicit content in 2020 left millions of adult readers without a home. LustPages was built to fill that gap — a modern, mobile-friendly platform where adult fiction is welcomed, curated, and celebrated.",
  },

  {
    slug: "adult-fanfiction-alternative",
    competitor: "Adult-FanFiction.org (AFF)",
    competitorUrl: "https://www.adult-fanfiction.org",
    headline: "Best Adult-FanFiction.org Alternative in 2026",
    subheadline: "AFF hasn't been updated since 2006. LustPages was built for 2026.",
    metaTitle: "Best Adult FanFiction Alternative (AFF) in 2026 — LustPages",
    metaDescription:
      "Looking for an adult-fanfiction.org alternative with a modern design and working mobile experience? LustPages offers original adult fiction with a clean UI, author tips, and no broken links.",
    keywords: [
      "adult fanfiction alternative",
      "aff alternative",
      "adult-fanfiction.org alternative",
      "sites like adult fanfiction",
      "adult fanfiction site modern",
      "better than adult fanfiction org",
    ],
    intro:
      "Adult-FanFiction.org (AFF) has been around since the early 2000s and carries a sizeable archive of adult fan works. But the site looks and functions exactly as it did when George W. Bush was president — no dark mode, a layout that predates the iPhone, and a mobile experience that is genuinely broken. If you're done fighting with a website that time forgot, LustPages offers a clean, modern home for adult fiction readers.",
    whyLeaveReasons: [
      {
        heading: "A design from 2003 that hasn't been updated",
        body: "AFF's interface is one of the most dated on the internet. Tiny fonts, frames-era navigation, no visual hierarchy, and a colour scheme that feels like a relic of early internet. Using it in 2026 is a study in friction.",
      },
      {
        heading: "Completely broken on mobile",
        body: "AFF was never designed for mobile devices and has never been retrofitted for them. Text is illegible without zooming, navigation requires precise taps on tiny links, and the reading experience is painful.",
      },
      {
        heading: "No dark mode whatsoever",
        body: "There's no dark mode option, no theme customisation, and no reading comfort settings. The default white background at full brightness is the only option — a problem for night readers.",
      },
      {
        heading: "Abandoned stories everywhere",
        body: "AFF has been around so long that the majority of its library consists of stories that haven't been updated in a decade or more. Finding active, ongoing stories requires significant effort.",
      },
      {
        heading: "No author support or community tools",
        body: "Authors on AFF receive no financial support, no analytics, and no meaningful community tools. There's no way for readers to tip, and comments are sparse and low-quality.",
      },
      {
        heading: "Poor discovery and search",
        body: "AFF's search function is rudimentary and often returns irrelevant results. There are no curated collections, no trending sections, and no recommendation engine to help you find something new.",
      },
    ],
    comparison: [
      { feature: "Modern design", lustpages: "Clean, modern UI", competitor: "Early-2000s design", lustpagesWins: true },
      { feature: "Mobile experience", lustpages: "Mobile-first, responsive", competitor: "Broken on mobile", lustpagesWins: true },
      { feature: "Dark mode", lustpages: "Native dark theme", competitor: "Not available", lustpagesWins: true },
      { feature: "Author earnings", lustpages: "Authors keep 80% of tips & earnings", competitor: "None", lustpagesWins: true },
      { feature: "Story discovery", lustpages: "Tags, categories, collections", competitor: "Basic category lists", lustpagesWins: true },
      { feature: "Active stories", lustpages: "Curated, actively updated", competitor: "Mostly abandoned", lustpagesWins: true },
      { feature: "Search quality", lustpages: "Full-text, tag-based", competitor: "Basic title search", lustpagesWins: true },
      { feature: "Free to read", lustpages: "Yes", competitor: "Yes", lustpagesWins: false },
      { feature: "Adult content", lustpages: "Yes", competitor: "Yes", lustpagesWins: false },
      { feature: "Fan fiction archive", lustpages: "Not applicable", competitor: "Large archive", lustpagesWins: false },
    ],
    lustpagesFeatures: [
      {
        heading: "A reading experience from this decade",
        body: "LustPages is designed with readability as the first priority. Dark theme, comfortable font sizes, generous line spacing, and a clean layout that works on any device — phone, tablet, or desktop.",
      },
      {
        heading: "Active, curated content",
        body: "Every story on LustPages goes through an approval process. Combined with a growing community of active authors, you'll find stories that are actually being updated — not abandoned in 2011.",
      },
      {
        heading: "Help authors keep writing",
        body: "LustPages lets readers send coin tips directly to authors — and authors keep 80% of all tips and premium content earnings. AFF has no such system at all. For writers, it's a meaningful income. For readers, it's the most direct way to show appreciation.",
      },
      {
        heading: "Actually find what you're looking for",
        body: "Rich tags, genre categories, curated collections, and a working search engine mean you can find stories matching your exact interests in seconds.",
      },
    ],
    faqs: [
      {
        question: "Does LustPages have fan fiction like AFF?",
        answer:
          "LustPages focuses on original adult fiction — stories with original characters and worlds rather than fan works based on existing properties. If original fiction is what you want, LustPages is ideal. For fan fiction specifically, AO3 remains the strongest option.",
      },
      {
        question: "Is LustPages better for mobile than AFF?",
        answer:
          "Significantly. LustPages is built mobile-first — every page, every story, every feature is designed to work perfectly on a phone. AFF was never designed for mobile and hasn't been updated to work on modern devices.",
      },
      {
        question: "How is story quality maintained on LustPages?",
        answer:
          "Stories are reviewed by the LustPages team before publication. This pre-publication review ensures a baseline quality standard — better grammar, complete stories, and content that meets community guidelines.",
      },
      {
        question: "Can I read on LustPages without signing up?",
        answer:
          "Yes. The majority of stories on LustPages are freely readable without an account. Signing up (free) gives you bookmarks, reading lists, ratings, and the ability to tip authors.",
      },
      {
        question: "How often is new content added to LustPages?",
        answer:
          "New stories and chapters are added regularly as authors publish their work. Unlike AFF's archive of mostly dormant content, LustPages features an active and growing community of writers publishing new work continuously.",
      },
    ],
    verdict:
      "Adult-FanFiction.org built something important in the early internet era, but it hasn't kept up. If you want to read adult fiction on a site that works on your phone, doesn't hurt your eyes, and supports the authors who create the content — LustPages is the upgrade you've been waiting for.",
  },
];

export const alternativesBySlug = Object.fromEntries(
  alternatives.map((a) => [a.slug, a])
);

export const allAlternativeSlugs = alternatives.map((a) => a.slug);

export default alternatives;
