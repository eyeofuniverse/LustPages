import { NextResponse } from "next/server";
import { SUPPORTED_CURRENCIES, getMinAmount, type SupportedCurrency } from "@/lib/nowpayments";

// Cache for 10 minutes — minimums don't change often
let cache: { data: Record<string, number>; at: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.at < CACHE_TTL) {
    return NextResponse.json(cache.data, {
      headers: { "Cache-Control": "public, s-maxage=600" },
    });
  }

  const entries = await Promise.all(
    SUPPORTED_CURRENCIES.map(async (c) => {
      try {
        const min = await getMinAmount(c.id as SupportedCurrency);
        return [c.id, min] as const;
      } catch {
        return [c.id, 0] as const;
      }
    })
  );

  const data = Object.fromEntries(entries);
  cache = { data, at: Date.now() };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, s-maxage=600" },
  });
}
