"use client";

interface Props {
  src: string;
  alt: string;
  className: string;
}

export function AdminStoryCover({ src, alt, className }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => (e.currentTarget.style.display = "none")}
    />
  );
}
