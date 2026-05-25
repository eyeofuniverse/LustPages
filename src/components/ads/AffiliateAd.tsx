"use client";

interface Props {
  imageUrl: string;
  linkUrl: string;
  altText: string;
  title?: string | null;
  description?: string | null;
}

export function AffiliateAd({ imageUrl, linkUrl, altText, title, description }: Props) {
  if (!imageUrl || !linkUrl) return null;

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      aria-label={altText || title || "Sponsored"}
      style={{ display: "inline-block", maxWidth: "100%" }}
    >
      <img
        src={imageUrl}
        alt={altText || "Advertisement"}
        style={{ maxWidth: "100%", height: "auto", display: "block" }}
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      {title && (
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--foreground)",
            marginTop: "0.375rem",
          }}
        >
          {title}
        </p>
      )}
      {description && (
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--muted-foreground)",
            marginTop: "0.125rem",
          }}
        >
          {description}
        </p>
      )}
    </a>
  );
}
