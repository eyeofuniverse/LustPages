"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Wallet, Check, X, Loader2, ExternalLink, Clock, ChevronLeft, ChevronRight } from "lucide-react";

interface PayoutRequest {
  id: string;
  coinsRequested: number;
  usdAmount: number;
  method: string;
  accountDetails: string;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    slug: string;
    user: { email: string } | null;
  };
}

const STATUS_FILTERS = [
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

const METHOD_LABELS: Record<string, string> = {
  bank: "Bank Transfer",
  paypal: "PayPal",
  crypto: "Crypto",
};

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Pending" },
  paid: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", label: "Paid" },
  rejected: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", label: "Rejected" },
};

export default function PayoutsPage() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ requests: PayoutRequest[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/payouts?status=${statusFilter}&page=${page}`);
      setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleFilterChange = (f: string) => { setStatusFilter(f); setPage(1); };

  async function updateStatus(id: string, status: "paid" | "rejected") {
    const label = status === "paid" ? "Mark as Paid" : "Reject";
    if (!confirm(`${label} this payout request?`)) return;
    setActing(id);
    try {
      await fetch("/api/admin/payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      await load();
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Payout Requests
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Author payout requests — mark as paid once processed, or reject if invalid.
        </p>
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: statusFilter === f.value ? "#c4426a" : "var(--card)",
              color: statusFilter === f.value ? "white" : "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {f.label}
          </button>
        ))}
        {data && (
          <span className="ml-auto text-xs self-center" style={{ color: "var(--muted-foreground)" }}>
            {data.total.toLocaleString()} request{data.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={22} className="animate-spin" style={{ color: "#c4426a" }} />
          </div>
        ) : !data || data.requests.length === 0 ? (
          <div className="text-center py-20">
            <Wallet size={36} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <p className="font-medium" style={{ color: "var(--foreground)" }}>No {statusFilter !== "all" ? statusFilter : ""} payout requests</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Date", "Author", "Amount", "Method", "Account", "Status", "Actions"].map((h, i) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-left"
                      style={{ color: "var(--muted-foreground)", background: "var(--muted)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.requests.map((req, i) => {
                  const style = STATUS_STYLES[req.status] ?? STATUS_STYLES.pending;
                  return (
                    <tr
                      key={req.id}
                      style={{ borderBottom: i < data.requests.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/authors/${req.author.slug}`}
                          target="_blank"
                          className="flex items-center gap-1 font-medium hover:opacity-75 transition-opacity"
                          style={{ color: "#c4426a" }}
                        >
                          {req.author.name} <ExternalLink size={11} />
                        </Link>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {req.author.user?.email ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold" style={{ color: "#22c55e" }}>${req.usdAmount.toFixed(2)}</p>
                        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{req.coinsRequested.toLocaleString()} coins</p>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                        {METHOD_LABELS[req.method] ?? req.method}
                      </td>
                      <td className="px-4 py-3 max-w-48">
                        <p className="text-xs font-mono break-all" style={{ color: "var(--muted-foreground)" }}>
                          {req.accountDetails}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: style.bg, color: style.color }}>
                          {style.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {req.status === "pending" && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => updateStatus(req.id, "paid")}
                              disabled={acting === req.id}
                              title="Mark as Paid"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75 disabled:opacity-40"
                              style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e" }}
                            >
                              {acting === req.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                            </button>
                            <button
                              onClick={() => updateStatus(req.id, "rejected")}
                              disabled={acting === req.id}
                              title="Reject"
                              className="p-1.5 rounded-lg transition-opacity hover:opacity-75 disabled:opacity-40"
                              style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                            >
                              <X size={13} />
                            </button>
                          </div>
                        )}
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
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Page {page} of {data.pages}</span>
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
    </div>
  );
}
