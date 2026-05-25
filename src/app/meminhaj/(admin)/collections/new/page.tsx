import { CollectionForm } from "@/components/admin/CollectionForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "New Collection — Admin" };

export default function NewCollectionPage() {
  return (
    <div className="max-w-5xl">
      <Link
        href="/meminhaj/collections"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to Collections
      </Link>
      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        New Collection
      </h1>
      <CollectionForm mode="create" />
    </div>
  );
}
