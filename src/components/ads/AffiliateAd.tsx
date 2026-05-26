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
      style={{ display: "block", width: "100%" }}
    >
      <img
        src={imageUrl}
        alt={altText || "Advertisement"}
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          borderRadius: "0.5rem",
          transition: "opacity 0.2s ease",
        }}
        onError={(e) => (e.currentTarget.style.display = "none")}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      />
      {title && (
        <p
          style={{
            fontSize: "0.8125rem",
            fontWeight: 600,
            color: "var(--foreground)",
            marginTop: "0.5rem",
            textAlign: "center",
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
            marginTop: "0.2rem",
            textAlign: "center",
          }}
        >
          {description}
        </p>
      )}
    </a>
  );
}
