import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { story: { select: { authorId: true } } },
  });
  if (!comment) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const isAdmin = (session.user as { role?: string }).role === "admin";
  const isOwner = comment.userId === session.user.id;
  const isStoryAuthor = comment.story.authorId
    ? await prisma.author.findFirst({
        where: { id: comment.story.authorId, userId: session.user.id },
      }).then((a) => !!a)
    : false;

  if (!isAdmin && !isOwner && !isStoryAuthor) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.comment.deleteMany({ where: { parentId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);
  return NextResponse.json({ ok: true });
}
