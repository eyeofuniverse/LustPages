import { getAdminReports, getPendingReportsCount } from "@/lib/queries";
import { AdminReportsClient } from "@/components/admin/AdminReportsClient";
import { Flag, AlertCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

const TAB_CONFIG = [
  { key: "pending", label: "Pending", color: "#6366f1" },
  { key: "reviewed", label: "Reviewed", color: "#22c55e" },
  { key: "dismissed", label: "Dismissed", color: "#64748b" },
  { key: "all", label: "All", color: "#c4426a" },
] as const;

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminReportsPage({ searchParams }: Props) {
  const { status: rawStatus } = await searchParams;
  const activeStatus = TAB_CONFIG.some((t) => t.key === rawStatus) ? rawStatus! : "pending";

  const [reports, pendingCount] = await Promise.all([
    getAdminReports({ status: activeStatus }),
    getPendingReportsCount(),
  ]);

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Reports
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              User-submitted content reports
            </p>
          </div>
          {pendingCount > 0 && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <AlertCircle size={14} />
              {pendingCount} pending
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl mb-6 overflow-x-auto"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {TAB_CONFIG.map(({ key, label, color }) => {
          const active = activeStatus === key;
          return (
            <Link
              key={key}
              href={`/meminhaj/reports?status=${key}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all"
              style={{
                background: active ? color + "20" : "transparent",
                color: active ? color : "var(--muted-foreground)",
                border: active ? `1px solid ${color}40` : "1px solid transparent",
              }}
            >
              {label}
              {key === "pending" && pendingCount > 0 && (
                <span
                  className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: color + "25", color }}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <AdminReportsClient reports={reports} activeStatus={activeStatus} />
    </div>
  );
}
