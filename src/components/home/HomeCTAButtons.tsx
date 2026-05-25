"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowRight, BookOpen, PenSquare } from "lucide-react";

export function HeroJoinButton() {
  const { data: session } = useSession();
  if (session) return null;

  return (
    <Link
      href="/register"
      className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold transition-all hover:opacity-75 active:scale-[0.98] text-sm sm:text-base"
      style={{ background: "var(--muted)", color: "var(--foreground)" }}
    >
      Join Free
      <ArrowRight size={15} />
    </Link>
  );
}

export function HomeBottomCTA() {
  const { data: session } = useSession();
  const authorId = (session?.user as { authorId?: string | null })?.authorId;

  if (session) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/stories"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: "#c4426a" }}
        >
          <BookOpen size={18} />
          Browse Stories
        </Link>
        <Link
          href={authorId ? "/author-dashboard" : "/author-signup"}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-75 active:scale-[0.98]"
          style={{
            color: "#c4426a",
            border: "1px solid rgba(196,66,106,0.4)",
            background: "rgba(196,66,106,0.05)",
          }}
        >
          <PenSquare size={16} />
          {authorId ? "My Dashboard" : "Become an Author"}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
      <Link
        href="/register"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-[0.98]"
        style={{ background: "#c4426a" }}
      >
        Get Started — It&apos;s Free
        <ArrowRight size={18} />
      </Link>
      <Link
        href="/author-signup"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all hover:opacity-75 active:scale-[0.98]"
        style={{
          color: "#c4426a",
          border: "1px solid rgba(196,66,106,0.4)",
          background: "rgba(196,66,106,0.05)",
        }}
      >
        <PenSquare size={16} />
        Become an Author
      </Link>
    </div>
  );
}
