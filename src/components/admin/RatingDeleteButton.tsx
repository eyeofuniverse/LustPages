"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function RatingDeleteButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this rating? This will recalculate the story's average.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ratings/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Rating deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete rating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40"
      style={{ color: "var(--muted-foreground)" }}
      title="Delete rating"
    >
      <Trash2 size={14} />
    </button>
  );
}
