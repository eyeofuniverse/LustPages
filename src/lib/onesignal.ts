const APP_ID = "86a12f35-8c44-44c7-b1c1-e8e88c8a84d3";
const BASE = "https://lustpages.com";

interface PushPayload {
  title: string;
  body: string;
  url: string;
  imageUrl?: string;
}

async function send(body: Record<string, unknown>) {
  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
    },
    body: JSON.stringify({ app_id: APP_ID, target_channel: "push", ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OneSignal ${res.status}: ${text}`);
  }
  return res.json();
}

// Broadcast to all subscribers
export async function pushToAll(payload: PushPayload) {
  return send({
    included_segments: ["All"],
    headings: { en: payload.title },
    contents: { en: payload.body },
    url: `${BASE}${payload.url}`,
    ...(payload.imageUrl ? { chrome_web_image: payload.imageUrl } : {}),
  });
}

// Send to specific users by their external_id (= userId set via OneSignal.login)
export async function pushToUsers(userIds: string[], payload: PushPayload) {
  if (userIds.length === 0) return;
  return send({
    include_aliases: { external_id: userIds },
    headings: { en: payload.title },
    contents: { en: payload.body },
    url: `${BASE}${payload.url}`,
    ...(payload.imageUrl ? { chrome_web_image: payload.imageUrl } : {}),
  });
}
