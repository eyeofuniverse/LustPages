import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSynonymCache } from "@/lib/search";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

function normalizeTerm(term: string) {
  return term.trim().toLowerCase().replace(/[-\s]+/g, "");
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await prisma.searchSynonym.findMany({
    orderBy: [{ type: "asc" }, { term: "asc" }],
  });
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { term, type, synonyms } = await req.json();
  if (!term?.trim()) return NextResponse.json({ error: "term is required" }, { status: 400 });
  if (!["TOKEN", "PHRASE"].includes(type)) return NextResponse.json({ error: "type must be TOKEN or PHRASE" }, { status: 400 });
  if (!Array.isArray(synonyms) || synonyms.length === 0) return NextResponse.json({ error: "synonyms must be a non-empty array" }, { status: 400 });

  const normalizedTerm = normalizeTerm(term);
  const cleanSynonyms = (synonyms as string[]).map((s) => s.trim()).filter(Boolean);

  try {
    const row = await prisma.searchSynonym.create({
      data: { term: normalizedTerm, type, synonyms: cleanSynonyms },
    });
    clearSynonymCache();
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2002") {
      return NextResponse.json({ error: `Term "${normalizedTerm}" already exists` }, { status: 409 });
    }
    console.error("POST /api/admin/search-synonyms", e);
    return NextResponse.json({ error: "Failed to create synonym group" }, { status: 500 });
  }
}
