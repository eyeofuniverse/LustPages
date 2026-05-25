import { getAdminTags } from "@/lib/queries";
import { AdminTagsClient } from "@/components/admin/AdminTagsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tag Library — Admin" };

export default async function TagsPage() {
  const tags = await getAdminTags();
  const approved = tags.filter((t) => t.isApproved).length;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Tag Library
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {tags.length} tags ({approved} approved) · Tier 1: Subgenre · Tier 2: Tropes · Tier 3: Content
        </p>
      </div>
      <AdminTagsClient initialTags={tags} />
    </div>
  );
}
