import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthorProfileForm } from "@/components/author/AuthorProfileForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Profile — LustPages" };

export default async function AuthorProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { name: true, bio: true, image: true, website: true, slug: true },
  });
  if (!author) redirect("/author-dashboard");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/author-dashboard"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <h1
        className="text-2xl font-bold mb-6"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        Edit Profile
      </h1>

      <AuthorProfileForm
        initialData={{
          name: author.name,
          bio: author.bio ?? "",
          image: author.image ?? "",
          website: author.website ?? "",
          slug: author.slug,
        }}
      />
    </div>
  );
}
