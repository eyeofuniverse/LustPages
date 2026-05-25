import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

// PATCH: update editorial note for a story in the collection
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: collectionId, storyId } = await params;
  const { editorialNote } = await req.json();

  const entry = await prisma.collectionStory.findUnique({
    where: { collectionId_storyId: { collectionId, storyId } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.collectionStory.update({
    where: { id: entry.id },
    data: { editorialNote: editorialNote || null },
  });
  return NextResponse.json(updated);
}

// DELETE: remove a story from the collection
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; storyId: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id: collectionId, storyId } = await params;

  const entry = await prisma.collectionStory.findUnique({
    where: { collectionId_storyId: { collectionId, storyId } },
  });
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.collectionStory.delete({ where: { id: entry.id } });
  await prisma.collection.update({ where: { id: collectionId }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
