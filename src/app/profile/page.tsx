import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getCategories, getUserBookmarks, getReadingHistory, getFinishedStories, getUserLikes, getUserRatedStories } from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LibraryClient } from "./LibraryClient";
import { UserBadges } from "@/components/badges/UserBadges";
import { Award, User } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your reading history, bookmarks, and liked stories on LustPages.",
  robots: { index: false, follow: false },
};

type Tab = "reading" | "finished" | "bookmarks" | "likes" | "rated";
const VALID_TABS: Tab[] = ["reading", "finished", "bookmarks", "likes", "rated"];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { tab } = await searchParams;
  const defaultTab: Tab = VALID_TABS.includes(tab as Tab) ? (tab as Tab) : "reading";

  const [categories, reading, finished, bookmarks, likes, rated, earnedBadges] = await Promise.all([
    getCategories(),
    getReadingHistory(session.user.id),
    getFinishedStories(session.user.id),
    getUserBookmarks(session.user.id),
    getUserLikes(session.user.id),
    getUserRatedStories(session.user.id),
    prisma.userBadge.findMany({
      where: { userId: session.user.id },
      select: { badgeId: true, awardedAt: true },
      orderBy: { awardedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header categories={categories} />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full">
        {/* Profile header */}
        <div
          className="flex items-center gap-5 p-6 rounded-2xl mb-8"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{
              background: "rgba(196,66,106,0.12)",
              color: "#c4426a",
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            {session.user.name?.[0]?.toUpperCase() ?? <User size={22} />}
          </div>
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              My Library
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {session.user.name} · {session.user.email}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div
          className="p-6 rounded-2xl mb-8"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <h2
            className="text-lg font-bold mb-5 flex items-center gap-2"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            <Award size={18} style={{ color: "#c4426a" }} />
            My Badges
          </h2>
          <UserBadges earned={earnedBadges} category="reader" showLocked />
        </div>

        <LibraryClient
          reading={reading}
          finished={finished}
          bookmarks={bookmarks}
          likes={likes}
          rated={rated}
          defaultTab={defaultTab}
        />
      </main>
      <Footer />
    </div>
  );
}
