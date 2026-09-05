"use client";

import { useEffect, useRef } from "react";

interface Props {
  code: string;
}

export function AdUnit({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Track the last-injected code so React Strict Mode double-invoke
  // and parent re-renders don't run the same network script twice.
  const injectedRef = useRef<string>("");

  useEffect(() => {
    if (!ref.current || !code || injectedRef.current === code) return;
    injectedRef.current = code;

    ref.current.innerHTML = code;
    const scripts = ref.current.querySelectorAll("script");
    scripts.forEach((old) => {
      const next = document.createElement("script");
      Array.from(old.attributes).forEach((a) => next.setAttribute(a.name, a.value));
      next.textContent = old.textContent;
      old.parentNode?.replaceChild(next, old);
    });
    // No cleanup — removing scripts breaks ad network lifecycle.
  }, [code]);

  if (!code) return null;

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", overflow: "hidden" }}>
      <div ref={ref} style={{ maxWidth: "100%", overflow: "hidden" }} />
    </div>
  );
}
