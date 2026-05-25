import { notFound } from "next/navigation";
import { getAdminCollectionById } from "@/lib/queries";
import { CollectionForm } from "@/components/admin/CollectionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Collection — Admin" };

export default async function EditCollectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const col = await getAdminCollectionById(id);
  if (!col) notFound();

  return (
    <div className="max-w-5xl">
      <Link
        href="/meminhaj/collections"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to Collections
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {col.title}
        </h1>
        <Link
          href={`/collections/${col.slug}`}
          target="_blank"
          className="text-sm transition-opacity hover:opacity-75"
          style={{ color: "#c4426a" }}
        >
          View live →
        </Link>
      </div>
      <CollectionForm
        mode="edit"
        collectionId={id}
        initial={{
          slug: col.slug,
          title: col.title,
          description: col.description ?? "",
          metaDescription: col.metaDescription ?? "",
          coverImage: "",
          type: col.type,
          featured: col.featured,
          published: col.published,
          sortOrder: col.sortOrder,
          stories: col.stories.map((s) => ({
            id: s.id,
            position: s.position,
            editorialNote: s.editorialNote,
            story: {
              id: s.story.id,
              title: s.story.title,
              slug: s.story.slug,
              author: s.story.author,
              _count: s.story._count,
            },
          })),
        }}
      />
    </div>
  );
}
