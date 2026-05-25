import crypto from "crypto";

const BASE = process.env.NOWPAYMENTS_SANDBOX === "false"
  ? "https://api.nowpayments.io/v1"
  : "https://api-sandbox.nowpayments.io/v1";

const API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!;
const SITE = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export const SUPPORTED_CURRENCIES = [
  { id: "usdttrc20", label: "USDT (TRC-20)", note: "Fast · Low fees" },
  { id: "usdterc20", label: "USDT (ERC-20)", note: "Standard" },
  { id: "btc",       label: "Bitcoin (BTC)", note: "Universal" },
  { id: "eth",       label: "Ethereum (ETH)", note: "Standard" },
  { id: "bnbbsc",    label: "BNB (BSC)",      note: "Fast · Low fees" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["id"];

export interface CreatePaymentParams {
  priceUsd: number;
  payCurrency: SupportedCurrency;
  orderId: string;
  orderDescription: string;
}

export interface NowPayment {
  payment_id: string;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  order_id: string;
  order_description: string;
  created_at: string;
  updated_at: string;
  payment_url?: string;
  expiration_estimate_date?: string;
}

async function nowFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NOWPayments API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export async function createPayment(params: CreatePaymentParams): Promise<NowPayment> {
  return nowFetch<NowPayment>("/payment", {
    method: "POST",
    body: JSON.stringify({
      price_amount: params.priceUsd,
      price_currency: "usd",
      pay_currency: params.payCurrency,
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: `${SITE}/api/webhooks/nowpayments`,
      success_url: `${SITE}/store?success=1`,
      cancel_url: `${SITE}/store`,
    }),
  });
}

export async function getPayment(paymentId: string): Promise<NowPayment> {
  return nowFetch<NowPayment>(`/payment/${paymentId}`);
}

export async function getMinAmount(payCurrency: SupportedCurrency): Promise<number> {
  const data = await nowFetch<{ min_amount: number }>(
    `/min-amount?currency_from=usd&currency_to=${payCurrency}`
  );
  return data.min_amount;
}

function sortObjectDeep(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(sortObjectDeep);
  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj as Record<string, unknown>)
      .sort()
      .reduce((acc: Record<string, unknown>, key) => {
        acc[key] = sortObjectDeep((obj as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }
  return obj;
}

export function verifyIpnSignature(body: Record<string, unknown>, signature: string): boolean {
  const sorted = sortObjectDeep(body);
  const hmac = crypto.createHmac("sha512", IPN_SECRET);
  hmac.update(JSON.stringify(sorted));
  return hmac.digest("hex") === signature;
}

export const FINISHED_STATUSES = new Set(["finished", "confirmed"]);
export const FAILED_STATUSES = new Set(["failed", "refunded", "expired"]);
