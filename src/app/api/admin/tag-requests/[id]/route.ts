import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { applyKeywordRulesToTag } from "@/lib/tags-db";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action, adminNote, mergedIntoTagId } = await req.json();

  const request = await prisma.tagRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") {
    // Create the tag from the request
    const existing = await prisma.tag.findUnique({ where: { slug: request.slug } });
    if (existing) return NextResponse.json({ error: "Tag slug already exists" }, { status: 409 });
    const newTag = await prisma.tag.create({
      data: { name: request.requestedName, slug: request.slug, tier: request.tier, isApproved: true },
    });
    await applyKeywordRulesToTag(newTag.id, newTag.name);
    const updated = await prisma.tagRequest.update({
      where: { id },
      data: { status: "approved", adminNote, mergedIntoTagId: newTag.id, updatedAt: new Date() },
    });
    return NextResponse.json({ request: updated, tag: newTag });
  }

  if (action === "merge" && mergedIntoTagId) {
    // Add the request's slug as an alias for the target tag
    await prisma.tagAlias.upsert({
      where: { alias: request.slug },
      update: {},
      create: { alias: request.slug, tagId: mergedIntoTagId },
    });
    const updated = await prisma.tagRequest.update({
      where: { id },
      data: { status: "merged", mergedIntoTagId, adminNote, updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  if (action === "reject") {
    const updated = await prisma.tagRequest.update({
      where: { id },
      data: { status: "rejected", adminNote, updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.tagRequest.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
