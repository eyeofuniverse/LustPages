import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clearSynonymCache } from "@/lib/search";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { synonyms, isActive, type } = await req.json();

  const data: Record<string, unknown> = {};
  if (Array.isArray(synonyms)) data.synonyms = (synonyms as string[]).map((s) => s.trim()).filter(Boolean);
  if (typeof isActive === "boolean") data.isActive = isActive;
  if (type === "TOKEN" || type === "PHRASE") data.type = type;

  try {
    const row = await prisma.searchSynonym.update({ where: { id }, data });
    clearSynonymCache();
    return NextResponse.json(row);
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("PUT /api/admin/search-synonyms/[id]", e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    await prisma.searchSynonym.delete({ where: { id } });
    clearSynonymCache();
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    if ((e as { code?: string })?.code === "P2025") return NextResponse.json({ error: "Not found" }, { status: 404 });
    console.error("DELETE /api/admin/search-synonyms/[id]", e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
