import Link from "next/link";
import { BookOpen } from "lucide-react";

const categories = [
  { label: "Romance", href: "/categories/romance" },
  { label: "Fantasy", href: "/categories/fantasy" },
  { label: "Thriller", href: "/categories/thriller" },
  { label: "Contemporary", href: "/categories/contemporary" },
];

const links = [
  { label: "Browse All Stories", href: "/stories" },
  { label: "Authors", href: "/authors" },
  { label: "Search", href: "/search" },
];

export function Footer() {
  return (
    <footer
      className="mt-auto"
      style={{
        background: "var(--card)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <BookOpen size={20} style={{ color: "#c4426a" }} />
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  color: "#c4426a",
                }}
              >
                LustPages
              </span>
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Your premier destination for premium adult fiction. Read thousands
              of stories across all genres, completely free.
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Categories
            </h3>
            <ul className="space-y-2">
              {categories.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-sm transition-colors hover:opacity-75"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Explore */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Explore
            </h3>
            <ul className="space-y-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm transition-colors hover:opacity-75"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-wider mb-4"
              style={{ color: "var(--foreground)" }}
            >
              Account
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/register"
                  className="text-sm transition-colors hover:opacity-75"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Join Free
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-sm transition-colors hover:opacity-75"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Sign In
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-sm transition-colors hover:opacity-75"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--muted-foreground)",
          }}
        >
          <p>© {new Date().getFullYear()} LustPages. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span
              className="px-2 py-0.5 rounded text-xs font-bold"
              style={{ background: "#c4426a", color: "white" }}
            >
              18+
            </span>
            <span>Adults Only</span>
            <span>·</span>
            <span>All characters are fictional adults (18+)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
