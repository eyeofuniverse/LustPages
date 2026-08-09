interface Props {
  imageUrl: string;
  linkUrl: string;
  title?: string | null;
  description?: string | null;
  altText?: string | null;
}

export function SponsoredStoryCard({ imageUrl, linkUrl, title, description, altText }: Props) {
  if (!linkUrl) return null;

  return (
    <a
      href={linkUrl}
      target="_blank"
      rel="noopener noreferrer nofollow sponsored"
      style={{
        display: "flex",
        gap: "0.875rem",
        alignItems: "flex-start",
        textDecoration: "none",
        padding: "0.875rem",
        borderRadius: "0.875rem",
        border: "1px solid var(--border)",
        background: "var(--card)",
      }}
    >
      {imageUrl && (
        <div
          style={{
            width: "72px",
            height: "96px",
            borderRadius: "0.5rem",
            overflow: "hidden",
            flexShrink: 0,
            background: "var(--muted)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={altText ?? ""}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: "inline-block",
            fontSize: "0.6rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--muted-foreground)",
            marginBottom: "0.375rem",
            padding: "0.15rem 0.5rem",
            background: "var(--muted)",
            borderRadius: "9999px",
          }}
        >
          Sponsored
        </span>
        {title && (
          <p
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              lineHeight: 1.35,
              color: "var(--foreground)",
              marginBottom: "0.375rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
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
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
      </div>
    </a>
  );
}
