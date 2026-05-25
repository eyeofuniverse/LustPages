"use client";

import { useEffect, useRef } from "react";

interface Props {
  code: string;
}

export function AdUnit({ code }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !code) return;
    ref.current.innerHTML = code;
    const scripts = ref.current.querySelectorAll("script");
    scripts.forEach((old) => {
      const next = document.createElement("script");
      Array.from(old.attributes).forEach((a) => next.setAttribute(a.name, a.value));
      next.textContent = old.textContent;
      old.parentNode?.replaceChild(next, old);
    });
  }, [code]);

  if (!code) return null;

  return <div ref={ref} style={{ overflow: "hidden" }} />;
}
