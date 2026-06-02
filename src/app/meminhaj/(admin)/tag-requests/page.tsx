import { getAdminTagRequests, getAdminTags } from "@/lib/queries";
import { AdminTagRequestsClient } from "@/components/admin/AdminTagRequestsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tag Requests — Admin" };

export default async function TagRequestsPage() {
  const [requests, allTags] = await Promise.all([
    getAdminTagRequests(),
    getAdminTags(),
  ]);

  const masterTags = allTags
    .filter((t) => t.isApproved)
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, tier: t.tier }));

  const pendingTags = allTags
    .filter((t) => !t.isApproved)
    .map((t) => ({ id: t.id, name: t.name, slug: t.slug, tier: t.tier, _count: { stories: t._count.stories } }));

  const pendingRequestCount = requests.filter((r) => r.status === "pending").length;
  const totalPending = pendingRequestCount + pendingTags.length;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Tag Requests
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {totalPending > 0 ? `${totalPending} pending — ` : ""}Review, approve, merge, or reject author tag requests and unapproved tags
        </p>
      </div>
      <AdminTagRequestsClient
        initialRequests={requests.map((r) => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() }))}
        masterTags={masterTags}
        pendingTags={pendingTags}
      />
    </div>
  );
}
