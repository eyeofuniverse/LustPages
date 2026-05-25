"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteStoryButton({ storyId }: { storyId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/stories/${storyId}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="p-1.5 rounded-lg transition-opacity hover:opacity-75 disabled:opacity-40"
      style={{ color: "var(--muted-foreground)" }}
    >
      <Trash2 size={15} />
    </button>
  );
}
