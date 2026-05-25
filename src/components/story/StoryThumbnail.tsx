"use client";

interface Props {
  src: string | null;
  title: string;
  primaryColor: string;
}

export function StoryThumbnail({ src, title, primaryColor }: Props) {
  return (
    <>
      {/* Fallback always in DOM */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${primaryColor}33 0%, ${primaryColor}11 100%)` }}
      >
        <span
          className="text-2xl font-bold"
          style={{ color: primaryColor + "88", fontFamily: "var(--font-playfair), serif" }}
        >
          {title[0]}
        </span>
      </div>
      {/* Image overlays fallback; hides itself on error */}
      {src && (
        <img
          src={src}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          itemProp="image"
          onError={(e) => (e.currentTarget.style.display = "none")}
        />
      )}
    </>
  );
}
