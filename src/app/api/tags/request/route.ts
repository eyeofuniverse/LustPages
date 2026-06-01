import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugifyTag } from "@/lib/tag-library";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { requestedName, tier = 2 } = await req.json();
  if (!requestedName?.trim()) return NextResponse.json({ error: "Tag name required" }, { status: 400 });

  const slug = slugifyTag(requestedName);
  if (!slug) return NextResponse.json({ error: "Invalid tag name" }, { status: 400 });

  // Check if tag already exists (exact or alias)
  const existing = await prisma.tag.findFirst({
    where: { OR: [{ slug }, { aliases: { some: { alias: slug } } }] },
  });
  if (existing) return NextResponse.json({ error: "This tag already exists", existing }, { status: 409 });

  // Check if already requested (pending) or previously rejected
  const existingReq = await prisma.tagRequest.findFirst({
    where: { slug, status: { in: ["pending", "rejected"] } },
    select: { status: true },
  });
  if (existingReq) {
    const error = existingReq.status === "rejected"
      ? "This tag was previously rejected by an admin. Contact support if you believe it should be reconsidered."
      : "Already requested and pending review";
    return NextResponse.json({ error }, { status: 409 });
  }

  const request = await prisma.tagRequest.create({
    data: {
      requestedName: requestedName.trim(),
      slug,
      tier: Number(tier),
      requestedById: session.user.id,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
