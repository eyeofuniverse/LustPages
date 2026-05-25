import { getAdminCollections } from "@/lib/queries";
import Link from "next/link";
import { BookOpen, Sparkles, Plus, Eye, EyeOff, Star } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Collections" };

export default async function AdminCollectionsPage() {
  const collections = await getAdminCollections();

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Collections
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {collections.length} editorial {collections.length === 1 ? "collection" : "collections"}
          </p>
        </div>
        <Link
          href="/meminhaj/collections/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shrink-0"
          style={{ background: "#c4426a" }}
        >
          <Plus size={15} /> New Collection
        </Link>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {collections.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--muted-foreground)" }}>
            <Sparkles size={32} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)" }} />
            <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>No collections yet</p>
            <p className="text-sm mb-6">Create your first editorial collection to surface curated content.</p>
            <Link
              href="/meminhaj/collections/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "#c4426a" }}
            >
              <Plus size={15} /> New Collection
            </Link>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {collections.map((col) => (
              <div key={col.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
                    >
                      {col.title}
                    </span>
                    {col.featured && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                      >
                        <Star size={10} /> Featured
                      </span>
                    )}
                    {col.published ? (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                      >
                        <Eye size={10} /> Published
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                      >
                        <EyeOff size={10} /> Draft
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span className="flex items-center gap-1">
                      <BookOpen size={11} /> {col._count.stories} {col._count.stories === 1 ? "story" : "stories"}
                    </span>
                    <span>/collections/{col.slug}</span>
                    <span>Updated {formatDateShort(col.updatedAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/collections/${col.slug}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-75"
                    style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  >
                    View
                  </Link>
                  <Link
                    href={`/meminhaj/collections/${col.id}/edit`}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-75"
                    style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
