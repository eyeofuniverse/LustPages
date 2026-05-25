import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendStoryRejectedEmail } from "@/lib/email";
import { sendPushToUsers } from "@/lib/push";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { reason } = await req.json();

  if (!reason?.trim()) {
    return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
  }

  try {
    const story = await prisma.story.update({
      where: { id },
      data: { published: false, status: "rejected", rejectionReason: reason.trim() },
      include: {
        author: { include: { user: { select: { email: true } } } },
      },
    });

    if (story.author.user?.email) {
      sendStoryRejectedEmail(
        story.author.user.email,
        story.author.name,
        story.title,
        reason.trim(),
      ).catch(console.error);
    }

    if (story.author.userId) {
      sendPushToUsers([story.author.userId], {
        title: "Story needs revision",
        body: `"${story.title}" wasn't approved. Tap to see the feedback.`,
        url: "/author-dashboard",
        tag: `rejected-${story.id}`,
      }).catch(console.error);
    }

    return NextResponse.json(story);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
