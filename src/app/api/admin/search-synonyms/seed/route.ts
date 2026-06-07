import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSynonymCache, DEFAULT_TOKEN_SYNONYMS, DEFAULT_PHRASE_SYNONYMS } from "@/lib/search";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function POST() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let created = 0;
  let skipped = 0;

  const all = [
    ...DEFAULT_TOKEN_SYNONYMS.map((d) => ({ ...d, type: "TOKEN" as const })),
    ...DEFAULT_PHRASE_SYNONYMS.map((d) => ({ ...d, type: "PHRASE" as const })),
  ];

  for (const entry of all) {
    try {
      await prisma.searchSynonym.create({
        data: { term: entry.term, type: entry.type, synonyms: entry.synonyms },
      });
      created++;
    } catch (e: unknown) {
      // P2002 = unique constraint — term already exists, skip
      if ((e as { code?: string })?.code === "P2002") { skipped++; continue; }
      throw e;
    }
  }

  clearSynonymCache();
  return NextResponse.json({ created, skipped });
}
