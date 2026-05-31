import { getCategories, getAuthors, getAllStructuredTags } from "@/lib/queries";
import { StoryForm } from "@/components/admin/StoryForm";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Story" };

export default async function NewStoryPage() {
  const [categories, authors, availableTags] = await Promise.all([getCategories(), getAuthors(), getAllStructuredTags()]);

  return (
    <div>
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        New Story
      </h1>
      <StoryForm categories={categories} authors={authors} availableTags={availableTags} />
    </div>
  );
}
