"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, LayoutDashboard, PenSquare, Home, Menu, X, FolderOpen, Tag,
  Tags, CheckSquare, Megaphone, MessageCircle, Flag, Receipt, Mail, Coins,
  Sparkles, Layers, Library, UserCircle, Users, UserRound, BarChart2,
} from "lucide-react";
import type { AdminPermissionKey } from "@/lib/admin-permissions";

type PendingCounts = { approvals: number; reports: number; tagRequests: number };

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  permission: AdminPermissionKey | "super_admin" | null;
  badgeKey?: keyof PendingCounts;
};

type NavGroup = {
  label: string | null;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { href: "/meminhaj", icon: LayoutDashboard, label: "Dashboard", permission: null },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/meminhaj/stories", icon: BookOpen, label: "Stories", permission: "stories" },
      { href: "/meminhaj/series", icon: Layers, label: "Series", permission: "stories" },
      { href: "/meminhaj/collections", icon: Library, label: "Collections", permission: "stories" },
      { href: "/meminhaj/stories/new", icon: PenSquare, label: "New Story", permission: "stories" },
    ],
  },
  {
    label: "Taxonomy",
    items: [
      { href: "/meminhaj/categories", icon: FolderOpen, label: "Categories", permission: "categories" },
      { href: "/meminhaj/tags", icon: Tag, label: "Tags", permission: "tags" },
      { href: "/meminhaj/tag-requests", icon: Tags, label: "Tag Requests", permission: "tags", badgeKey: "tagRequests" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/meminhaj/authors", icon: UserRound, label: "Authors", permission: "authors" },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/meminhaj/approvals", icon: CheckSquare, label: "Approvals", permission: "approvals", badgeKey: "approvals" },
      { href: "/meminhaj/comments", icon: MessageCircle, label: "Comments", permission: "comments" },
      { href: "/meminhaj/reports", icon: Flag, label: "Reports", permission: "reports", badgeKey: "reports" },
    ],
  },
  {
    label: "Monetization",
    items: [
      { href: "/meminhaj/accounts", icon: Receipt, label: "Accounts", permission: "accounts" },
      { href: "/meminhaj/coin-packages", icon: Coins, label: "Coin Packages", permission: "coin_packages" },
    ],
  },
  {
    label: "Marketing",
    items: [
      { href: "/meminhaj/featured", icon: Sparkles, label: "Featured", permission: "featured" },
      { href: "/meminhaj/ads", icon: Megaphone, label: "Ads", permission: "ads" },
      { href: "/meminhaj/emails", icon: Mail, label: "Emails", permission: "emails" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/meminhaj/visitors", icon: BarChart2, label: "Visitors", permission: "analytics" },
    ],
  },
];

export function MobileAdminNav({
  userName,
  isSuperAdmin = false,
  adminPermissions = [],
  pendingCounts = { approvals: 0, reports: 0, tagRequests: 0 },
}: {
  userName?: string | null;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
  pendingCounts?: PendingCounts;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  function filterItems(items: NavItem[]) {
    return items.filter(({ permission }) => {
      if (permission === null) return true;
      if (isSuperAdmin) return true;
      return adminPermissions.includes(permission);
    });
  }

  return (
    <>
      <header
        className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14"
        style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/meminhaj" className="flex items-center gap-2">
          <BookOpen size={18} style={{ color: "#c4426a" }} />
          <span
            className="font-bold text-base"
            style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
          >
            LustPages
          </span>
          <span
            className="text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
          >
            Admin
          </span>
        </Link>
        <button
          type="button"
          aria-label="Open navigation"
          onClick={() => setOpen(true)}
          className="p-2 rounded-xl"
          style={{ color: "var(--foreground)" }}
        >
          <Menu size={20} />
        </button>
      </header>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={close} />}

      <div
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col py-6 overflow-y-auto"
        style={{
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <div className="flex items-center justify-between px-6 mb-6">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <BookOpen size={18} style={{ color: "#c4426a" }} />
            <span className="font-bold text-base" style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}>
              LustPages
            </span>
          </Link>
          <button type="button" aria-label="Close navigation" onClick={close} className="p-1 rounded-lg" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV_GROUPS.map((group, gi) => {
            const visible = filterItems(group.items);
            if (visible.length === 0) return null;
            return (
              <div key={gi} className={gi > 0 ? "pt-3" : ""}>
                {group.label && (
                  <p
                    className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--muted-foreground)", opacity: 0.45 }}
                  >
                    {group.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {visible.map(({ href, icon: Icon, label, badgeKey }) => {
                    const badge = badgeKey ? pendingCounts[badgeKey] : undefined;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={close}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-75"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <Icon size={16} />
                        <span className="flex-1">{label}</span>
                        {badge != null && badge > 0 && (
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
                            {badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Super admin only */}
          {isSuperAdmin && (
            <div className="pt-3">
              <p
                className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--muted-foreground)", opacity: 0.45 }}
              >
                Admin
              </p>
              <div className="space-y-0.5">
                <Link
                  href="/meminhaj/admins"
                  onClick={close}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-75"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Users size={16} />
                  Admin Team
                </Link>
              </div>
            </div>
          )}

          <div className="pt-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <Link
              href="/"
              onClick={close}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-75"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Home size={16} />
              View Site
            </Link>
          </div>
        </nav>

        <div className="px-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/meminhaj/profile"
            onClick={close}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:opacity-75"
          >
            <UserCircle size={16} style={{ color: "#c4426a" }} />
            <div className="min-w-0">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Signed in as</p>
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{userName}</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
}
