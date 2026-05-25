import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAuthorByUserId } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { SeriesSettingsForm } from "@/components/author/SeriesSettingsForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = { title: "Series Settings — Author Dashboard" };

export default async function SeriesEditPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getAuthorByUserId(session.user.id);
  if (!author) redirect("/author-signup");

  const series = await prisma.series.findFirst({
    where: { id, authorId: author.id },
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
  if (!series) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/author-dashboard/series"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to My Series
      </Link>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {series.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {series._count.stories} stories · {series._count.unlocks} unlocks
        </p>
      </div>

      <SeriesSettingsForm series={series} />
    </div>
  );
}
