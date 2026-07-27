"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string | null;
  packageId: string | null;
  storyId: string | null;
  createdAt: string;
  user: { name: string; email: string };
}

const TYPE_LABELS: Record<string, string> = {
  subscription_grant: "Sub Grant",
  unlock: "Unlock",
  tip_sent: "Tip",
  expired: "Expired",
  welcome_bonus: "Welcome",
};

const TYPE_COLORS: Record<string, string> = {
  subscription_grant: "#c4426a",
  unlock: "#6366f1",
  tip_sent: "#f59e0b",
  expired: "#ef4444",
  welcome_bonus: "#22c55e",
};

const FILTERS = [
  { value: "all", label: "All" },
  { value: "subscription_grant", label: "Sub Grants" },
  { value: "unlock", label: "Unlocks" },
  { value: "tip_sent", label: "Tips" },
  { value: "expired", label: "Expired" },
  { value: "welcome_bonus", label: "Welcome" },
];

const C = 100;

export function TransactionsTable() {
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ transactions: Transaction[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/accounts/transactions?type=${type}&page=${page}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [type, page]);

  useEffect(() => { load(); }, [load]);

  // Reset page when filter changes
  const handleTypeChange = (t: string) => { setType(t); setPage(1); };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-5 py-3 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleTypeChange(f.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
            style={{
              background: type === f.value ? "#c4426a" : "transparent",
              color: type === f.value ? "white" : "var(--muted-foreground)",
              border: type === f.value ? "none" : "1px solid var(--border)",
            }}
          >
            {f.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-xs shrink-0" style={{ color: "var(--muted-foreground)" }}>
            {data.total.toLocaleString()} total
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin" style={{ color: "#c4426a" }} />
        </div>
      ) : !data || data.transactions.length === 0 ? (
        <p className="px-5 py-12 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
          No transactions found
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Date", "User", "Type", "Description", "Amount (coins)", "Amount ($)"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-semibold uppercase tracking-wider ${i >= 4 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--muted-foreground)", background: "var(--card)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx, i) => {
                const isPositive = tx.amount > 0;
                const color = TYPE_COLORS[tx.type] ?? "var(--muted-foreground)";
                const dollarAmt = Math.abs(tx.amount) / C;
                return (
                  <tr
                    key={tx.id}
                    style={{ borderBottom: i < data.transactions.length - 1 ? "1px solid var(--border)" : "none" }}
                  >
                    <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                      {new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      <br />
                      <span>{new Date(tx.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-xs" style={{ color: "var(--foreground)" }}>{tx.user.name}</p>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{tx.user.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="text-xs px-2 py-1 rounded-full font-semibold"
                        style={{ background: color + "20", color }}
                      >
                        {TYPE_LABELS[tx.type] ?? tx.type}
                      </span>
                    </td>
                    <td className="px-5 py-3 max-w-48">
                      <span className="text-xs line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
                        {tx.description ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="font-mono font-semibold text-xs"
                        style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
                      >
                        {isPositive ? "+" : "−"}{Math.abs(tx.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span
                        className="font-semibold text-xs"
                        style={{ color: isPositive ? "#22c55e" : "#ef4444" }}
                      >
                        {isPositive ? "+" : "−"}${dollarAmt.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Page {page} of {data.pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-75"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="p-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-75"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
