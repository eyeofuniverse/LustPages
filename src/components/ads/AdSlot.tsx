import { getCachedAdForSlot } from "@/lib/cached-queries";
import { AdUnit } from "./AdUnit";
import { AffiliateAd } from "./AffiliateAd";
import { SponsoredStoryCard } from "./SponsoredStoryCard";

interface Props {
  identifier: string;
  className?: string;
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

export async function AdSlot({ identifier, className }: Props) {
  const ad = await getCachedAdForSlot(identifier);

  if (!ad) {
    const fillCode = process.env.AD_FILL_NETWORK_CODE;
    if (!fillCode) return null;
    return (
      <AdWrapper className={className}>
        <AdUnit code={fillCode} />
      </AdWrapper>
    );
  }

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
