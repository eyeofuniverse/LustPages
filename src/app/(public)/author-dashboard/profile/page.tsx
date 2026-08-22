import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuthorProfileForm } from "@/components/author/AuthorProfileForm";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
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

      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Edit Profile
        </h1>
        <Link
          href={`/authors/${author.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-sm transition-opacity hover:opacity-75"
          style={{ color: "#c4426a" }}
        >
          Public profile <ExternalLink size={13} />
        </Link>
      </div>

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
