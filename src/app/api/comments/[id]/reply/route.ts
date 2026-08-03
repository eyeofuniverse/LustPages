import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendCommentReplyEmail } from "@/lib/email";
import { awardBadgesAsync } from "@/lib/badge-checker";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: parentId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Reply cannot be empty." }, { status: 400 });
  }
  if (content.length > 1000) {
    return NextResponse.json({ error: "Reply is too long." }, { status: 400 });
  }

  const parent = await prisma.comment.findUnique({
    where: { id: parentId },
    select: { id: true, storyId: true, parentId: true },
  });
  if (!parent) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }
  if (parent.parentId) {
    return NextResponse.json({ error: "Cannot reply to a reply." }, { status: 400 });
  }

  const [reply, parentComment] = await Promise.all([
    prisma.comment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        storyId: parent.storyId,
        parentId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.comment.findUnique({
      where: { id: parentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        story: { select: { title: true, slug: true } },
      },
    }),
  ]);

  // Notify the original commenter — skip if they replied to themselves
  if (
    parentComment &&
    parentComment.user.id !== session.user.id &&
    parentComment.user.email
  ) {
    sendCommentReplyEmail(
      parentComment.user.email,
      parentComment.user.name,
      session.user.name ?? "Someone",
      parentComment.story.title,
      parentComment.story.slug,
      content.trim(),
    ).catch(console.error);
  }

  awardBadgesAsync({ type: "COMMENT", userId: session.user.id });

  return NextResponse.json(reply, { status: 201 });
}
