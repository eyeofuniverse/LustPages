"use client";

import { useState } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function UserSuspendButton({
  id,
  name,
  suspended,
}: {
  id: string;
  name: string;
  suspended: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handle() {
    const action = suspended ? "unsuspend" : "suspend";
    if (!suspended && !confirm(`Suspend "${name}"? They will no longer be able to log in.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspended: !suspended }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed");
      toast.success(suspended ? "User unsuspended" : "User suspended");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action} user`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="p-1.5 rounded-lg transition-all hover:opacity-75 disabled:opacity-40"
      style={{ color: suspended ? "#22c55e" : "#f59e0b" }}
      title={suspended ? "Unsuspend user" : "Suspend user"}
    >
      {suspended ? <ShieldCheck size={14} /> : <Ban size={14} />}
    </button>
  );
}
