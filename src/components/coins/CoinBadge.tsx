"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Coins } from "lucide-react";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";

export function CoinBadge() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/coins/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance))
      .catch(() => {});
  }, [session?.user?.id, pathname]);

  if (!PAYMENTS_ENABLED || !session || balance === null) return null;

  return (
    <Link
      href="/store"
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
      style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}
      title="Buy more coins"
    >
      <Coins size={13} />
      <span>{balance.toLocaleString()}</span>
    </Link>
  );
}
