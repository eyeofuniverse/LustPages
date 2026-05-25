import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const COMPLETED_THRESHOLD = 90;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: storyId } = await params;
  const { progress } = await req.json();

  if (typeof progress !== "number" || progress < 0 || progress > 100) {
    return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
  }

  const isCompleted = progress >= COMPLETED_THRESHOLD;

  const existing = await prisma.readingHistory.findUnique({
    where: { userId_storyId: { userId: session.user.id, storyId } },
  });

  const record = await prisma.readingHistory.upsert({
    where: { userId_storyId: { userId: session.user.id, storyId } },
    create: {
      userId: session.user.id,
      storyId,
      progress,
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      progress: Math.max(progress, existing?.progress ?? 0),
      ...(isCompleted && !existing?.completedAt ? { completedAt: new Date() } : {}),
    },
  });

  return NextResponse.json(record);
}
