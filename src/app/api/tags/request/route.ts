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

  // Check if already requested
  const existingReq = await prisma.tagRequest.findFirst({
    where: { slug, status: "pending" },
  });
  if (existingReq) return NextResponse.json({ error: "Already requested and pending review" }, { status: 409 });

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
