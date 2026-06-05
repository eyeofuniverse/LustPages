import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const BASE = "https://lustpages.com";

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
      { error: "GEMINI_API_KEY is not configured in environment variables." },
      { status: 500 }
    );
  }

  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { slug: true, published: true },
  });

  if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
  if (!story.published) {
    return NextResponse.json(
      { error: "Story must be published before AI tagging. Publish it first, then run the AI Tagger." },
      { status: 400 }
    );
  }

  const storyUrl = `${BASE}/stories/${story.slug}`;

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.tag.findMany({
      where: { isApproved: true },
      select: { id: true, name: true, tier: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
  ]);

  const prompt = `You are an expert SEO content tagger for LustPages, an adult fiction website.

Visit and fully read this published story: ${storyUrl}

Based on what you read, select the most accurate and SEO-optimized categories and tags from the lists below.

AVAILABLE CATEGORIES (select 1–3 best fits):
${JSON.stringify(categories)}

AVAILABLE TAGS:
Tier 1 — Subgenre (broad genre classification):
${JSON.stringify(tags.filter(t => t.tier === 1).map(t => ({ id: t.id, name: t.name })))}

Tier 2 — Tropes & Hooks (relationship dynamics, story hooks):
${JSON.stringify(tags.filter(t => t.tier === 2).map(t => ({ id: t.id, name: t.name })))}

Tier 3 — Content & Kink (explicit content descriptors):
${JSON.stringify(tags.filter(t => t.tier === 3).map(t => ({ id: t.id, name: t.name })))}

SEO RULES — STRICTLY FOLLOW:
1. PREFER MID-TAIL keywords (2–3 word phrases, e.g. "forbidden office romance", "boss employee affair") over single-word generic tags
2. PREFER LONG-TAIL keywords (3–5 word phrases, e.g. "enemies to lovers workplace romance", "taboo stepfamily forbidden desire") — these rank faster and attract intent-driven readers
3. Pick tags that match how real readers search Google for adult fiction — think search intent, not just topic labels
4. For newTagSuggestions: ONLY suggest mid-tail or long-tail keyword phrases with genuine search demand. Format them as natural search terms people actually type. Do NOT suggest vague single words.
5. Specificity beats genericness — a niche tag that perfectly describes the story is worth more than a broad tag that loosely fits

Return your answer as a JSON object inside a markdown code block:
\`\`\`json
{"suggestedCategoryIds":["..."],"suggestedTagIds":["..."],"newTagSuggestions":[{"name":"...","tier":2,"reason":"why this phrase has search demand"}]}
\`\`\``;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      // urlContext lets Gemini fetch and read the live story page itself.
      // responseMimeType is intentionally omitted — it conflicts with tool-use responses.
      config: {
        tools: [{ urlContext: {} }],
      },
    });

    const raw = response.text ?? "";
    // Extract JSON from a code fence if present, otherwise parse as-is
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = fenceMatch ? fenceMatch[1].trim() : raw.trim();

    const parsed = JSON.parse(jsonStr) as {
      suggestedCategoryIds: string[];
      suggestedTagIds: string[];
      newTagSuggestions: { name: string; tier: number; reason: string }[];
    };

    const validCategoryIds = new Set(categories.map(c => c.id));
    const validTagIds = new Set(tags.map(t => t.id));

    return NextResponse.json({
      suggestedCategoryIds: (parsed.suggestedCategoryIds ?? []).filter(id => validCategoryIds.has(id)),
      suggestedTagIds: (parsed.suggestedTagIds ?? []).filter(id => validTagIds.has(id)),
      newTagSuggestions: (parsed.newTagSuggestions ?? []).filter(
        (t: { name: string; tier: number }) =>
          typeof t.name === "string" && t.name.trim().length > 0 && [1, 2, 3].includes(t.tier)
      ),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[ai-suggest]", message);
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
