async function uploadBlob(
  imageUrl: string,
  accessJwt: string
): Promise<Record<string, unknown> | null> {
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const buffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";

    const blobRes = await fetch(
      "https://bsky.social/xrpc/com.atproto.repo.uploadBlob",
      {
        method: "POST",
        headers: { "Content-Type": contentType, Authorization: `Bearer ${accessJwt}` },
        body: Buffer.from(buffer),
      }
    );
    if (!blobRes.ok) return null;
    const { blob } = await blobRes.json();
    return blob ?? null;
  } catch {
    return null;
  }
}

// Builds post text with optional story URL link facet and hashtag facets.
// storyUrl is included in the text only when using embed.images (standalone image),
// making the link clickable since there's no separate link card.
function buildPost(
  title: string,
  caption: string,
  tags: string[],
  storyUrl?: string
): { text: string; facets: object[] } {
  const enc = new TextEncoder();
  const MAX = 295; // slight safety margin for multi-byte chars

  const prefix = `${title}\n\n`;
  const urlSuffix = storyUrl ? `\n\n${storyUrl}` : "";
  const reservedGraphemes = [...prefix].length + [...urlSuffix].length;

  const captionBudget = MAX - reservedGraphemes;
  const captionTrimmed =
    [...caption].length > captionBudget
      ? [...caption].slice(0, captionBudget - 1).join("") + "…"
      : caption;

  let text = prefix + captionTrimmed;
  const facets: object[] = [];

  // URL link facet (standalone image mode: URL embedded in text, no link card)
  if (storyUrl) {
    const urlByteStart = enc.encode(text).length + 2; // skip "\n\n"
    text += `\n\n${storyUrl}`;
    const urlByteEnd = enc.encode(text).length;
    facets.push({
      index: { byteStart: urlByteStart, byteEnd: urlByteEnd },
      features: [{ $type: "app.bsky.richtext.facet#link", uri: storyUrl }],
    });
  }

  // Hashtag facets
  for (const rawTag of tags.slice(0, 8)) {
    const tag = rawTag
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (!tag) continue;
    const addition = ` #${tag}`;
    if ([...text].length + addition.length > MAX) break;
    const byteStart = enc.encode(text).length + 1; // skip space, land on #
    text += addition;
    const byteEnd = enc.encode(text).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: "app.bsky.richtext.facet#tag", tag }],
    });
  }

  return { text, facets };
}

export async function postToBluesky({
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
  const sessionRes = await fetch(
    "https://bsky.social/xrpc/com.atproto.server.createSession",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: process.env.BLUESKY_HANDLE,
        password: process.env.BLUESKY_APP_PASSWORD,
      }),
    }
  );
  if (!sessionRes.ok) {
    const err = await sessionRes.json().catch(() => ({}));
    throw new Error(`Bluesky auth failed: ${err.message ?? sessionRes.status}`);
  }
  const { accessJwt, did } = await sessionRes.json();

  // Upload image blob when a cover image is provided.
  const thumb = coverImageUrl ? await uploadBlob(coverImageUrl, accessJwt) : null;

  let text: string;
  let facets: object[];
  let embed: object;

  if (thumb) {
    // Standalone image embed: image appears full-width in feed.
    // Story URL must be in the text (as a link facet) since there's no link card.
    ({ text, facets } = buildPost(title, caption, tags, url));
    embed = {
      $type: "app.bsky.embed.images",
      images: [{ alt: title, image: thumb }],
    };
  } else {
    // No image (or blob upload failed): use link card embed.
    // URL is carried by the card, not duplicated in the text.
    ({ text, facets } = buildPost(title, caption, tags));
    embed = {
      $type: "app.bsky.embed.external",
      external: {
        uri: url,
        title,
        description: caption.slice(0, 300),
      },
    };
  }

  const postRes = await fetch(
    "https://bsky.social/xrpc/com.atproto.repo.createRecord",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessJwt}`,
      },
      body: JSON.stringify({
        repo: did,
        collection: "app.bsky.feed.post",
        record: {
          $type: "app.bsky.feed.post",
          text,
          ...(facets.length > 0 && { facets }),
          embed,
          createdAt: new Date().toISOString(),
        },
      }),
    }
  );

  if (!postRes.ok) {
    const err = await postRes.json().catch(() => ({}));
    throw new Error(`Bluesky post failed: ${err.message ?? postRes.status}`);
  }

  const result = await postRes.json();
  return { uri: result.uri as string };
}
