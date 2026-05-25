import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const tier = searchParams.get("tier");

  const tags = await prisma.tag.findMany({
    where: {
      isApproved: true,
      ...(tier && { tier: parseInt(tier) }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
        ],
      }),
    },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: { id: true, name: true, slug: true, tier: true, description: true },
    take: 50,
  });

  return NextResponse.json(tags);
}
