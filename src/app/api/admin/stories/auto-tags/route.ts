import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesText(term: string, text: string): boolean {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Multi-word terms: plain substring match
  if (/\s/.test(term)) {
    return text.toLowerCase().includes(term.toLowerCase());
  }
  // Single-word terms: word-boundary match to avoid partial hits
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title = "", content = "" } = await req.json();
  if (!title && !content) {
    return NextResponse.json({ matched: [] });
  }

  const plainText = `${title} ${stripHtml(content)}`;

  const tags = await prisma.tag.findMany({
    where: { isApproved: true },
    select: {
      id: true,
      name: true,
      slug: true,
      tier: true,
      description: true,
      aliases: { select: { alias: true } },
    },
  });

  const matched = tags.filter(
    (tag) =>
      matchesText(tag.name, plainText) ||
      tag.aliases.some((a) => matchesText(a.alias, plainText))
  );

  return NextResponse.json({ matched });
}
