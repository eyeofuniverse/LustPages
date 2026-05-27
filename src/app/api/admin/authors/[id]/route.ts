import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { name, slug, bio, image, website } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  try {
    const author = await prisma.author.update({
      where: { id },
      data: {
        name: name.trim(),
        ...(slug?.trim() && { slug: slug.trim() }),
        bio: bio?.trim() || null,
        image: image?.trim() || null,
        website: website?.trim() || null,
      },
      include: {
        _count: { select: { stories: true } },
        user: { select: { email: true } },
      },
    });
    return NextResponse.json(author);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const author = await prisma.author.findUnique({
    where: { id },
    include: { _count: { select: { stories: true } } },
  });
  if (!author) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (author._count.stories > 0) {
    return NextResponse.json(
      { error: `Cannot delete: author has ${author._count.stories} ${author._count.stories === 1 ? "story" : "stories"}. Reassign them first.` },
      { status: 400 }
    );
  }

  await prisma.author.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
