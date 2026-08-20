import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidateSeries } from "@/lib/revalidate";

async function requireSeriesOwner(seriesId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const author = await prisma.author.findUnique({ where: { userId: session.user.id } });
  if (!author) return null;
  const series = await prisma.series.findFirst({ where: { id: seriesId, authorId: author.id } });
  return series ? { author, series } : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ownership = await requireSeriesOwner(id);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const series = await prisma.series.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      coverImage: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
      _count: { select: { unlocks: true, stories: true } },
    },
  });
  return NextResponse.json(series);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ownership = await requireSeriesOwner(id);
  if (!ownership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { isPremium, coinPrice, freeChapters, name, description, coverImage } = body;

  // Validate coinPrice
  const parsedCoinPrice = coinPrice != null ? Number(coinPrice) : null;
  if (isPremium && parsedCoinPrice !== null && (!Number.isInteger(parsedCoinPrice) || parsedCoinPrice < 1)) {
    return NextResponse.json({ error: "Coin price must be a whole number of at least 1" }, { status: 400 });
  }

  // Lock price once readers have unlocked
  let resolvedCoinPrice = parsedCoinPrice;
  const hasUnlocks = (await prisma.seriesUnlock.count({ where: { seriesId: id } })) > 0;
  if (hasUnlocks && parsedCoinPrice !== ownership.series.coinPrice) {
    resolvedCoinPrice = ownership.series.coinPrice;
  }

  const clampedFreeChapters = Math.max(1, parseInt(String(freeChapters ?? 1), 10) || 1);

  const updated = await prisma.series.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(coverImage !== undefined && { coverImage }),
      ...(isPremium !== undefined && { isPremium: !!isPremium }),
      coinPrice: isPremium ? (resolvedCoinPrice ?? null) : null,
      freeChapters: clampedFreeChapters,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      isPremium: true,
      coinPrice: true,
      freeChapters: true,
    },
  });

  revalidateSeries(updated.slug);
  return NextResponse.json(updated);
}
