"use client";

import { useState, useCallback } from "react";
import { Link2, Check, Share2 } from "lucide-react";

function XIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.629 5.905-5.629zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function RedditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

interface Props {
  url: string;
  title: string;
  /** "header" = compact row below title; "footer" = slightly larger row at bottom */
  variant?: "header" | "footer";
}

export function ShareButtons({ url, title, variant = "header" }: Props) {
  const [copied, setCopied] = useState(false);
  const [nativeSupported] = useState(() => typeof navigator !== "undefined" && !!navigator.share);

  const tweetText = encodeURIComponent(`"${title}" — read it on LustPages`);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const twitterHref = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodedUrl}`;
  const redditHref = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select a temp input
      const el = document.createElement("input");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const nativeShare = useCallback(async () => {
    try {
      await navigator.share({ title, url });
    } catch {
      // dismissed — no-op
    }
  }, [title, url]);

  const btnBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: variant === "footer" ? "7px 14px" : "5px 11px",
    borderRadius: "10px",
    fontSize: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--muted-foreground)",
    textDecoration: "none",
    transition: "opacity 0.15s",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
        Share
      </span>

      {/* Twitter / X */}
      <a
        href={twitterHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        style={btnBase}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <XIcon />
        X / Twitter
      </a>

      {/* Reddit */}
      <a
        href={redditHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Reddit"
        style={{ ...btnBase, color: "#ff4500" }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        <RedditIcon />
        Reddit
      </a>

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        style={{
          ...btnBase,
          color: copied ? "#22c55e" : "var(--muted-foreground)",
          borderColor: copied ? "rgba(34,197,94,0.4)" : "var(--border)",
          background: copied ? "rgba(34,197,94,0.08)" : "var(--card)",
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {copied ? <Check size={13} /> : <Link2 size={13} />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      {/* Native share — only shown on mobile where navigator.share exists */}
      {nativeSupported && (
        <button
          type="button"
          onClick={nativeShare}
          aria-label="More sharing options"
          style={btnBase}
          className="sm:hidden"
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.75")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <Share2 size={13} />
          More
        </button>
      )}
    </div>
  );
}
