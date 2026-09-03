"use client";

import { useEffect, useState } from "react";

interface CoverItem {
  slug: string;
  title: string;
  coverImage: string;
}

function MosaicColumn({
  items,
  duration,
  offsetPct = 0,
}: {
  items: CoverItem[];
  duration: number;
  offsetPct?: number;
}) {
  const doubled = [...items, ...items];
  const delay = -((duration * offsetPct) / 100);

  return (
    <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          willChange: "transform",
          animation: `lp-mosaic-scroll ${duration}s linear infinite`,
          animationDelay: `${delay}s`,
        }}
      >
        {doubled.map((cover, i) => (
          <div
            key={`${cover.slug}-${i}`}
            style={{
              borderRadius: "10px",
              overflow: "hidden",
              aspectRatio: "2/3",
              flexShrink: 0,
              background: "rgba(196,66,106,0.15)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.coverImage}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              loading="lazy"
              decoding="async"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroCoverMosaic() {
  const [covers, setCovers] = useState<CoverItem[]>([]);

  useEffect(() => {
    // Only fetch on desktop — no point loading 21 images on mobile
    if (window.innerWidth < 1024) return;

    fetch("/api/stories/hero-covers")
      .then((r) => (r.ok ? r.json() : []))
      .then(setCovers)
      .catch(() => null);
  }, []);

  if (covers.length < 6) return null;

  const col1 = covers.filter((_, i) => i % 3 === 0);
  const col2 = covers.filter((_, i) => i % 3 === 1);
  const col3 = covers.filter((_, i) => i % 3 === 2);

  return (
    <>
      <style>{`
        @keyframes lp-mosaic-scroll {
          from { transform: translateY(0); }
          to   { transform: translateY(-50%); }
        }
      `}</style>

      <div
        className="hidden lg:flex"
        aria-hidden="true"
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "46%",
          gap: "10px",
          padding: "0 24px 0 0",
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {/* Top & bottom fade */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, var(--background) 0%, transparent 22%, transparent 78%, var(--background) 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        {/* Left fade — blends into hero text */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: "100px",
            background: "linear-gradient(to right, var(--background) 0%, transparent 100%)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        <MosaicColumn items={col1} duration={38} offsetPct={0} />
        <MosaicColumn items={col2} duration={52} offsetPct={30} />
        <MosaicColumn items={col3} duration={44} offsetPct={60} />
      </div>
    </>
  );
}
