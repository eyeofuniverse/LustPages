"use client";

import { useState } from "react";
import {
  Share2,
  X,
  Send,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Hash,
} from "lucide-react";

interface Props {
  storyId: string;
  storyTitle: string;
  storyExcerpt: string;
  coverImage?: string | null;
  storyTags?: string[];
  tumblrConnected: boolean;
  compact?: boolean;
}

type PostResult = { ok: true } | { ok: false; error: string };
interface Results {
  bluesky: PostResult;
  tumblr: PostResult;
}

const BSKY_MAX = 270;

export function PromoteStoryButton({
  storyId,
  storyTitle,
  storyExcerpt,
  coverImage,
  storyTags = [],
  tumblrConnected,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [bskyCaption, setBskyCaption] = useState(() =>
    storyExcerpt.slice(0, BSKY_MAX)
  );
  const [tumblrCaption, setTumblrCaption] = useState(() => storyExcerpt);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  const allTags = [...new Set([...storyTags, ...customTags])].slice(0, 15);

  async function handlePost() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/social/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          bskyCaption: bskyCaption.trim(),
          tumblrCaption: tumblrCaption.trim(),
          tags: allTags,
        }),
      });
      const data = await res.json();
      setResults(data);
    } catch {
      setResults({
        bluesky: { ok: false, error: "Network error" },
        tumblr: { ok: false, error: "Network error" },
      });
    } finally {
      setLoading(false);
    }
  }

  function addTag() {
    const tag = tagInput
      .trim()
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/\s+/g, "");
    if (tag && !allTags.includes(tag) && allTags.length < 15) {
      setCustomTags((t) => [...t, tag]);
    }
    setTagInput("");
  }

  function removeCustomTag(tag: string) {
    setCustomTags((t) => t.filter((x) => x !== tag));
  }

  function handleClose() {
    setOpen(false);
    setResults(null);
  }

  const bothSucceeded = results?.bluesky.ok && results?.tumblr.ok;
  const canPost = !loading && bskyCaption.trim().length > 0 && bskyCaption.length <= BSKY_MAX;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Promote Story"
        className={
          compact
            ? "p-1.5 rounded-lg hover:opacity-75 transition-opacity"
            : "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
        }
        style={
          compact
            ? { color: "#c4426a" }
            : {
                background: "rgba(196,66,106,0.12)",
                color: "#c4426a",
                border: "1px solid rgba(196,66,106,0.3)",
              }
        }
      >
        <Share2 size={compact ? 14 : 15} />
        {!compact && "Promote Story"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-y-auto"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              maxHeight: "92dvh",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
              style={{
                background: "var(--card)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div className="flex items-center gap-2">
                <Share2 size={16} style={{ color: "#c4426a" }} />
                <span
                  className="font-semibold text-sm"
                  style={{ color: "var(--foreground)" }}
                >
                  Promote Story
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:opacity-75 transition-opacity"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Story info */}
              <div className="flex items-center gap-3">
                {coverImage && (
                  <img
                    src={coverImage}
                    alt=""
                    className="w-12 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="min-w-0">
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Story
                  </p>
                  <p
                    className="text-sm font-semibold line-clamp-2"
                    style={{ color: "var(--foreground)" }}
                  >
                    {storyTitle}
                  </p>
                  {coverImage && (
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Cover image will be attached
                    </p>
                  )}
                </div>
              </div>

              {!results && (
                <>
                  {/* Bluesky caption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: "#0085ff" }}
                        >
                          B
                        </div>
                        <label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Bluesky Caption
                        </label>
                      </div>
                      <span
                        className="text-xs tabular-nums"
                        style={{
                          color:
                            bskyCaption.length > BSKY_MAX
                              ? "#ef4444"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {bskyCaption.length}/{BSKY_MAX}
                      </span>
                    </div>
                    <textarea
                      value={bskyCaption}
                      onChange={(e) => setBskyCaption(e.target.value)}
                      rows={3}
                      maxLength={BSKY_MAX}
                      className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                      style={{
                        background: "var(--muted)",
                        border: `1px solid ${bskyCaption.length > BSKY_MAX ? "#ef4444" : "var(--border)"}`,
                        color: "var(--foreground)",
                        outline: "none",
                      }}
                      placeholder="Short caption for Bluesky (300 char limit)…"
                    />
                  </div>

                  {/* Tumblr caption */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                          style={{ background: "#35465c" }}
                        >
                          t
                        </div>
                        <label
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          Tumblr Caption
                        </label>
                      </div>
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        No limit
                      </span>
                    </div>
                    <textarea
                      value={tumblrCaption}
                      onChange={(e) => setTumblrCaption(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                      style={{
                        background: "var(--muted)",
                        border: "1px solid var(--border)",
                        color: "var(--foreground)",
                        outline: "none",
                      }}
                      placeholder="Longer caption for Tumblr — no character limit…"
                    />
                  </div>

                  {/* Hashtags */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hash size={13} style={{ color: "var(--muted-foreground)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Hashtags
                      </p>
                    </div>

                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {allTags.map((tag) => {
                          const isCustom = customTags.includes(tag);
                          return (
                            <span
                              key={tag}
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                              style={{
                                background: isCustom
                                  ? "rgba(196,66,106,0.1)"
                                  : "var(--muted)",
                                color: isCustom
                                  ? "#c4426a"
                                  : "var(--muted-foreground)",
                                border: `1px solid ${isCustom ? "rgba(196,66,106,0.2)" : "var(--border)"}`,
                              }}
                            >
                              #{tag}
                              {isCustom && (
                                <button
                                  type="button"
                                  onClick={() => removeCustomTag(tag)}
                                  className="hover:opacity-75 leading-none ml-0.5"
                                  aria-label={`Remove #${tag}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add custom hashtag…"
                        className="flex-1 px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: "var(--muted)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-3 py-2 rounded-xl text-sm font-semibold hover:opacity-80 transition-opacity"
                        style={{
                          background: "var(--muted)",
                          border: "1px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <p
                      className="text-xs mt-1.5"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Story tags pre-loaded. Hashtags are appended to both platforms.
                    </p>
                  </div>
                </>
              )}

              {/* Platform status */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Platforms
                </p>

                {/* Bluesky */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "#0085ff" }}
                    >
                      B
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Bluesky
                    </span>
                  </div>
                  {results ? (
                    results.bluesky.ok ? (
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: "#22c55e" }}
                      >
                        <CheckCircle size={14} /> Posted
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: "#ef4444" }}
                      >
                        <XCircle size={14} />
                        {(results.bluesky as { ok: false; error: string }).error}
                      </span>
                    )
                  ) : (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#22c55e" }}
                    >
                      Connected
                    </span>
                  )}
                </div>

                {/* Tumblr */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: "#35465c" }}
                    >
                      t
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--foreground)" }}
                    >
                      Tumblr
                    </span>
                  </div>
                  {results ? (
                    results.tumblr.ok ? (
                      <span
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: "#22c55e" }}
                      >
                        <CheckCircle size={14} /> Posted
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-1.5 text-xs"
                        style={{ color: "#ef4444" }}
                      >
                        <XCircle size={14} />
                        {(results.tumblr as { ok: false; error: string }).error}
                      </span>
                    )
                  ) : tumblrConnected ? (
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "#22c55e" }}
                    >
                      Connected
                    </span>
                  ) : (
                    <a
                      href="/api/admin/social/tumblr/connect"
                      className="flex items-center gap-1 text-xs font-semibold hover:opacity-75 transition-opacity"
                      style={{ color: "#c4426a" }}
                    >
                      Connect <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              {/* Action */}
              {bothSucceeded ? (
                <div
                  className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <CheckCircle size={15} />
                  Posted to both platforms!
                </div>
              ) : results ? (
                <button
                  type="button"
                  onClick={() => setResults(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold hover:opacity-85 transition-opacity"
                  style={{ background: "var(--muted)", color: "var(--foreground)" }}
                >
                  Try Again
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePost}
                  disabled={!canPost}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#c4426a" }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" /> Posting…
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Post to Both Platforms
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
