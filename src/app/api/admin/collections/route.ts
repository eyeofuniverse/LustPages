import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAdminCollections } from "@/lib/queries";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const collections = await getAdminCollections();
  return NextResponse.json(collections);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { slug, title, description, metaDescription, coverImage, type, featured, published, sortOrder } = body;

  if (!slug || !title) return NextResponse.json({ error: "slug and title are required" }, { status: 400 });

  const existing = await prisma.collection.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "A collection with this slug already exists" }, { status: 409 });

  const collection = await prisma.collection.create({
    data: {
      slug,
      title,
      description: description || null,
      metaDescription: metaDescription || null,
      coverImage: coverImage || null,
      type: type ?? "editorial",
      featured: !!featured,
      published: published !== false,
      sortOrder: sortOrder ?? 0,
    },
  });

  return NextResponse.json(collection, { status: 201 });
}
