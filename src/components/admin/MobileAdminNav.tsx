"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, LayoutDashboard, PenSquare, Home, Menu, X, FolderOpen, Tag, Tags, CheckSquare, Megaphone, MessageCircle, Flag, Receipt, Mail, Coins } from "lucide-react";

const NAV_LINKS = [
  { href: "/meminhaj", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/meminhaj/stories", icon: BookOpen, label: "Stories" },
  { href: "/meminhaj/stories/new", icon: PenSquare, label: "New Story" },
  { href: "/meminhaj/approvals", icon: CheckSquare, label: "Approvals" },
  { href: "/meminhaj/categories", icon: FolderOpen, label: "Categories" },
  { href: "/meminhaj/tags", icon: Tag, label: "Tags" },
  { href: "/meminhaj/tag-requests", icon: Tags, label: "Tag Requests" },
  { href: "/meminhaj/ads", icon: Megaphone, label: "Ads" },
  { href: "/meminhaj/accounts", icon: Receipt, label: "Accounts" },
  { href: "/meminhaj/coin-packages", icon: Coins, label: "Coin Packages" },
  { href: "/meminhaj/comments", icon: MessageCircle, label: "Comments" },
  { href: "/meminhaj/reports", icon: Flag, label: "Reports" },
  { href: "/meminhaj/emails", icon: Mail, label: "Emails" },
];

export function MobileAdminNav({ userName }: { userName?: string | null }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Fixed top bar — mobile only */}
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
          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}>
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

      {/* Backdrop */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={close}
        />
      )}

      {/* Drawer */}
      <div
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 flex flex-col py-6 overflow-y-auto"
        style={{
          background: "var(--card)",
          borderRight: "1px solid var(--border)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s ease",
        }}
      >
        <div className="flex items-center justify-between px-6 mb-8">
          <Link href="/" className="flex items-center gap-2" onClick={close}>
            <BookOpen size={18} style={{ color: "#c4426a" }} />
            <span
              className="font-bold text-base"
              style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
            >
              LustPages
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={close}
            className="p-1 rounded-lg"
            style={{ color: "var(--muted-foreground)" }}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3">
          <div className="space-y-1">
            {NAV_LINKS.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-75"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <Link
              href="/"
              onClick={close}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-75"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Home size={16} />
              View Site
            </Link>
          </div>
        </nav>

        {userName && (
          <div className="px-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Signed in as</p>
            <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{userName}</p>
          </div>
        )}
      </div>
    </>
  );
}
