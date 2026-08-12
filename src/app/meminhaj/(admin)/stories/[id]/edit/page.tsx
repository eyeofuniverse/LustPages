import { getAdminStoryById, getCategories, getAuthors, getAllStructuredTags } from "@/lib/queries";
import { StoryForm } from "@/components/admin/StoryForm";
import { PromoteStoryButton } from "@/components/admin/PromoteStoryButton";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Story" };

export default async function EditStoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [story, categories, authors, availableTags] = await Promise.all([
    getAdminStoryById(id),
    getCategories(),
    getAuthors(),
    getAllStructuredTags(),
  ]);

  if (!story) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Edit Story
        </h1>
        {story.published && (
          <PromoteStoryButton
            storyId={story.id}
            storyTitle={story.title}
            storyExcerpt={story.excerpt}
            storyUrl={`${process.env.SITE_URL}/stories/${story.slug}`}
            coverImage={story.coverImage}
            storyTags={story.storyTags
              .filter((t) => t.isApproved)
              .map((t) => t.name)}
          />
        )}
      </div>
      <StoryForm
        categories={categories}
        authors={authors}
        availableTags={availableTags}
        initialData={{
          id: story.id,
          title: story.title,
          slug: story.slug,
          excerpt: story.excerpt,
          content: story.content,
          coverImage: story.coverImage,
          published: story.published,
          featured: story.featured,
          tagIds: story.storyTags.filter((t) => t.isApproved).map((t) => t.id),
          customTags: story.storyTags
            .filter((t) => !t.isApproved)
            .map((t) => ({ name: t.name, tier: t.tier })),
          categoryIds: story.categories.map((c) => c.id),
          authorId: story.authorId,
          readingTime: story.readingTime,
          views: story.views,
          series: story.seriesInfo?.name ?? story.series,
          seriesId: story.seriesId,
          chapterNumber: story.chapterNumber,
          language: story.language,
          pov: story.pov,
          genderPairing: story.genderPairing,
          contentWarnings: story.contentWarnings,
          maturityRating: story.maturityRating,
          accessLevel: story.accessLevel,
          scheduledAt: story.scheduledAt,
          visibility: story.visibility,
          commentsEnabled: story.commentsEnabled,
          coinPrice: story.coinPrice,
          status: story.status,
          metaTitle: story.metaTitle,
          metaDescription: story.metaDescription,
          canonicalUrl: story.canonicalUrl,
          noIndex: story.noIndex,
          authorNote: story.authorNote,
          adminNotes: story.adminNotes,
          _count: story._count,
        }}
      />
    </div>
  );
}
