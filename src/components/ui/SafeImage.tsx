"use client";

import NextImage, { ImageProps } from "next/image";
import { useState } from "react";
import { BookOpen } from "lucide-react";

export function SafeImage(props: ImageProps) {
  const [error, setError] = useState(false);

  if (error) {
    if (props.fill) return null;
    return (
      <div
        className="flex items-center justify-center"
        style={{
          width: props.width,
          height: props.height,
          background: "var(--muted)",
          borderRadius: "inherit",
        }}
      >
        <BookOpen size={16} style={{ opacity: 0.2, color: "var(--muted-foreground)" }} />
      </div>
    );
  }

  return <NextImage {...props} onError={() => setError(true)} />;
}
