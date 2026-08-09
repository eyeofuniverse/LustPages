import { getCachedAdForSlot } from "@/lib/cached-queries";
import { AdUnit } from "./AdUnit";
import { AffiliateAd } from "./AffiliateAd";
import { SponsoredStoryCard } from "./SponsoredStoryCard";

interface Props {
  slot: string;
}

export async function StickyAdSidebar({ slot }: Props) {
  const ad = await getCachedAdForSlot(slot);
  const fillCode = !ad ? process.env.AD_FILL_NETWORK_CODE : null;
  if (!ad && !fillCode) return null;

  return (
    <div style={{ position: "sticky", top: "5.5rem", overflow: "hidden", maxWidth: "300px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          marginBottom: "0.625rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.5 }} />
        <span
          style={{
            fontSize: "0.5rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--muted-foreground)",
            opacity: 0.6,
          }}
        >
          Ad
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.5 }} />
      </div>

      {ad ? (
        ad.type === "network" ? (
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
        )
      ) : (
        <AdUnit code={fillCode!} />
      )}
    </div>
  );
}
