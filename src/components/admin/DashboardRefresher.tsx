"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function DashboardRefresher() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  function refresh() {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 700);
  }

  return (
    <button
      onClick={refresh}
      title="Refresh dashboard"
      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
      style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
    >
      <RefreshCw size={13} className={spinning ? "animate-spin" : ""} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );
}
