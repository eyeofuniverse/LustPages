export async function postToBluesky({
  title,
  caption,
  url,
}: {
  title: string;
  caption: string;
  url: string;
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

  // Bluesky max 300 graphemes; keep text short so the link card does the heavy lifting
  const maxLen = 270;
  const text =
    caption.length > maxLen ? caption.slice(0, maxLen - 1) + "…" : caption;

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
          embed: {
            $type: "app.bsky.embed.external",
            external: {
              uri: url,
              title,
              description: caption.slice(0, 300),
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
