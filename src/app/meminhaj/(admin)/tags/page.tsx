import { getAdminTags } from "@/lib/queries";
import { AdminTagsClient } from "@/components/admin/AdminTagsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tag Library — Admin" };

export default async function TagsPage() {
  const allTags = await getAdminTags();
  const tags = allTags.filter((t) => t.isApproved);
  const unapprovedCount = allTags.length - tags.length;

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
          {tags.length} approved tags · Tier 1: Subgenre · Tier 2: Tropes · Tier 3: Content
          {unapprovedCount > 0 && (
            <> · <a href="/meminhaj/tag-requests" style={{ color: "#f59e0b", textDecoration: "underline" }}>{unapprovedCount} pending review</a></>
          )}
        </p>
      </div>
      <AdminTagsClient initialTags={tags} />
    </div>
  );
}
