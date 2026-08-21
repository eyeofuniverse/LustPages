import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getOrCreateAuthorByUserId, getAuthorStoryById, getCategories, getAllStructuredTags } from "@/lib/queries";
import { AuthorStoryForm } from "@/components/author/AuthorStoryForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Story — Author Dashboard" };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AuthorEditStoryPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getOrCreateAuthorByUserId(session.user.id, session.user.name ?? "Author");

  const [story, categories, allStructuredTags] = await Promise.all([
    getAuthorStoryById(id, author.id),
    getCategories(),
    getAllStructuredTags(),
  ]);
  const availableTags = allStructuredTags.filter((t) => !t.isKeyword);

  if (!story) notFound();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {story.status === "rejected" ? "Revise Story" : "Edit Story"}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {story.status === "rejected"
            ? "Address the feedback below and resubmit for review."
            : "Edit your draft and submit when ready."}
        </p>
      </div>
      <AuthorStoryForm
        categories={categories}
        availableTags={availableTags}
        authorId={author.id}
        initialData={{
          id: story.id,
          title: story.title,
          slug: story.slug,
          excerpt: story.excerpt,
          content: story.content,
          coverImage: story.coverImage,
          tagIds: story.storyTags.filter((t) => t.isApproved && !t.isKeyword).map((t) => t.id),
          keywordTagNames: story.storyTags.filter((t) => t.isApproved && t.isKeyword).map((t) => t.name),
          categoryIds: story.categories.map((c) => c.id),
          readingTime: story.readingTime,
          series: story.seriesInfo?.name ?? story.series,
          seriesId: story.seriesId,
          chapterNumber: story.chapterNumber,
          language: story.language,
          pov: story.pov,
          genderPairing: story.genderPairing,
          contentWarnings: story.contentWarnings,
          maturityRating: story.maturityRating,
          authorNote: story.authorNote,
          status: story.status,
          rejectionReason: story.rejectionReason,
          coinPrice: story.coinPrice,
          hasUnlocks: story._count.unlocks > 0,
        }}
      />
    </div>
  );
}
