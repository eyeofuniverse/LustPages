import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  getCategories,
  getUserBookmarks,
  getReadingHistory,
  getFinishedStories,
  getUserLikes,
  getUserRatedStories,
} from "@/lib/queries";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { LibraryClient } from "./LibraryClient";
import { UserBadges } from "@/components/badges/UserBadges";
import { Award, BookOpen, Heart, Star, Bookmark } from "lucide-react";
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

  const [categories, reading, finished, bookmarks, likes, rated, earnedBadges] =
    await Promise.all([
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

  const initial = session.user.name?.[0]?.toUpperCase() ?? "?";

  const stats = [
    { icon: BookOpen, value: finished.length, label: "Completed" },
    { icon: Bookmark, value: bookmarks.length, label: "Bookmarked" },
    { icon: Heart,    value: likes.length,     label: "Liked" },
    { icon: Star,     value: rated.length,      label: "Rated" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header categories={categories} />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Profile hero ─────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden mb-6"
          style={{
            background:
              "linear-gradient(135deg, rgba(196,66,106,0.12) 0%, rgba(196,66,106,0.04) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          {/* subtle top-right glow */}
          <div
            className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(196,66,106,0.18) 0%, transparent 70%)",
            }}
          />

          <div className="relative px-5 pt-6 pb-5">
            {/* Avatar + name */}
            <div className="flex items-center gap-4 mb-5">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
                style={{
                  background: "rgba(196,66,106,0.15)",
                  color: "#c4426a",
                  fontFamily: "var(--font-playfair), serif",
                  border: "2px solid rgba(196,66,106,0.25)",
                }}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <h1
                  className="text-xl sm:text-2xl font-bold leading-tight truncate"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                >
                  {session.user.name ?? "Reader"}
                </h1>
                <p className="text-sm truncate mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                  {session.user.email}
                </p>
              </div>
            </div>

            {/* Reading stats strip */}
            <div
              className="flex flex-wrap rounded-xl overflow-hidden"
              style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            >
              {stats.map(({ icon: Icon, value, label }, i) => (
                <div
                  key={label}
                  className={[
                    "flex flex-col items-center py-3.5 gap-0.5 w-1/2 sm:w-1/4",
                    i % 2 !== 0 ? "border-l" : "",
                    i >= 2 ? "border-t sm:border-t-0" : "",
                    i > 0 && i % 2 === 0 ? "sm:border-l" : "",
                  ].filter(Boolean).join(" ")}
                >
                  <Icon size={14} style={{ color: "#c4426a" }} />
                  <span
                    className="text-lg font-bold leading-tight"
                    style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
                  >
                    {value}
                  </span>
                  <span className="text-xs leading-none" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Badges ────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl mb-6 p-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} style={{ color: "#c4426a" }} />
            <h2
              className="font-bold text-base"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              My Achievements
            </h2>
          </div>
          <UserBadges earned={earnedBadges} category="reader" showLocked />
        </div>

        {/* ── Library ───────────────────────────────────────────────── */}
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
