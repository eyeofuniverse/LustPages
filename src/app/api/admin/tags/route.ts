import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTag, INITIAL_TAGS, applyKeywordRulesToTag } from "@/lib/tags-db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const tags = await prisma.tag.findMany({
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: { _count: { select: { stories: true } }, aliases: { select: { id: true, alias: true } } },
  });
  return NextResponse.json(tags);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, tier, description, isApproved = true, isKeyword = false } = await req.json();
  if (!name?.trim() || !tier) return NextResponse.json({ error: "name and tier required" }, { status: 400 });
  const slug = slugifyTag(name);
  const aliasConflict = await prisma.tagAlias.findUnique({ where: { alias: slug }, select: { tag: { select: { name: true } } } });
  if (aliasConflict) {
    return NextResponse.json({ error: `"${slug}" is already an alias of "${aliasConflict.tag.name}" — choose a different name or merge instead` }, { status: 409 });
  }
  try {
    const tag = await prisma.tag.create({ data: { name: name.trim(), slug, tier: Number(tier), description, isApproved, isKeyword: !!isKeyword } });
    if (isApproved && !isKeyword) await applyKeywordRulesToTag(tag.id, tag.name);
    return NextResponse.json(tag, { status: 201 });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "A tag with that name already exists" }, { status: 409 });
    console.error("POST /api/admin/tags", e);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}

// One-time seed endpoint
export async function PUT() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const count = await prisma.tag.count();
  if (count > 0) return NextResponse.json({ message: "Tag library already seeded", count });

  const created = await prisma.tag.createMany({
    data: INITIAL_TAGS.map((t) => ({ name: t.name, slug: t.slug, tier: t.tier, description: t.description })),
    skipDuplicates: true,
  });
  return NextResponse.json({ message: "Seeded", created: created.count });
}
