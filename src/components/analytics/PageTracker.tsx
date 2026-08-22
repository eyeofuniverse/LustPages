"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);
  // Capture document.referrer exactly once at mount — this is the real external
  // referrer from whoever linked the user here (Google, Reddit, etc.).
  // For every subsequent soft navigation, document.referrer stays the same
  // (always the site origin), so we only use it for the first pageview.
  const entryReferrer = useRef<string | null>(
    typeof document !== "undefined" ? document.referrer || null : null
  );

  useEffect(() => {
    if (!pathname || pathname === lastTracked.current) return;
    if (pathname.startsWith("/meminhaj")) return;

    const isFirstPage = lastTracked.current === null;
    lastTracked.current = pathname;

    const body = JSON.stringify({
      path: pathname,
      // First page: the real external referrer (null = direct/bookmark).
      // Subsequent pages: null so the API doesn't overwrite the session referrer
      // with a same-site URL (which would always look "Direct").
      referrer: isFirstPage ? entryReferrer.current : null,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        body,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
