"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function injectScript(html: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const scripts = Array.from(tmp.querySelectorAll("script"));
  scripts.forEach((orig) => {
    const s = document.createElement("script");
    if (orig.src) {
      s.src = orig.src;
      s.async = orig.async;
    } else {
      s.textContent = orig.textContent;
    }
    Array.from(orig.attributes).forEach((attr) => {
      if (attr.name !== "src" && attr.name !== "async") s.setAttribute(attr.name, attr.value);
    });
    document.head.appendChild(s);
  });
}

export function GlobalPopUnder() {
  const pathname = usePathname();

  useEffect(() => {
    // Never inject on admin pages regardless of first-load path
    if (pathname.startsWith("/meminhaj")) return;
    fetch("/api/ads/active?slot=global_popunder&device=all")
      .then((r) => (r.ok ? r.json() : null))
      .then((ad) => {
        if (ad?.type === "network" && ad.networkCode) {
          injectScript(ad.networkCode);
        }
      })
      .catch(() => null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fire only once per session — pathname captured at mount time

  return null;
}
