"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";

export function IndexNowButton() {
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!confirm("Submit all published stories and series to Bing/IndexNow? This runs once to index existing content.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/indexnow", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Submitted ${data.submitted} URLs to IndexNow (${data.stories} stories, ${data.series} series)`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 disabled:opacity-50"
      style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
    >
      <Globe size={15} style={{ color: "#c4426a" }} />
      {loading ? "Submitting…" : "Submit All to IndexNow"}
    </button>
  );
}
