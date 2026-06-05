import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const BASE = "https://lustpages.com";

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
      { error: "GEMINI_API_KEY is not configured in environment variables." },
      { status: 500 }
    );
  }

  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { slug: true, published: true, title: true, excerpt: true, content: true },
  });

  if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
  if (!story.published) {
    return NextResponse.json(
      { error: "Story must be published before AI tagging. Publish it first, then run the AI Tagger." },
      { status: 400 }
    );
  }

  const storyUrl = `${BASE}/stories/${story.slug}`;

  // Fetch published page content from the live URL so Gemini receives what
  // readers see, not raw DB fields. Falls back to DB content if fetch fails.
  let storyText = "";
  try {
    const pageRes = await fetch(storyUrl, {
      headers: { "User-Agent": "LustPages-AdminBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (pageRes.ok) {
      const html = await pageRes.text();
      storyText = stripHtml(html).slice(0, 8000);
    }
  } catch {
    // fall through to DB fallback
  }

  if (!storyText) {
    // Fallback: use DB content directly (same text, just not fetched via HTTP)
    storyText = `${story.title}\n\n${story.excerpt}\n\n${stripHtml(story.content ?? "")}`.slice(0, 8000);
  }

  const [categories, tags] = await Promise.all([
    prisma.category.findMany({ select: { id: true, name: true } }),
    prisma.tag.findMany({
      where: { isApproved: true },
      select: { id: true, name: true, tier: true },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
    }),
  ]);

  const prompt = `You are an expert SEO content tagger for LustPages, an adult fiction website.

Story URL: ${storyUrl}

Story content:
${storyText}

Based on the story above, select the most accurate and SEO-optimized categories and tags from the lists below.

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
4. For newTagSuggestions: ONLY suggest mid-tail or long-tail keyword phrases with genuine search demand. Do NOT suggest vague single words.
5. Specificity beats genericness — a niche tag that perfectly describes the story outranks a broad tag that loosely fits

Return ONLY a valid JSON object, nothing else:
{"suggestedCategoryIds":["..."],"suggestedTagIds":["..."],"newTagSuggestions":[{"name":"...","tier":2,"reason":"why this phrase has search demand"}]}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const raw = response.text ?? "";

    if (!raw.trim()) {
      return NextResponse.json(
        { error: "Gemini returned an empty response. Check that GEMINI_API_KEY is valid." },
        { status: 500 }
      );
    }

    // Extract JSON — code fence first, then bare object, then full raw
    let jsonStr = raw.trim();
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    } else {
      const objMatch = raw.match(/\{[\s\S]*\}/);
      if (objMatch) jsonStr = objMatch[0].trim();
    }

    let parsed: {
      suggestedCategoryIds: string[];
      suggestedTagIds: string[];
      newTagSuggestions: { name: string; tier: number; reason: string }[];
    };

    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[ai-suggest] JSON parse failed. Raw:\n", raw);
      return NextResponse.json(
        { error: `Gemini response was not valid JSON: ${raw.slice(0, 300)}` },
        { status: 500 }
      );
    }

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
    console.error("[ai-suggest] error:", message);
    return NextResponse.json(
      { error: `AI analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
