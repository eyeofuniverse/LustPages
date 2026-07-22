import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingStoriesCount, getPendingReportsCount, getPendingTagRequestsCount } from "@/lib/queries";
import {
  BookOpen, LayoutDashboard, PenSquare, Home, FolderOpen, Tag, CheckSquare,
  Megaphone, Sparkles, MessageCircle, Flag, Tags, Receipt, Mail, Coins,
  Layers, Library, UserCircle, Users, UserRound, BarChart2, SearchCode, KeyRound, Star,
} from "lucide-react";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import { Toaster } from "sonner";
import type { Metadata } from "next";
import type { AdminPermissionKey } from "@/lib/admin-permissions";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

type AdminUser = {
  name?: string | null;
  role?: string;
  isSuperAdmin?: boolean;
  adminPermissions?: string[];
  adminNickname?: string | null;
};

export type NavItem = {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  permission: AdminPermissionKey | "super_admin" | null;
};

type NavGroup = {
  label: string | null;
  items: NavItem[];
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user || user.role !== "admin") redirect("/meminhaj/login");

  const isSuperAdmin = user.isSuperAdmin ?? false;
  const permissions = user.adminPermissions ?? [];
  const displayName = user.adminNickname ?? user.name;

  const [pendingCount, pendingReports, pendingTagRequests] = await Promise.all([
    getPendingStoriesCount(),
    getPendingReportsCount(),
    getPendingTagRequestsCount(),
  ]);

  const NAV_GROUPS: NavGroup[] = [
    {
      label: null,
      items: [
        { href: "/meminhaj", icon: <LayoutDashboard size={16} />, label: "Dashboard", permission: null },
      ],
    },
    {
      label: "Content",
      items: [
        { href: "/meminhaj/stories", icon: <BookOpen size={16} />, label: "Stories", permission: "stories" },
        { href: "/meminhaj/series", icon: <Layers size={16} />, label: "Series", permission: "stories" },
        { href: "/meminhaj/collections", icon: <Library size={16} />, label: "Collections", permission: "stories" },
        { href: "/meminhaj/stories/new", icon: <PenSquare size={16} />, label: "New Story", permission: "stories" },
      ],
    },
    {
      label: "Taxonomy",
      items: [
        { href: "/meminhaj/categories", icon: <FolderOpen size={16} />, label: "Categories", permission: "categories" },
        { href: "/meminhaj/tags", icon: <Tag size={16} />, label: "Tags", permission: "tags" },
        { href: "/meminhaj/tag-requests", icon: <Tags size={16} />, label: "Tag Requests", badge: pendingTagRequests, permission: "tags" },
        { href: "/meminhaj/search-synonyms", icon: <SearchCode size={16} />, label: "Search Synonyms", permission: "tags" },
      ],
    },
    {
      label: "People",
      items: [
        { href: "/meminhaj/authors", icon: <UserRound size={16} />, label: "Authors", permission: "authors" },
        { href: "/meminhaj/users", icon: <Users size={16} />, label: "Users", permission: "users" },
      ],
    },
    {
      label: "Moderation",
      items: [
        { href: "/meminhaj/approvals", icon: <CheckSquare size={16} />, label: "Approvals", badge: pendingCount, permission: "approvals" },
        { href: "/meminhaj/comments", icon: <MessageCircle size={16} />, label: "Comments", permission: "comments" },
        { href: "/meminhaj/reports", icon: <Flag size={16} />, label: "Reports", badge: pendingReports, permission: "reports" },
        { href: "/meminhaj/ratings", icon: <Star size={16} />, label: "Ratings", permission: "ratings" },
      ],
    },
    {
      label: "Monetization",
      items: [
        { href: "/meminhaj/accounts", icon: <Receipt size={16} />, label: "Accounts", permission: "accounts" },
        { href: "/meminhaj/coin-packages", icon: <Coins size={16} />, label: "Coin Packages", permission: "coin_packages" },
      ],
    },
    {
      label: "Marketing",
      items: [
        { href: "/meminhaj/featured", icon: <Sparkles size={16} />, label: "Featured", permission: "featured" },
        { href: "/meminhaj/ads", icon: <Megaphone size={16} />, label: "Ads", permission: "ads" },
        { href: "/meminhaj/emails", icon: <Mail size={16} />, label: "Emails", permission: "emails" },
      ],
    },
    {
      label: "Analytics",
      items: [
        { href: "/meminhaj/analytics", icon: <BarChart2 size={16} />, label: "Analytics", permission: "analytics" },
      ],
    },
  ];

  function filterGroup(group: NavGroup): NavItem[] {
    return group.items.filter(({ permission }) => {
      if (permission === null) return true;
      if (isSuperAdmin) return true;
      return permissions.includes(permission);
    });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex w-60 fixed inset-y-0 left-0 z-30 flex-col py-6"
        style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}
      >
        {/* Logo */}
        <div className="px-6 mb-6">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#c4426a" }} />
            <span
              className="font-bold text-lg"
              style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
            >
              LustPages
            </span>
          </Link>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Admin Panel</p>
        </div>

        {/* Nav groups */}
        <nav
          className="flex-1 px-3 overflow-y-auto space-y-1"
          style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}
        >
          {NAV_GROUPS.map((group, gi) => {
            const visible = filterGroup(group);
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
                  {visible.map((item) => (
                    <AdminLink key={item.href} {...item} />
                  ))}
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
                <AdminLink href="/meminhaj/admins" icon={<Users size={16} />} label="Admin Team" permission={null} />
              </div>
            </div>
          )}

          {/* View Site */}
          <div className="pt-4 mt-2" style={{ borderTop: "1px solid var(--border)" }}>
            <AdminLink href="/" icon={<Home size={16} />} label="View Site" permission={null} />
          </div>
        </nav>

        {/* Profile footer */}
        <div className="px-3 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/meminhaj/profile"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all hover:opacity-75"
          >
            <UserCircle size={16} style={{ color: "#c4426a" }} />
            <div className="min-w-0 flex-1">
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Signed in as</p>
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                {displayName}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile nav */}
      <MobileAdminNav
        userName={displayName}
        isSuperAdmin={isSuperAdmin}
        adminPermissions={permissions}
        pendingCounts={{ approvals: pendingCount, reports: pendingReports, tagRequests: pendingTagRequests }}
      />

      {/* Main */}
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 pt-18 pb-8 lg:p-8">
          {children}
        </div>
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  );
}

function AdminLink({ href, icon, label, badge }: NavItem) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-75"
      style={{ color: "var(--muted-foreground)" }}
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
