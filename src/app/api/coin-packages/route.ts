import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const packages = await prisma.coinPackage.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(packages);
}
