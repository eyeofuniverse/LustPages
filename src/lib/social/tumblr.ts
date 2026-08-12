import { prisma } from "@/lib/prisma";

async function getAccessToken(): Promise<string> {
  const token = await prisma.socialToken.findUnique({ where: { platform: "tumblr" } });
  if (!token) throw new Error("Tumblr not connected. Use the Connect Tumblr button first.");

  if (!token.expiresAt || token.expiresAt > new Date()) {
    return token.accessToken;
  }

  if (!token.refreshToken) {
    throw new Error("Tumblr token expired. Please reconnect your Tumblr account.");
  }

  const res = await fetch("https://api.tumblr.com/v2/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: process.env.TUMBLR_CONSUMER_KEY!,
      client_secret: process.env.TUMBLR_CONSUMER_SECRET!,
    }),
  });

  if (!res.ok) throw new Error("Tumblr token refresh failed. Please reconnect.");
  const data = await res.json();

  await prisma.socialToken.update({
    where: { platform: "tumblr" },
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token ?? token.refreshToken,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : null,
    },
  });

  return data.access_token as string;
}

const DEFAULT_TAGS = ["erotica", "lustpages", "adult fiction", "erotic fiction"];

// Build HTML caption for Tumblr photo posts.
// Tumblr photo captions support basic HTML.
function buildPhotoCaption(title: string, body: string, url: string): string {
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const bodyHtml = esc(body).replace(/\n/g, "<br>");
  return [
    `<p><strong>${esc(title)}</strong></p>`,
    `<p>${bodyHtml}</p>`,
    `<p><a href="${url}">Read on LustPages →</a></p>`,
  ].join("");
}

export async function postToTumblr({
  title,
  caption,
  url,
  tags = [],
  coverImageUrl,
}: {
  title: string;
  caption: string;
  url: string;
  tags?: string[];
  coverImageUrl?: string | null;
}) {
  const accessToken = await getAccessToken();
  const blog = process.env.TUMBLR_BLOG_NAME!;

  const allTags = [
    ...new Set([...DEFAULT_TAGS, ...tags.map((t) => t.toLowerCase())]),
  ].slice(0, 20);

  // Tags must be a comma-separated string for the legacy API.
  const tagsStr = allTags.join(",");

  // We use the LEGACY /post endpoint (not the NPF /posts endpoint).
  //
  // Reason: the NPF API's `image` content block requires Tumblr-hosted media
  // (not external URLs), causing 400 Bad Request. The NPF `link.poster` field
  // has the same restriction. The legacy `photo` type with `source` is the
  // documented, stable way to post an external image — Tumblr downloads and
  // re-hosts it, displaying it full-width as a standalone image (not a link card).
  const endpoint = `https://api.tumblr.com/v2/blog/${blog}/post`;

  let postBody: Record<string, string>;

  if (coverImageUrl) {
    // Photo post: image is displayed full-width; story link goes in the caption.
    postBody = {
      type: "photo",
      source: coverImageUrl,
      caption: buildPhotoCaption(title, caption, url),
      tags: tagsStr,
      state: "published",
    };
  } else {
    // No image: standard link post.
    postBody = {
      type: "link",
      url,
      title,
      description: caption.slice(0, 500),
      tags: tagsStr,
      state: "published",
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Tumblr post failed: ${
        err?.meta?.msg ??
        err?.errors?.[0]?.detail ??
        err?.errors?.[0]?.title ??
        res.status
      }`
    );
  }

  const result = await res.json();
  return { id: String(result.response?.id ?? result.id ?? "") };
}

export async function isTumblrConnected(): Promise<boolean> {
  const token = await prisma.socialToken.findUnique({
    where: { platform: "tumblr" },
    select: { id: true },
  });
  return !!token;
}
