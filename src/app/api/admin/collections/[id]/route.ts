import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAdminCollectionById } from "@/lib/queries";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const collection = await getAdminCollectionById(id);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(collection);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const { slug, title, description, metaDescription, coverImage, type, featured, published, sortOrder } = body;

  const data: Record<string, unknown> = {};
  if (slug !== undefined) data.slug = slug;
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (metaDescription !== undefined) data.metaDescription = metaDescription || null;
  if (coverImage !== undefined) data.coverImage = coverImage || null;
  if (type !== undefined) data.type = type;
  if (featured !== undefined) data.featured = !!featured;
  if (published !== undefined) data.published = !!published;
  if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10) || 0;

  try {
    const updated = await prisma.collection.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Not found or slug conflict" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.collection.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
