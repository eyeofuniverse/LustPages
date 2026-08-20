import { revalidateTag, revalidatePath } from "next/cache";

/** Call after a story is published, updated, or deleted. */
export function revalidateStory(slug: string, authorSlug?: string, seriesSlug?: string) {
  revalidateTag("stories", "max");

  revalidatePath(`/stories/${slug}`, "page");
  revalidatePath("/stories", "page");
  revalidatePath("/", "page");
  revalidatePath("/trending", "page");

  if (authorSlug) revalidatePath(`/authors/${authorSlug}`, "page");
  if (seriesSlug) {
    revalidatePath(`/series/${seriesSlug}`, "page");
    revalidateTag("series", "max");
  }
}

/** Call after a series is updated. */
export function revalidateSeries(slug: string) {
  revalidateTag("series", "max");
  revalidatePath(`/series/${slug}`, "page");
  revalidatePath("/series", "page");
}

/** Call after an author profile is updated. */
export function revalidateAuthor(slug: string) {
  revalidateTag("authors", "max");
  revalidatePath(`/authors/${slug}`, "page");
  revalidatePath("/authors", "page");
}
