import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tags = await prisma.tag.findMany({
    where: { isApproved: true, isKeyword: false },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, tier: true, description: true },
  });
  return NextResponse.json(tags);
}
