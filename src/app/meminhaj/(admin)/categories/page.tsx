import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/admin/CategoryManager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { stories: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Categories
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {categories.length} categories · create, edit, or delete
        </p>
      </div>
      <CategoryManager initial={categories} />
    </div>
  );
}
