"use client";

import { useEffect, useState } from "react";
import { AdUnit } from "./AdUnit";
import { AffiliateAd } from "./AffiliateAd";
import { SponsoredStoryCard } from "./SponsoredStoryCard";

type AdData = {
  type: string;
  deviceType: string;
  networkCode: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  adTitle: string | null;
  adDescription: string | null;
};

// Module-level cache: deduplicates simultaneous fetches for the same slot+device.
// TTL of 5 minutes matches the API's Cache-Control max-age so SPA navigation
// after that window re-fetches fresh ad data.
const CACHE_TTL = 5 * 60 * 1000;
const fetchCache = new Map<string, { promise: Promise<AdData | null>; ts: number }>();

function detectDevice(): "mobile" | "tablet" | "desktop" {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function loadAd(slot: string, device: string): Promise<AdData | null> {
  const key = `${slot}:${device}`;
  const entry = fetchCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.promise;
  const promise = fetch(`/api/ads/active?slot=${encodeURIComponent(slot)}&device=${device}`)
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  fetchCache.set(key, { promise, ts: Date.now() });
  return promise;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "0.575rem",
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "var(--muted-foreground)",
  opacity: 0.7,
  padding: "0.2rem 0.625rem",
  border: "1px solid var(--border)",
  borderRadius: "9999px",
  whiteSpace: "nowrap",
};

function AdWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{ margin: "2rem 0", ...(className ? {} : { padding: "0 1rem" }) }}
      aria-label="Advertisement"
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.875rem" }}>
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.6 }} />
        <span style={LABEL_STYLE}>Advertisement</span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.6 }} />
      </div>
      <div style={{ maxWidth: "728px", margin: "0 auto", width: "100%", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

interface Props {
  identifier: string;
  className?: string;
}

export function AdSlot({ identifier, className }: Props) {
  const [ad, setAd] = useState<AdData | null | undefined>(undefined);

  useEffect(() => {
    const device = detectDevice();
    loadAd(identifier, device).then(setAd);
  }, [identifier]);

  // undefined = not yet fetched; null = no ad available
  if (ad == null) return null;

  return (
    <AdWrapper className={className}>
      {ad.type === "network" ? (
        <AdUnit code={ad.networkCode ?? ""} />
      ) : ad.type === "sponsored" ? (
        <SponsoredStoryCard
          imageUrl={ad.imageUrl ?? ""}
          linkUrl={ad.linkUrl ?? "#"}
          title={ad.adTitle}
          description={ad.adDescription}
          altText={ad.altText}
        />
      ) : (
        <AffiliateAd
          imageUrl={ad.imageUrl ?? ""}
          linkUrl={ad.linkUrl ?? "#"}
          altText={ad.altText ?? ""}
          title={ad.adTitle}
          description={ad.adDescription}
        />
      )}
    </AdWrapper>
  );
}
