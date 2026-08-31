import { NextResponse } from "next/server";
import { getActiveAdForSlot } from "@/lib/queries";

const VALID_DEVICES = new Set(["mobile", "tablet", "desktop", "all"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slot = searchParams.get("slot") ?? "";
  const rawDevice = searchParams.get("device") ?? "all";
  const device = VALID_DEVICES.has(rawDevice) ? rawDevice : "all";

  if (!slot) {
    return NextResponse.json(null, { headers: { "Cache-Control": "no-store" } });
  }

  const ad = await getActiveAdForSlot(slot, device);

  if (!ad) {
    const fillCode = process.env.AD_FILL_NETWORK_CODE;
    if (fillCode) {
      return NextResponse.json(
        { type: "network", deviceType: "all", networkCode: fillCode, imageUrl: null, linkUrl: null, altText: null, adTitle: null, adDescription: null },
        { headers: { "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600" } }
      );
    }
    return NextResponse.json(null, { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } });
  }

  return NextResponse.json(ad, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=1800, stale-while-revalidate=3600" },
  });
}
