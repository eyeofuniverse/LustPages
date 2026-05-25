import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, authorId, description } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const role = (session.user as { role?: string })?.role;

  let resolvedAuthorId = authorId as string | undefined;
  if (role !== "admin") {
    const author = await prisma.author.findUnique({ where: { userId: session.user.id } });
    if (!author) return NextResponse.json({ error: "No author profile" }, { status: 403 });
    resolvedAuthorId = author.id;
  }

  if (!resolvedAuthorId) {
    return NextResponse.json({ error: "Author ID required" }, { status: 400 });
  }

  const baseSlug = slugify(name.trim());
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.series.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const series = await prisma.series.create({
    data: {
      name: name.trim(),
      slug,
      description: (description as string | undefined)?.trim() || null,
      authorId: resolvedAuthorId,
    },
    include: { _count: { select: { stories: true } } },
  });

  return NextResponse.json(
    {
      id: series.id,
      name: series.name,
      slug: series.slug,
      storyCount: series._count.stories,
      nextChapter: 1,
    },
    { status: 201 }
  );
}
