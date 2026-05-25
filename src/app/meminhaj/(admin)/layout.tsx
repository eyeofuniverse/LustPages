import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getPendingStoriesCount, getPendingReportsCount, getPendingTagRequestsCount } from "@/lib/queries";
import { BookOpen, LayoutDashboard, PenSquare, Home, FolderOpen, Tag, CheckSquare, Megaphone, Sparkles, MessageCircle, Flag, Tags, Receipt, Mail, Coins, Layers, Library } from "lucide-react";
import { MobileAdminNav } from "@/components/admin/MobileAdminNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") {
    redirect("/meminhaj/login");
  }
  const [pendingCount, pendingReports, pendingTagRequests] = await Promise.all([
    getPendingStoriesCount(),
    getPendingReportsCount(),
    getPendingTagRequestsCount(),
  ]);

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Desktop sidebar — hidden on mobile, fixed on lg+ */}
      <aside
        className="hidden lg:flex w-60 fixed inset-y-0 left-0 z-30 flex-col py-6"
        style={{ background: "var(--card)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-6 mb-8">
          <Link href="/" className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#c4426a" }} />
            <span
              className="font-bold text-lg"
              style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
            >
              LustPages
            </span>
          </Link>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
            Admin Panel
          </p>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--border) transparent" }}>
          <div className="space-y-1">
            <AdminLink href="/meminhaj" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <AdminLink href="/meminhaj/stories" icon={<BookOpen size={16} />} label="Stories" />
            <AdminLink href="/meminhaj/series" icon={<Layers size={16} />} label="Series" />
            <AdminLink href="/meminhaj/collections" icon={<Library size={16} />} label="Collections" />
            <AdminLink href="/meminhaj/stories/new" icon={<PenSquare size={16} />} label="New Story" />
            <AdminLink href="/meminhaj/categories" icon={<FolderOpen size={16} />} label="Categories" />
            <AdminLink href="/meminhaj/tags" icon={<Tag size={16} />} label="Tags" />
            <AdminLink
              href="/meminhaj/tag-requests"
              icon={<Tags size={16} />}
              label="Tag Requests"
              badge={pendingTagRequests}
            />
            <AdminLink
              href="/meminhaj/approvals"
              icon={<CheckSquare size={16} />}
              label="Approvals"
              badge={pendingCount}
            />
            <AdminLink href="/meminhaj/ads" icon={<Megaphone size={16} />} label="Ads" />
            <AdminLink href="/meminhaj/featured" icon={<Sparkles size={16} />} label="Featured" />
            <AdminLink href="/meminhaj/accounts" icon={<Receipt size={16} />} label="Accounts" />
            <AdminLink href="/meminhaj/coin-packages" icon={<Coins size={16} />} label="Coin Packages" />
            <AdminLink href="/meminhaj/comments" icon={<MessageCircle size={16} />} label="Comments" />
            <AdminLink
              href="/meminhaj/reports"
              icon={<Flag size={16} />}
              label="Reports"
              badge={pendingReports}
            />
            <AdminLink href="/meminhaj/emails" icon={<Mail size={16} />} label="Emails" />
          </div>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <AdminLink href="/" icon={<Home size={16} />} label="View Site" />
          </div>
        </nav>

        <div className="px-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Signed in as</p>
          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
            {session.user?.name}
          </p>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <MobileAdminNav userName={session.user?.name} />

      {/* Main content — offset for desktop sidebar, top-padded for mobile header */}
      <main className="lg:ml-60 min-h-screen">
        <div className="px-4 pt-18 pb-8 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function AdminLink({
  href,
  icon,
  label,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-75"
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
