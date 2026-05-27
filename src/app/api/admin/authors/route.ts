import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

function makeSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const authors = await prisma.author.findMany({
    include: {
      _count: { select: { stories: true } },
      user: { select: { email: true } },
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(authors);
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, slug, bio, image, website } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const finalSlug = (slug?.trim() || makeSlug(name)).replace(/\s+/g, "-");
  if (!finalSlug) return NextResponse.json({ error: "Could not generate slug" }, { status: 400 });

  try {
    const author = await prisma.author.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        bio: bio?.trim() || null,
        image: image?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        _count: { select: { stories: true } },
        user: { select: { email: true } },
      },
    });
    return NextResponse.json(author, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
