import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set in environment variables." },
      { status: 500 }
    );
  }

  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { title: true, excerpt: true, content: true },
  });
  if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.tag.findMany({
      where: { isApproved: true },
      select: { id: true, name: true, tier: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
  ]);

  const plainContent = stripHtml(story.content ?? "").slice(0, 4000);

  const prompt = `You are an expert content tagger for LustPages, an adult fiction website.
Your job: assign accurate, SEO-optimized categories and tags to a story.

STORY TITLE: ${story.title}
STORY EXCERPT: ${story.excerpt}
STORY CONTENT (opening excerpt): ${plainContent}

AVAILABLE CATEGORIES (pick 1–3 most fitting):
${JSON.stringify(categories)}

AVAILABLE TAGS:
Tier 1 — Subgenre (broad genre, e.g. Dark Romance, Contemporary):
${JSON.stringify(tags.filter(t => t.tier === 1).map(t => ({ id: t.id, name: t.name })))}

Tier 2 — Tropes & Hooks (relationship dynamics, e.g. Enemies to Lovers, Age Gap):
${JSON.stringify(tags.filter(t => t.tier === 2).map(t => ({ id: t.id, name: t.name })))}

Tier 3 — Content & Kink (explicit descriptors, e.g. BDSM, Public Sex):
${JSON.stringify(tags.filter(t => t.tier === 3).map(t => ({ id: t.id, name: t.name })))}

RULES:
- Choose 1–3 categories that genuinely fit the story's genre
- Choose 3–8 tags across tiers. Prioritize tags readers actually search for (high SEO value)
- In newTagSuggestions include ONLY tags that are missing from the lists above AND have clear SEO search demand for adult fiction. Keep it to 0–4 max.
- New tag names must be concise (1–4 words), follow the tier logic, and be reusable across stories

Return ONLY valid JSON, no markdown, no code fences:
{"suggestedCategoryIds":["..."],"suggestedTagIds":["..."],"newTagSuggestions":[{"name":"...","tier":2,"reason":"..."}]}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const clean = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(clean) as {
      suggestedCategoryIds: string[];
      suggestedTagIds: string[];
      newTagSuggestions: { name: string; tier: number; reason: string }[];
    };

    // Validate IDs exist before returning
    const validCategoryIds = new Set(categories.map(c => c.id));
    const validTagIds = new Set(tags.map(t => t.id));

    return NextResponse.json({
      suggestedCategoryIds: (parsed.suggestedCategoryIds ?? []).filter(id => validCategoryIds.has(id)),
      suggestedTagIds: (parsed.suggestedTagIds ?? []).filter(id => validTagIds.has(id)),
      newTagSuggestions: (parsed.newTagSuggestions ?? []).filter(
        t => typeof t.name === "string" && [1, 2, 3].includes(t.tier)
      ),
    });
  } catch (err) {
    console.error("[ai-suggest]", err);
    return NextResponse.json(
      { error: "AI analysis failed. Check your GEMINI_API_KEY and try again." },
      { status: 500 }
    );
  }
}
