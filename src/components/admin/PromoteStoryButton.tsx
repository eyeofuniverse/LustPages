"use client";

import { useRef, useState } from "react";
import {
  Share2,
  X,
  Send,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Hash,
  ImageIcon,
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

type PlatformResult = { ok: true } | { ok: false; error: string };
interface Results {
  bluesky?: PlatformResult;
  tumblr?: PlatformResult;
}

type ImageMode = "story" | "custom" | "none";

function sanitizeTag(t: string) {
  return t.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "");
}

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
  const [bskyCaption, setBskyCaption] = useState(() => storyExcerpt.slice(0, 270));
  const [tumblrCaption, setTumblrCaption] = useState(() => storyExcerpt);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    bluesky: true,
    tumblr: true,
  });
  const [imageMode, setImageMode] = useState<ImageMode>(coverImage ? "story" : "none");
  const [customImageData, setCustomImageData] = useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = useState(false);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Results | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // Bluesky text = "Title\n\nCaption #tags" — all count toward the 300-char limit
  const titleChars = storyTitle.length + 2; // title + "\n\n"
  const hashtagChars = tags.reduce((acc, t) => {
    const c = sanitizeTag(t);
    return c ? acc + 2 + c.length : acc; // " #tag" = space + hash + tagname
  }, 0);
  const bskyTotal = titleChars + bskyCaption.length + hashtagChars;

  const activePlatforms = Object.entries(selectedPlatforms)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const noPlatform = activePlatforms.length === 0;
  const bskyOver = selectedPlatforms.bluesky && bskyTotal > 300;
  const bskyEmpty = selectedPlatforms.bluesky && !bskyCaption.trim();
  const tumblrEmpty = selectedPlatforms.tumblr && !tumblrCaption.trim();
  const customNotReady = imageMode === "custom" && !customImageData;

  const canPost =
    !loading &&
    !noPlatform &&
    !bskyOver &&
    !bskyEmpty &&
    !tumblrEmpty &&
    !customNotReady;

  const allSucceeded =
    results != null &&
    (!selectedPlatforms.bluesky || results.bluesky?.ok === true) &&
    (!selectedPlatforms.tumblr || results.tumblr?.ok === true);

  // Handlers
  async function handlePost() {
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/social/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId,
          platforms: activePlatforms,
          bskyCaption: bskyCaption.trim(),
          tumblrCaption: tumblrCaption.trim(),
          tags,
          // Custom image goes as base64 to the server for Cloudinary upload.
          // Story/none modes send the URL directly.
          ...(imageMode === "custom" && customImageData
            ? { imageData: customImageData }
            : { imageUrl: imageMode === "story" ? (coverImage ?? null) : null }),
        }),
      });
      const data = await res.json();
      setResults(data);
    } catch {
      const err = { ok: false as const, error: "Network error" };
      setResults({
        bluesky: selectedPlatforms.bluesky ? err : undefined,
        tumblr: selectedPlatforms.tumblr ? err : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  function addTag() {
    const tag = tagInput.trim().replace(/^#+/, "");
    const cleaned = sanitizeTag(tag);
    if (cleaned && !tags.includes(cleaned) && tags.length < 15) {
      setTags((t) => [...t, cleaned]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((t) => t.filter((x) => x !== tag));
  }

  function togglePlatform(p: "bluesky" | "tumblr") {
    setSelectedPlatforms((prev) => ({ ...prev, [p]: !prev[p] }));
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imageInputRef.current) imageInputRef.current.value = "";

    if (!file.type.startsWith("image/")) {
      setImageError("Please select an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setImageError("Image must be under 15 MB.");
      return;
    }

    setImageError("");
    setImageProcessing(true);
    try {
      // Compress client-side via Canvas (max 1200px, JPEG 85%).
      // The resulting data URL is sent to our API which uploads to Cloudinary.
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(objectUrl);
          try {
            const MAX = 1200;
            const scale = Math.min(1, MAX / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Canvas unavailable")); return; }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } catch (err) { reject(err); }
        };
        img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error("Could not load image")); };
        img.src = objectUrl;
      });
      setCustomImageData(dataUrl);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to process image.");
    } finally {
      setImageProcessing(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setResults(null);
  }

  const postLabel =
    activePlatforms.length === 2
      ? "Post to Both Platforms"
      : activePlatforms[0] === "bluesky"
      ? "Post to Bluesky"
      : activePlatforms[0] === "tumblr"
      ? "Post to Tumblr"
      : "Select a Platform";

  return (
    <>
      {/* Trigger */}
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

      {/* Modal */}
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
            {/* Sticky header */}
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
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wide mb-1"
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
              </div>

              {/* ── Platforms ── */}
              <div className="space-y-2">
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Post to
                </p>

                {/* Bluesky row */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: "var(--muted)",
                    border: `1px solid ${selectedPlatforms.bluesky ? "rgba(0,133,255,0.4)" : "var(--border)"}`,
                    opacity: results ? 1 : 1,
                  }}
                >
                  <input
                    type="checkbox"
                    id="plat-bsky"
                    checked={selectedPlatforms.bluesky}
                    onChange={() => !results && togglePlatform("bluesky")}
                    disabled={!!results}
                    className="shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor="plat-bsky"
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  >
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
                  </label>
                  {results ? (
                    results.bluesky ? (
                      results.bluesky.ok ? (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "#22c55e" }}
                        >
                          <CheckCircle size={14} /> Posted
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold max-w-[140px] text-right"
                          style={{ color: "#ef4444" }}
                        >
                          <XCircle size={14} className="shrink-0" />
                          {(results.bluesky as { ok: false; error: string }).error}
                        </span>
                      )
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Skipped
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

                {/* Tumblr row */}
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{
                    background: "var(--muted)",
                    border: `1px solid ${selectedPlatforms.tumblr ? "rgba(53,70,92,0.6)" : "var(--border)"}`,
                  }}
                >
                  <input
                    type="checkbox"
                    id="plat-tumblr"
                    checked={selectedPlatforms.tumblr}
                    onChange={() => !results && togglePlatform("tumblr")}
                    disabled={!!results}
                    className="shrink-0 cursor-pointer"
                  />
                  <label
                    htmlFor="plat-tumblr"
                    className="flex items-center gap-2.5 flex-1 cursor-pointer"
                  >
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
                  </label>
                  {results ? (
                    results.tumblr ? (
                      results.tumblr.ok ? (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: "#22c55e" }}
                        >
                          <CheckCircle size={14} /> Posted
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1.5 text-xs font-semibold max-w-[140px] text-right"
                          style={{ color: "#ef4444" }}
                        >
                          <XCircle size={14} className="shrink-0" />
                          {(results.tumblr as { ok: false; error: string }).error}
                        </span>
                      )
                    ) : (
                      <span
                        className="text-xs"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Skipped
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

              {!results && (
                <>
                  {/* ── Image ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <ImageIcon size={13} style={{ color: "var(--muted-foreground)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Image
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      {/* Story cover */}
                      {coverImage && (
                        <label
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                          style={{
                            background: "var(--muted)",
                            border: `1px solid ${imageMode === "story" ? "#c4426a" : "var(--border)"}`,
                          }}
                        >
                          <input
                            type="radio"
                            name="imageMode"
                            value="story"
                            checked={imageMode === "story"}
                            onChange={() => setImageMode("story")}
                            className="shrink-0"
                          />
                          <img
                            src={coverImage}
                            alt=""
                            className="w-8 h-10 rounded object-cover shrink-0"
                          />
                          <span
                            className="text-sm"
                            style={{ color: "var(--foreground)" }}
                          >
                            Story cover
                          </span>
                        </label>
                      )}

                      {/* Custom upload */}
                      <div
                        className="px-3 py-2.5 rounded-xl"
                        style={{
                          background: "var(--muted)",
                          border: `1px solid ${imageMode === "custom" ? "#c4426a" : "var(--border)"}`,
                        }}
                      >
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="imageMode"
                            value="custom"
                            checked={imageMode === "custom"}
                            onChange={() => setImageMode("custom")}
                            className="shrink-0"
                          />
                          <span
                            className="text-sm flex-1"
                            style={{ color: "var(--foreground)" }}
                          >
                            Upload custom image
                          </span>
                          {imageMode === "custom" && (
                            <div className="flex items-center gap-2">
                              {customImageData && (
                                <img
                                  src={customImageData}
                                  alt=""
                                  className="w-8 h-10 rounded object-cover shrink-0"
                                />
                              )}
                              <button
                                type="button"
                                onClick={() => imageInputRef.current?.click()}
                                disabled={imageProcessing}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                                style={{
                                  background: "var(--card)",
                                  border: "1px solid var(--border)",
                                  color: "var(--foreground)",
                                }}
                              >
                                {imageProcessing ? (
                                  <Loader2 size={11} className="animate-spin" />
                                ) : null}
                                {imageProcessing
                                  ? "Processing…"
                                  : customImageData
                                  ? "Change"
                                  : "Choose"}
                              </button>
                              <input
                                ref={imageInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageSelect}
                              />
                            </div>
                          )}
                        </label>
                        {imageMode === "custom" && imageError && (
                          <p className="text-xs mt-1 ml-6" style={{ color: "#ef4444" }}>
                            {imageError}
                          </p>
                        )}
                        {imageMode === "custom" && !customImageData && !imageProcessing && (
                          <p
                            className="text-xs mt-1 ml-6"
                            style={{ color: "var(--muted-foreground)" }}
                          >
                            Click Choose to select an image
                          </p>
                        )}
                      </div>

                      {/* No image */}
                      <label
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                        style={{
                          background: "var(--muted)",
                          border: `1px solid ${imageMode === "none" ? "#c4426a" : "var(--border)"}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="imageMode"
                          value="none"
                          checked={imageMode === "none"}
                          onChange={() => setImageMode("none")}
                          className="shrink-0"
                        />
                        <span
                          className="text-sm"
                          style={{ color: "var(--foreground)" }}
                        >
                          No image
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* ── Bluesky caption ── */}
                  {selectedPlatforms.bluesky && (
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
                          style={{ color: bskyOver ? "#ef4444" : "var(--muted-foreground)" }}
                          title={`Title: ${titleChars} + Caption: ${bskyCaption.length} + Tags: ${hashtagChars} = ${bskyTotal}/300`}
                        >
                          {bskyTotal}/300
                          <span style={{ opacity: 0.6 }}>
                            {" "}(title:{titleChars}+body:{bskyCaption.length}+tags:{hashtagChars})
                          </span>
                        </span>
                      </div>
                      <textarea
                        value={bskyCaption}
                        onChange={(e) => setBskyCaption(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2.5 rounded-xl text-sm resize-none"
                        style={{
                          background: "var(--muted)",
                          border: `1px solid ${bskyOver ? "#ef4444" : "var(--border)"}`,
                          color: "var(--foreground)",
                          outline: "none",
                        }}
                        placeholder="Short caption for Bluesky — caption + hashtags must fit in 300 chars…"
                      />
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                        The title is automatically prepended to the post body.
                        {bskyOver && (
                          <span style={{ color: "#ef4444" }}>
                            {" "}Shorten the caption or remove hashtags to fit within 300.
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* ── Tumblr caption ── */}
                  {selectedPlatforms.tumblr && (
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
                  )}

                  {/* ── Hashtags ── */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Hash size={13} style={{ color: "var(--muted-foreground)" }} />
                      <p
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        Hashtags
                        <span className="font-normal ml-1">
                          ({tags.length}/15) — all removable
                        </span>
                      </p>
                    </div>

                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {tags.map((tag) => (
                          <span
                            key={tag}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              background: "rgba(196,66,106,0.1)",
                              color: "#c4426a",
                              border: "1px solid rgba(196,66,106,0.2)",
                            }}
                          >
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="hover:opacity-70 leading-none ml-0.5 transition-opacity"
                              aria-label={`Remove #${tag}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {tags.length === 0 && (
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        No hashtags — add some below.
                      </p>
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
                        placeholder="Add hashtag…"
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
                  </div>
                </>
              )}

              {/* ── Action ── */}
              {allSucceeded ? (
                <div
                  className="flex items-center justify-center gap-2 p-3 rounded-xl text-sm font-semibold"
                  style={{
                    background: "rgba(34,197,94,0.1)",
                    color: "#22c55e",
                    border: "1px solid rgba(34,197,94,0.2)",
                  }}
                >
                  <CheckCircle size={15} /> Posted successfully!
                </div>
              ) : results ? (
                <button
                  type="button"
                  onClick={() => setResults(null)}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold hover:opacity-85 transition-opacity"
                  style={{
                    background: "var(--muted)",
                    color: "var(--foreground)",
                    border: "1px solid var(--border)",
                  }}
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
                      <Send size={15} /> {postLabel}
                    </>
                  )}
                </button>
              )}

              {/* Validation hints */}
              {!results && !loading && (
                <div className="space-y-1">
                  {noPlatform && (
                    <p className="text-xs text-center" style={{ color: "#ef4444" }}>
                      Select at least one platform.
                    </p>
                  )}
                  {customNotReady && (
                    <p className="text-xs text-center" style={{ color: "#ef4444" }}>
                      Upload a custom image or choose another option.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
