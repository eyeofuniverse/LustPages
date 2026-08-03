import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { awardBadgesAsync } from "@/lib/badge-checker";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: authorId } = await params;
  const userId = session.user.id;

  const existing = await prisma.authorLike.findUnique({
    where: { userId_authorId: { userId, authorId } },
  });

  if (existing) {
    await prisma.authorLike.delete({ where: { userId_authorId: { userId, authorId } } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.authorLike.create({ data: { userId, authorId } });
    awardBadgesAsync({ type: "AUTHOR_LIKED", authorId });
    return NextResponse.json({ liked: true });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ liked: false });
  }

  const { id: authorId } = await params;
  const like = await prisma.authorLike.findUnique({
    where: { userId_authorId: { userId: session.user.id, authorId } },
  });
  return NextResponse.json({ liked: !!like });
}
