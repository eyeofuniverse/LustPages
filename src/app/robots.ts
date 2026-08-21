import { MetadataRoute } from "next";

const BASE = "https://lustpages.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/stories/",
          "/series/",
          "/authors/",
          "/categories/",
          "/tags/",
          "/search",
          "/premium/",
          "/store",
          "/collections/",
          "/alternatives/",
        ],
        disallow: [
          "/api/",
          "/profile/",
          "/author-dashboard/",
          "/login",
          "/register",
        ],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "CCBot",
          "anthropic-ai",
          "Claude-Web",
          "cohere-ai",
          "Google-Extended",
          "PerplexityBot",
        ],
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
