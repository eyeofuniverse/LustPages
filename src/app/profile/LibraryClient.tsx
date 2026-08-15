"use client";

import { useState } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { BookOpen, Bookmark, Heart, CheckCircle, Clock, Star } from "lucide-react";

type StoryBase = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  readingTime: number;
  ratingAvg?: number;
  ratingCount?: number;
  categories: { id: string; name: string; slug: string; color: string }[];
  author: { name: string; slug: string };
  [key: string]: unknown;
};

type HistoryEntry = {
  id: string;
  progress: number;
  completedAt: Date | null;
  lastReadAt: Date;
  story: StoryBase;
};

type BookmarkEntry = {
  id: string;
  createdAt: Date;
  story: StoryBase;
};

type LikeEntry = {
  id: string;
  createdAt: Date;
  story: StoryBase;
};

type RatedEntry = {
  id: string;
  value: number;
  updatedAt: Date;
  story: StoryBase;
};

type Tab = "reading" | "finished" | "bookmarks" | "likes" | "rated";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "reading", label: "Continue Reading", icon: <BookOpen size={15} /> },
  { id: "finished", label: "Finished", icon: <CheckCircle size={15} /> },
  { id: "bookmarks", label: "Bookmarks", icon: <Bookmark size={15} /> },
  { id: "likes", label: "Liked", icon: <Heart size={15} /> },
  { id: "rated", label: "Rated", icon: <Star size={15} /> },
];

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function HistoryCard({ entry, showProgress }: { entry: HistoryEntry; showProgress: boolean }) {
  const story = entry.story as StoryBase;
  const primaryCategory = story.categories[0];
  const primaryColor = primaryCategory?.color ?? "#c4426a";

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex gap-4 p-4 rounded-2xl transition-all hover:translate-y-[-1px]"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-20 h-20 rounded-xl shrink-0 overflow-hidden"
        style={{ background: "var(--muted)" }}
      >
        {story.coverImage ? (
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)`,
              color: primaryColor,
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            {story.title[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-semibold text-sm leading-snug line-clamp-2 group-hover:opacity-75 transition-opacity"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
          >
            {story.title}
          </h3>
          {primaryCategory && (
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{ background: primaryColor + "22", color: primaryColor }}
            >
              {primaryCategory.name}
            </span>
          )}
        </div>

        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          {story.author.name}
        </p>

        {showProgress && (
          <div className="mb-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
              <div className="h-full rounded-full" style={{ width: `${entry.progress}%`, background: "#c4426a" }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span className="flex items-center gap-1">
            <Clock size={11} /> {story.readingTime}m read
          </span>
          {showProgress ? (
            <span style={{ color: "#c4426a" }}>{entry.progress}% complete</span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle size={11} style={{ color: "#22c55e" }} />
              Finished {timeAgo(entry.completedAt!)}
            </span>
          )}
          <span className="ml-auto">{timeAgo(entry.lastReadAt)}</span>
        </div>
      </div>
    </Link>
  );
}

function StoryGrid({ stories }: { stories: StoryBase[] }) {
  if (stories.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {stories.map((story) => {
        const primaryCategory = story.categories[0];
        const primaryColor = primaryCategory?.color ?? "#c4426a";
        return (
          <Link
            key={story.id}
            href={`/stories/${story.slug}`}
            className="group rounded-2xl overflow-hidden transition-all hover:translate-y-[-2px]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="aspect-[16/9] w-full overflow-hidden relative" style={{ background: "var(--muted)" }}>
              {story.coverImage ? (
                <SafeImage
                  src={story.coverImage}
                  alt={story.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-400"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-4xl font-bold"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}22 0%, var(--muted) 100%)`,
                    color: primaryColor + "66",
                    fontFamily: "var(--font-playfair), serif",
                  }}
                >
                  {story.title[0]}
                </div>
              )}
            </div>
            <div className="p-4">
              <h3
                className="font-bold text-sm leading-snug mb-1 line-clamp-2"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                {story.title}
              </h3>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {story.author.name}
              </p>
              {primaryCategory && (
                <span
                  className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full"
                  style={{ background: primaryColor + "22", color: primaryColor }}
                >
                  {primaryCategory.name}
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function RatedCard({ entry }: { entry: RatedEntry }) {
  const story = entry.story;
  const primaryCategory = story.categories[0];
  const primaryColor = primaryCategory?.color ?? "#c4426a";

  return (
    <Link
      href={`/stories/${story.slug}`}
      className="group flex gap-4 p-4 rounded-2xl transition-all hover:translate-y-[-1px]"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div
        className="w-20 h-20 rounded-xl shrink-0 overflow-hidden"
        style={{ background: "var(--muted)" }}
      >
        {story.coverImage ? (
          <SafeImage
            src={story.coverImage}
            alt={story.title}
            width={80}
            height={80}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-xl font-bold"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}33, ${primaryColor}11)`,
              color: primaryColor,
              fontFamily: "var(--font-playfair), serif",
            }}
          >
            {story.title[0]}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3
            className="font-semibold text-sm leading-snug line-clamp-2 group-hover:opacity-75 transition-opacity"
            style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}
          >
            {story.title}
          </h3>
          {primaryCategory && (
            <span
              className="text-xs px-2 py-0.5 rounded-full shrink-0"
              style={{ background: primaryColor + "22", color: primaryColor }}
            >
              {primaryCategory.name}
            </span>
          )}
        </div>

        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
          {story.author.name}
        </p>

        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          {/* User's star rating */}
          <span className="flex items-center gap-1 font-semibold" style={{ color: "#c4426a" }}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={12}
                fill={s <= entry.value ? "#c4426a" : "none"}
                style={{ color: s <= entry.value ? "#c4426a" : "var(--muted-foreground)" }}
              />
            ))}
            <span className="ml-0.5">{entry.value}/5</span>
          </span>
          <span>Rated {timeAgo(entry.updatedAt)}</span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} /> {story.readingTime}m
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ icon, title, subtitle, href, cta }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div
      className="text-center py-20 rounded-2xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex justify-center mb-4" style={{ color: "var(--muted-foreground)" }}>
        {icon}
      </div>
      <p className="font-semibold mb-1" style={{ color: "var(--foreground)" }}>{title}</p>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>{subtitle}</p>
      {href && cta && (
        <Link
          href={href}
          className="inline-block px-5 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#c4426a" }}
        >
          {cta}
        </Link>
      )}
    </div>
  );
}

export function LibraryClient({
  reading,
  finished,
  bookmarks,
  likes,
  rated,
  defaultTab,
}: {
  reading: HistoryEntry[];
  finished: HistoryEntry[];
  bookmarks: BookmarkEntry[];
  likes: LikeEntry[];
  rated: RatedEntry[];
  defaultTab: Tab;
}) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);

  const counts: Record<Tab, number> = {
    reading: reading.length,
    finished: finished.length,
    bookmarks: bookmarks.length,
    likes: likes.length,
    rated: rated.length,
  };

  return (
    <div>
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center"
            style={
              activeTab === tab.id
                ? { background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.25)" }
                : { color: "var(--muted-foreground)", border: "1px solid transparent" }
            }
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {counts[tab.id] > 0 && (
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                style={
                  activeTab === tab.id
                    ? { background: "#c4426a", color: "#fff" }
                    : { background: "var(--muted)", color: "var(--muted-foreground)" }
                }
              >
                {counts[tab.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "reading" && (
        reading.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} />}
            title="Nothing in progress"
            subtitle="Start reading a story and it'll appear here automatically."
            href="/stories"
            cta="Browse Stories"
          />
        ) : (
          <div className="space-y-3">
            {reading.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} showProgress />
            ))}
          </div>
        )
      )}

      {activeTab === "finished" && (
        finished.length === 0 ? (
          <EmptyState
            icon={<CheckCircle size={40} />}
            title="No finished stories yet"
            subtitle="Stories you've read through 90%+ will appear here."
            href="/stories"
            cta="Find a Story"
          />
        ) : (
          <div className="space-y-3">
            {finished.map((entry) => (
              <HistoryCard key={entry.id} entry={entry} showProgress={false} />
            ))}
          </div>
        )
      )}

      {activeTab === "bookmarks" && (
        bookmarks.length === 0 ? (
          <EmptyState
            icon={<Bookmark size={40} />}
            title="No bookmarks yet"
            subtitle="Tap the bookmark icon on any story to save it here."
            href="/stories"
            cta="Browse Stories"
          />
        ) : (
          <StoryGrid stories={bookmarks.map((b) => b.story)} />
        )
      )}

      {activeTab === "likes" && (
        likes.length === 0 ? (
          <EmptyState
            icon={<Heart size={40} />}
            title="No liked stories yet"
            subtitle="Stories you heart will be saved here."
            href="/stories"
            cta="Browse Stories"
          />
        ) : (
          <StoryGrid stories={likes.map((l) => l.story)} />
        )
      )}

      {activeTab === "rated" && (
        rated.length === 0 ? (
          <EmptyState
            icon={<Star size={40} />}
            title="No rated stories yet"
            subtitle="Rate any story to track your favourites here."
            href="/stories"
            cta="Browse Stories"
          />
        ) : (
          <div className="space-y-3">
            {rated.map((entry) => (
              <RatedCard key={entry.id} entry={entry} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
