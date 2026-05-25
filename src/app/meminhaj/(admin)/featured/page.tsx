import { getAdminFeaturedItems, getActiveFeaturedPromotions, getPublishedStories } from "@/lib/queries";
import { FeaturedManager } from "@/components/admin/FeaturedManager";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Featured Manager — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const [storyAdminItems, seriesAdminItems, storyPaidPromos, seriesPaidPromos] =
    await Promise.all([
      getAdminFeaturedItems("story"),
      getAdminFeaturedItems("series"),
      getActiveFeaturedPromotions("story"),
      getActiveFeaturedPromotions("series"),
    ]);

  const [publishedStories, allSeries] = await Promise.all([
    getPublishedStories({ take: 200 }),
    prisma.series.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } }, _count: { select: { stories: { where: { published: true } } } } },
    }),
  ]);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Featured Manager
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Admin picks fill empty slots. Paid promotions replace them when authors buy featured placement.
        </p>
      </div>

      <FeaturedManager
        storyAdminItems={storyAdminItems}
        seriesAdminItems={seriesAdminItems}
        storyPaidPromos={storyPaidPromos}
        seriesPaidPromos={seriesPaidPromos}
        publishedStories={publishedStories.map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          coverImage: s.coverImage,
          author: s.author,
        }))}
        allSeries={allSeries.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          coverImage: s.coverImage,
          author: s.author,
          publishedCount: s._count.stories,
        }))}
      />
    </div>
  );
}
