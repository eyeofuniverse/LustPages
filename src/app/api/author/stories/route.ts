import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuthor() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
  });
  return author;
}

export async function POST(req: Request) {
  const author = await requireAuthor();
  if (!author) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { categoryIds, tagIds, action, coinPrice: incomingCoinPrice, ...data } = await req.json();
    const status = action === "submit" ? "pending" : "draft";
    // Series stories cannot have individual coin prices — premium is series-level
    const coinPrice = data.seriesId ? null : (incomingCoinPrice ?? null);
    const story = await prisma.story.create({
      data: {
        ...data,
        coinPrice,
        authorId: author.id,
        published: false,
        status,
        submittedAt: status === "pending" ? new Date() : null,
        categories: {
          connect: (categoryIds as string[]).map((id) => ({ id })),
        },
        storyTags: tagIds?.length
          ? { connect: (tagIds as string[]).map((id) => ({ id })) }
          : undefined,
      },
    });
    return NextResponse.json(story, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
