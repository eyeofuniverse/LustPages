"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

const INTERVAL_MS = 60_000;

export function DashboardRefresher() {
  const router = useRouter();
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [spinning, setSpinning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setLastRefreshed(new Date());
    setTimeout(() => setSpinning(false), 700);
  }

  useEffect(() => {
    timerRef.current = setInterval(refresh, INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mins = Math.floor((Date.now() - lastRefreshed.getTime()) / 60_000);
  const label = mins === 0 ? "just now" : `${mins}m ago`;

  return (
    <button
      onClick={refresh}
      title="Refresh dashboard"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
      style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
    >
      <RefreshCw size={13} className={spinning ? "animate-spin" : ""} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
