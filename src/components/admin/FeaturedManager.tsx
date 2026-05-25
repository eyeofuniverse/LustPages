"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  Sparkles, Star, Clock, Coins, Trash2, Plus, Search,
  CheckCircle, AlertCircle, BookOpen, Layers, XCircle,
} from "lucide-react";

type Story = {
  id: string; title: string; slug: string; coverImage: string | null;
  author: { name: string };
};

type SeriesItem = {
  id: string; name: string; slug: string; coverImage: string | null;
  author: { name: string }; publishedCount: number;
};

import type { AdminFeaturedEntry, PaidFeaturedEntry } from "@/lib/queries";
type AdminItem = AdminFeaturedEntry;
type PaidPromo = PaidFeaturedEntry;

interface Props {
  storyAdminItems: AdminItem[];
  seriesAdminItems: AdminItem[];
  storyPaidPromos: PaidPromo[];
  seriesPaidPromos: PaidPromo[];
  publishedStories: Story[];
  allSeries: SeriesItem[];
}

export function FeaturedManager({
  storyAdminItems, seriesAdminItems,
  storyPaidPromos, seriesPaidPromos,
  publishedStories, allSeries,
}: Props) {
  const [tab, setTab] = useState<"story" | "series">("story");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {(["story", "series"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              tab === t
                ? { background: "#c4426a", color: "white" }
                : { color: "var(--muted-foreground)" }
            }
          >
            {t === "story" ? <BookOpen size={14} /> : <Layers size={14} />}
            {t === "story" ? "Stories" : "Series"}
          </button>
        ))}
      </div>

      {tab === "story" ? (
        <FeaturedSection
          type="story"
          adminItems={storyAdminItems}
          paidPromos={storyPaidPromos}
          availableItems={publishedStories.map((s) => ({ id: s.id, label: s.title, sub: s.author.name, cover: s.coverImage }))}
        />
      ) : (
        <FeaturedSection
          type="series"
          adminItems={seriesAdminItems}
          paidPromos={seriesPaidPromos}
          availableItems={allSeries.map((s) => ({ id: s.id, label: s.name, sub: `${s.author.name} · ${s.publishedCount} parts`, cover: s.coverImage }))}
        />
      )}
    </div>
  );
}

type AvailableItem = { id: string; label: string; sub: string; cover: string | null };

function FeaturedSection({
  type, adminItems, paidPromos, availableItems,
}: {
  type: "story" | "series";
  adminItems: AdminItem[];
  paidPromos: PaidPromo[];
  availableItems: AvailableItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const [expiring, setExpiring] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const MAX = 10;
  const usedPaid = paidPromos.filter((p) => p.status === "active").length;
  const usedQueued = paidPromos.filter((p) => p.status === "queued").length;
  const adminSlots = Math.max(0, MAX - usedPaid);

  const usedIds = new Set([
    ...adminItems.map((a) => a.storyId ?? a.seriesId),
    ...paidPromos.map((p) => type === "story" ? p.story?.id : p.series?.id),
  ].filter(Boolean) as string[]);

  const filtered = availableItems.filter(
    (i) => !usedIds.has(i.id) && (
      search === "" ||
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      i.sub.toLowerCase().includes(search.toLowerCase())
    )
  );

  async function handleAdd(id: string) {
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          ...(type === "story" ? { storyId: id } : { seriesId: id }),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      setSearch("");
      startTransition(() => { router.refresh(); });
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    setRemoving(id);
    try {
      await fetch(`/api/admin/featured?id=${id}`, { method: "DELETE" });
      startTransition(() => { router.refresh(); });
    } finally {
      setRemoving(null);
    }
  }

  async function handleExpire(id: string) {
    setExpiring(id);
    try {
      await fetch("/api/admin/featured", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      startTransition(() => { router.refresh(); });
    } finally {
      setExpiring(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Slot meter */}
      <div
        className="flex flex-wrap items-center gap-4 p-4 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Slot usage
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}>
              {usedPaid + Math.min(adminSlots, adminItems.length)} / {MAX}
            </span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: MAX }).map((_, i) => {
              const isPaid = i < usedPaid;
              const isAdmin = !isPaid && i < usedPaid + Math.min(adminSlots, adminItems.length);
              return (
                <div
                  key={i}
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background: isPaid ? "#c4426a" : isAdmin ? "#eab308" : "var(--muted)",
                  }}
                />
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#c4426a" }} />
              {usedPaid} paid active
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#eab308" }} />
              {Math.min(adminSlots, adminItems.length)} editor picks
            </span>
            {usedQueued > 0 && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#6366f1" }} />
                {usedQueued} in queue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Paid promotions */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Coins size={14} style={{ color: "#c4426a" }} />
          Paid Promotions
        </h3>
        {paidPromos.length === 0 ? (
          <p className="text-sm py-4 text-center rounded-xl" style={{ color: "var(--muted-foreground)", background: "var(--card)", border: "1px solid var(--border)" }}>
            No paid promotions right now
          </p>
        ) : (
          <div className="space-y-2">
            {paidPromos.map((promo) => {
              const label = type === "story"
                ? promo.story?.title
                : promo.series?.name;
              const isActive = promo.status === "active";
              const expiry = promo.expiresAt
                ? new Date(promo.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : null;

              return (
                <div
                  key={promo.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <span
                    className="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={
                      isActive
                        ? { background: "rgba(34,197,94,0.1)", color: "#22c55e" }
                        : { background: "rgba(99,102,241,0.1)", color: "#6366f1" }
                    }
                  >
                    {isActive ? "Active" : "Queued"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {label || "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      by {promo.author.name}
                      {isActive && expiry && ` · expires ${expiry}`}
                    </p>
                  </div>
                  {isActive && (
                    <button
                      onClick={() => handleExpire(promo.id)}
                      disabled={expiring === promo.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-40"
                      style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
                      title="Force expire this promotion"
                    >
                      <XCircle size={11} />
                      Expire
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin picks */}
      <div>
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Star size={14} style={{ color: "#eab308" }} />
          Editor&apos;s Picks ({adminItems.length} saved · {Math.min(adminSlots, adminItems.length)} visible)
        </h3>
        {adminItems.length === 0 ? (
          <p className="text-sm py-4 text-center rounded-xl" style={{ color: "var(--muted-foreground)", background: "var(--card)", border: "1px solid var(--border)" }}>
            No editor picks added yet
          </p>
        ) : (
          <div className="space-y-2">
            {adminItems.map((item, idx) => {
              const label = type === "story" ? item.story?.title : item.series?.name;
              const authorName = type === "story" ? item.story?.author.name : item.series?.author.name;
              const visible = idx < adminSlots;

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{
                    background: "var(--card)",
                    border: `1px solid ${visible ? "rgba(234,179,8,0.3)" : "var(--border)"}`,
                    opacity: visible ? 1 : 0.55,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: visible ? "rgba(234,179,8,0.15)" : "var(--muted)", color: visible ? "#eab308" : "var(--muted-foreground)" }}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {label || "—"}
                    </p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {authorName} {!visible && "· hidden (paid slots full)"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={removing === item.id || pending}
                    className="p-1.5 rounded-lg transition-opacity hover:opacity-75 disabled:opacity-40"
                    style={{ color: "#ef4444" }}
                    title="Remove from editor picks"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new admin pick */}
      <div
        className="rounded-2xl p-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
          <Plus size={14} style={{ color: "#c4426a" }} />
          Add Editor&apos;s Pick
        </h3>

        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            placeholder={`Search ${type === "story" ? "stories" : "series"}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {error && (
          <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "#ef4444" }}>
            <AlertCircle size={11} /> {error}
          </p>
        )}

        {search.length > 0 && (
          <div
            className="max-h-56 overflow-y-auto rounded-xl divide-y"
            style={{ border: "1px solid var(--border)", "--divide-color": "var(--border)" } as React.CSSProperties}
          >
            {filtered.length === 0 ? (
              <p className="text-xs py-3 text-center" style={{ color: "var(--muted-foreground)" }}>
                No results
              </p>
            ) : (
              filtered.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAdd(item.id)}
                  disabled={adding || pending}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-opacity hover:opacity-75 disabled:opacity-40"
                >
                  <div
                    className="w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold"
                    style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                  >
                    {item.cover ? (
                      <SafeImage src={item.cover} alt={item.label} width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      item.label[0]
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                      {item.label}
                    </p>
                    <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {item.sub}
                    </p>
                  </div>
                  <CheckCircle size={13} style={{ color: "var(--muted-foreground)" }} className="shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))
            )}
          </div>
        )}

        {search.length === 0 && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Type to search and click to add. Already-featured items are excluded.
          </p>
        )}
      </div>
    </div>
  );
}
