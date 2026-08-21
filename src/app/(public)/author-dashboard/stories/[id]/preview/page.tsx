import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { sanitizeStoryContent } from "@/lib/sanitize";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Clock, AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Story Preview — LustPages" };

export default async function StoryPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!author) redirect("/author-dashboard");

  const story = await prisma.story.findFirst({
    where: { id, authorId: author.id },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      readingTime: true,
      createdAt: true,
      status: true,
      categories: { select: { id: true, name: true, color: true } },
      storyTags: { where: { isKeyword: false }, select: { id: true, name: true, slug: true } },
      author: { select: { name: true } },
    },
  });

  if (!story) notFound();

  // Preview is only for drafts and rejected stories; published stories are live at /stories/[slug]
  if (story.status === "approved") redirect(`/author-dashboard`);

  const sanitized = sanitizeStoryContent(story.content);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Preview banner */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-8 text-sm"
        style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.3)", color: "#b45309" }}
      >
        <AlertTriangle size={14} className="shrink-0" />
        <span>
          <strong>Draft preview</strong> — this story is not yet published. Only you can see this page.
        </span>
      </div>

      {/* Back */}
      <Link
        href="/author-dashboard"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      {/* Story header */}
      <div
        className="rounded-2xl p-6 sm:p-8 mb-6"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Categories */}
        {story.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {story.categories.map((cat) => (
              <span
                key={cat.id}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: cat.color + "20", color: cat.color }}
              >
                {cat.name}
              </span>
            ))}
          </div>
        )}

        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {story.title}
        </h1>

        {story.excerpt && (
          <p className="text-base leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
            {story.excerpt}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span>{story.author.name}</span>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {story.readingTime} min read
          </span>
          <span>{formatDate(story.createdAt)}</span>
        </div>

        {story.storyTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {story.storyTags.map((tag) => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ background: "rgba(196,66,106,0.08)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.2)" }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Story body */}
      <div
        className="rounded-2xl px-5 sm:px-8 py-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="prose-story mx-auto"
          dangerouslySetInnerHTML={{ __html: sanitized }}
        />
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <Link
          href="/author-dashboard"
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-75"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <Link
          href={`/author-dashboard/stories/${story.id}/edit`}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#c4426a" }}
        >
          Edit Story
        </Link>
      </div>
    </div>
  );
}
