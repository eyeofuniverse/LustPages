"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

const STATUS_TABS = [
  { value: "all",       label: "All" },
  { value: "published", label: "Published" },
  { value: "draft",     label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "pending",   label: "Pending" },
  { value: "rejected",  label: "Rejected" },
] as const;

export function AdminStoriesFilters({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? "all";
  const currentSearch = searchParams.get("q") ?? "";

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      params.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex flex-col gap-3 mb-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          type="search"
          defaultValue={currentSearch}
          placeholder="Search title or author…"
          onChange={(e) =>
            pushParams({ q: e.target.value || null })
          }
          className="w-full pl-8 pr-3 py-2 text-sm rounded-xl outline-none border-0"
          style={{
            background: "var(--muted)",
            color: "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        />
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap items-center gap-1.5">
        {STATUS_TABS.map((tab) => {
          const active = currentStatus === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => pushParams({ status: tab.value === "all" ? null : tab.value })}
              className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? "#c4426a" : "var(--muted)",
                color: active ? "white" : "var(--muted-foreground)",
                border: active ? "1px solid #c4426a" : "1px solid var(--border)",
              }}
            >
              {tab.label}
              {tab.value === "all" && (
                <span className="ml-1.5 opacity-70">{total}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
