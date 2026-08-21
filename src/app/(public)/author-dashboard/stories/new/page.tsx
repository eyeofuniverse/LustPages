import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateAuthorByUserId, getCategories, getAllStructuredTags } from "@/lib/queries";
import { AuthorStoryForm } from "@/components/author/AuthorStoryForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Story — Author Dashboard" };

export default async function AuthorNewStoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getOrCreateAuthorByUserId(session.user.id, session.user.name ?? "Author");

  const [categories, allStructuredTags] = await Promise.all([getCategories(), getAllStructuredTags()]);
  const availableTags = allStructuredTags.filter((t) => !t.isKeyword);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Write a New Story
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Fill in your story details and submit for admin review before it goes live.
        </p>
      </div>
      <AuthorStoryForm categories={categories} availableTags={availableTags} authorId={author.id} />
    </div>
  );
}
