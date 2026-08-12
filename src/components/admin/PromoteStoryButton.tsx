"use client";

import { useState } from "react";
import { Share2, X, Send, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";

interface Props {
  storyId: string;
  storyTitle: string;
  storyExcerpt: string;
  tumblrConnected: boolean;
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
  tumblrConnected,
}: Props) {
  const [open, setOpen] = useState(false);
  const [caption, setCaption] = useState(storyExcerpt.slice(0, BSKY_MAX));
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  async function handlePost() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/social/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyId, caption }),
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

  function handleClose() {
    setOpen(false);
    setResults(null);
    setCaption(storyExcerpt.slice(0, BSKY_MAX));
  }

  const bothSucceeded = results && results.bluesky.ok && results.tumblr.ok;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-85"
        style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a", border: "1px solid rgba(196,66,106,0.3)" }}
      >
        <Share2 size={15} />
        Promote Story
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="w-full max-w-lg rounded-2xl shadow-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Share2 size={16} style={{ color: "#c4426a" }} />
                <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                  Promote Story
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded-lg hover:opacity-75 transition-opacity"
                style={{ color: "var(--muted-foreground)" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Story title */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Story
                </p>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {storyTitle}
                </p>
              </div>

              {/* Caption editor */}
              {!results && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                      Caption
                    </label>
                    <span
                      className="text-xs tabular-nums"
                      style={{ color: caption.length > BSKY_MAX ? "#ef4444" : "var(--muted-foreground)" }}
                    >
                      {caption.length}/{BSKY_MAX} (Bluesky limit)
                    </span>
                  </div>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                    style={{
                      background: "var(--muted)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                    }}
                    placeholder="Caption for the post…"
                  />
                  <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                    The story link and title will be attached as a card automatically.
                  </p>
                </div>
              )}

              {/* Platform status */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  Platforms
                </p>

                {/* Bluesky */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: "#0085ff" }}>
                      B
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Bluesky</span>
                  </div>
                  {results ? (
                    results.bluesky.ok ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#22c55e" }}>
                        <CheckCircle size={14} /> Posted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#ef4444" }}>
                        <XCircle size={14} /> {!results.bluesky.ok && (results.bluesky as { ok: false; error: string }).error}
                      </span>
                    )
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Connected</span>
                  )}
                </div>

                {/* Tumblr */}
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ background: "#35465c" }}>
                      t
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Tumblr</span>
                  </div>
                  {results ? (
                    results.tumblr.ok ? (
                      <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#22c55e" }}>
                        <CheckCircle size={14} /> Posted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: "#ef4444" }}>
                        <XCircle size={14} /> {!results.tumblr.ok && (results.tumblr as { ok: false; error: string }).error}
                      </span>
                    )
                  ) : tumblrConnected ? (
                    <span className="text-xs font-semibold" style={{ color: "#22c55e" }}>Connected</span>
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
                  style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}
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
                  disabled={loading || !caption.trim() || caption.length > BSKY_MAX}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "#c4426a" }}
                >
                  {loading ? (
                    <><Loader2 size={15} className="animate-spin" /> Posting…</>
                  ) : (
                    <><Send size={15} /> Post to Both Platforms</>
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
