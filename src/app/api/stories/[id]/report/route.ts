import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = [
  "spam",
  "inappropriate_content",
  "copyright",
  "harassment",
  "underage_content",
  "other",
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const { reason, description, commentId, type = "story" } = await req.json();

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Invalid reason." }, { status: 400 });
  }

  const story = await prisma.story.findUnique({ where: { id: storyId }, select: { id: true } });
  if (!story) {
    return NextResponse.json({ error: "Story not found." }, { status: 404 });
  }

  const reportType = type === "comment" && commentId ? "comment" : "story";

  const existing = await prisma.report.findFirst({
    where: {
      userId: session.user.id,
      ...(reportType === "comment" ? { commentId } : { storyId, type: "story" }),
    },
  });
  if (existing) {
    return NextResponse.json({ error: "Already reported." }, { status: 409 });
  }

  await prisma.report.create({
    data: {
      type: reportType,
      reason,
      description: description?.trim() || null,
      userId: session.user.id,
      storyId,
      ...(reportType === "comment" && commentId ? { commentId } : {}),
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
