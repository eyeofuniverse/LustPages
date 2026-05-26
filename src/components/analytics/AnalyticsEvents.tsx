"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReportWebVitals } from "next/web-vitals";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function WebVitals() {
  useReportWebVitals((metric) => {
    window.gtag?.("event", metric.name, {
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  });
  return null;
}

export function AnalyticsEvents() {
  const pathname = usePathname();
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const isFirst = useRef(true);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const sendPageView = () => {
      window.gtag?.("event", "page_view", {
        page_location: window.location.href,
        page_path: pathname,
      });
    };

    if (isFirst.current) {
      // Fire initial page_view once gtag is ready
      const timer = setTimeout(sendPageView, 100);
      isFirst.current = false;
      return () => clearTimeout(timer);
    }

    sendPageView();
  }, [pathname, id]);

  return <WebVitals />;
}
