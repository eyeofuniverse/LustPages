import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getAuthorComments } from "@/lib/queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!author) {
    return NextResponse.json({ error: "Not an author." }, { status: 403 });
  }

  const comments = await getAuthorComments(author.id);
  return NextResponse.json(comments);
}
