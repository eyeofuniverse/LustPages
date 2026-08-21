import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuthor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const author = await prisma.author.findUnique({ where: { userId: session.user.id } });
  return author;
}

export async function GET() {
  const author = await requireAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({
    name: author.name,
    bio: author.bio,
    image: author.image,
    website: author.website,
  });
}

export async function PATCH(req: Request) {
  const author = await requireAuthor();
  if (!author) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, bio, image, website } = await req.json();

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json({ error: "Display name cannot be empty." }, { status: 400 });
    }
    if (name !== undefined && name.trim().length > 80) {
      return NextResponse.json({ error: "Display name must be 80 characters or fewer." }, { status: 400 });
    }
    if (bio !== undefined && typeof bio === "string" && bio.length > 1000) {
      return NextResponse.json({ error: "Bio must be 1000 characters or fewer." }, { status: 400 });
    }
    if (website !== undefined && website !== null && website !== "" && typeof website === "string") {
      try { new URL(website); } catch {
        return NextResponse.json({ error: "Website must be a valid URL." }, { status: 400 });
      }
    }

    const updates: Record<string, string | null> = {};
    if (name !== undefined) updates.name = name.trim();
    if (bio !== undefined) updates.bio = bio?.trim() || null;
    if (image !== undefined) updates.image = image?.trim() || null;
    if (website !== undefined) updates.website = website?.trim() || null;

    const updated = await prisma.author.update({
      where: { id: author.id },
      data: updates,
      select: { name: true, bio: true, image: true, website: true },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
