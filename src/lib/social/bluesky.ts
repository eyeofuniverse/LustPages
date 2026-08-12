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

function buildPost(
  caption: string,
  tags: string[]
): { text: string; facets: object[] } {
  const enc = new TextEncoder();
  const MAX = 290;
  let text = caption.length > MAX ? caption.slice(0, MAX - 1) + "…" : caption;
  const facets: object[] = [];

  for (const rawTag of tags.slice(0, 8)) {
    const tag = rawTag
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/g, "");
    if (!tag) continue;
    const addition = ` #${tag}`;
    if (text.length + addition.length > MAX) break;
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

  const { text, facets } = buildPost(caption, tags);

  const thumb = coverImageUrl ? await uploadBlob(coverImageUrl, accessJwt) : null;

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
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: url,
              title,
              description: caption.slice(0, 300),
              ...(thumb && { thumb }),
            },
          },
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
