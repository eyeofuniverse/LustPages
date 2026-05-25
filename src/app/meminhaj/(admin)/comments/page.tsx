import { getAdminComments } from "@/lib/queries";
import { AdminCommentsClient } from "@/components/admin/AdminCommentsClient";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Comments" };

export default async function AdminCommentsPage() {
  const { comments, total } = await getAdminComments({ take: 100 });

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Comments
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {total} top-level comment{total !== 1 ? "s" : ""} across all stories
        </p>
      </div>

      <AdminCommentsClient comments={comments} />
    </div>
  );
}
