import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

// POST: add a story to the collection
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: collectionId } = await params;
  const { storyId, editorialNote } = await req.json();

  if (!storyId) return NextResponse.json({ error: "storyId required" }, { status: 400 });

  const maxPos = await prisma.collectionStory.aggregate({
    where: { collectionId },
    _max: { position: true },
  });
  const position = (maxPos._max.position ?? -1) + 1;

  try {
    const entry = await prisma.collectionStory.create({
      data: { collectionId, storyId, position, editorialNote: editorialNote || null },
    });
    // touch updatedAt on collection
    await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Story already in collection or not found" }, { status: 409 });
  }
}

// PATCH: reorder stories
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: collectionId } = await params;
  const { order }: { order: string[] } = await req.json(); // array of collectionStory IDs in new order

  await Promise.all(
    order.map((csId, position) =>
      prisma.collectionStory.update({ where: { id: csId }, data: { position } })
    )
  );
  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
