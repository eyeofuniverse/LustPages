"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}

export function AdminNavLink({ href, icon, label, badge }: Props) {
  const pathname = usePathname();
  // Exact match for dashboard root; prefix match for sub-sections
  const isActive =
    href === "/meminhaj"
      ? pathname === "/meminhaj"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: isActive ? "rgba(196,66,106,0.1)" : "transparent",
        color: isActive ? "#c4426a" : "var(--muted-foreground)",
      }}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge != null && badge > 0 && (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}
