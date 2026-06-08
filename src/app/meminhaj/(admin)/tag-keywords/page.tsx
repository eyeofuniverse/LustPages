import { getAdminTags } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { TagKeywordRulesManager } from "@/components/admin/TagKeywordRulesManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tag Keyword Rules — Admin" };

export default async function TagKeywordsPage() {
  const [rules, tags] = await Promise.all([
    prisma.tagKeywordRule.findMany({
      include: { parentTag: { select: { id: true, name: true, slug: true } } },
      orderBy: { keyword: "asc" },
    }),
    getAdminTags(),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Tag Keyword Rules
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {rules.length} rule{rules.length !== 1 ? "s" : ""} — automatically assign parent tags based on keywords in tag names
        </p>
      </div>
      <TagKeywordRulesManager initialRules={rules} tags={tags} />
    </div>
  );
}
