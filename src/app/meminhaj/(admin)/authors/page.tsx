import { prisma } from "@/lib/prisma";
import { AdminAuthorsClient } from "@/components/admin/AdminAuthorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Authors" };

export default async function AuthorsPage() {
  const authors = await prisma.author.findMany({
    include: {
      _count: { select: { stories: true } },
      user: { select: { email: true } },
    },
    orderBy: { name: "asc" },
  });

  const serialized = authors.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }));

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Authors
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {authors.length} {authors.length === 1 ? "author" : "authors"} · create, edit, or remove
        </p>
      </div>
      <AdminAuthorsClient initial={serialized} />
    </div>
  );
}
