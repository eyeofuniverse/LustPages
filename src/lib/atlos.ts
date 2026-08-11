import { createHmac, timingSafeEqual } from "crypto";

const MERCHANT_ID = process.env.ATLOS_MERCHANT_ID!;
const API_SECRET = process.env.ATLOS_API_SECRET!;
const API_BASE = "https://api.atlos.io/gateway/rest";

export { MERCHANT_ID as ATLOS_MERCHANT_ID };

export function verifyAtlosSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !API_SECRET) return false;
  const hmac = createHmac("sha256", API_SECRET);
  hmac.update(rawBody);
  const expected = hmac.digest("base64");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

async function atlosPost(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ApiSecret: API_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Atlos ${endpoint} ${res.status}: ${text}`);
  }
  return res.json();
}

export async function cancelAtlosSubscription(params: {
  orderId?: string;
  subscriptionId?: string;
}) {
  return atlosPost("Subscription/Cancel", {
    MerchantId: MERCHANT_ID,
    ...(params.orderId ? { OrderId: params.orderId } : {}),
    ...(params.subscriptionId ? { SubscriptionId: params.subscriptionId } : {}),
  });
}
