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
      style={{ textAlign: "center", padding: "1rem 0" }}
      aria-label="Advertisement"
    >
      <p
        style={{
          fontSize: "0.625rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--muted-foreground)",
          opacity: 0.5,
          marginBottom: "0.5rem",
        }}
      >
        Advertisement
      </p>
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
  );
}
