import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateAuthorByUserId, getAuthorComments } from "@/lib/queries";
import { AuthorCommentsClient } from "@/components/dashboard/AuthorCommentsClient";
import { MessageCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Comments — Author Dashboard" };

export default async function AuthorCommentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const author = await getOrCreateAuthorByUserId(session.user.id, session.user.name ?? "Author");

  const comments = await getAuthorComments(author.id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(196,66,106,0.1)" }}
        >
          <MessageCircle size={18} style={{ color: "#c4426a" }} />
        </div>
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Comments
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {comments.length} comment{comments.length !== 1 ? "s" : ""} on your stories
          </p>
        </div>
      </div>

      <AuthorCommentsClient
        comments={comments}
        userId={session.user.id}
      />
    </div>
  );
}
