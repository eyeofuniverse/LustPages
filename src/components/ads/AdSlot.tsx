import { getActiveAdForSlot } from "@/lib/queries";
import { AdUnit } from "./AdUnit";
import { AffiliateAd } from "./AffiliateAd";

interface Props {
  identifier: string;
  className?: string;
}

export async function AdSlot({ identifier, className }: Props) {
  const ad = await getActiveAdForSlot(identifier);
  if (!ad) return null;

  return (
    <div
      className={className}
      style={{ margin: "2rem 0", padding: "0 1rem" }}
      aria-label="Advertisement"
    >
      {/* ——— Advertisement ——— divider */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          marginBottom: "0.875rem",
        }}
      >
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.6 }} />
        <span
          style={{
            fontSize: "0.575rem",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            color: "var(--muted-foreground)",
            opacity: 0.4,
            padding: "0.2rem 0.625rem",
            border: "1px solid var(--border)",
            borderRadius: "9999px",
            whiteSpace: "nowrap",
          }}
        >
          Advertisement
        </span>
        <div style={{ flex: 1, height: "1px", background: "var(--border)", opacity: 0.6 }} />
      </div>

      {/* Ad content — centered, max 728px */}
      <div
        style={{
          maxWidth: "728px",
          margin: "0 auto",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {ad.type === "network" ? (
          <AdUnit code={ad.networkCode ?? ""} />
        ) : (
          <AffiliateAd
            imageUrl={ad.imageUrl ?? ""}
            linkUrl={ad.linkUrl ?? "#"}
            altText={ad.altText ?? ""}
            title={ad.adTitle}
            description={ad.adDescription}
          />
        )}
      </div>
    </div>
  );
}
