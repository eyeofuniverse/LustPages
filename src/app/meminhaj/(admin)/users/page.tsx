import { getAdminUsers } from "@/lib/queries";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Coins } from "lucide-react";
import { formatDateShort } from "@/lib/utils";
import { UserDeleteButton } from "@/components/admin/UserDeleteButton";
import { UserSuspendButton } from "@/components/admin/UserSuspendButton";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Users" };

const PER_PAGE = 30;

const ROLE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Authors", value: "author" },
  { label: "Admins", value: "admin" },
  { label: "Legacy readers", value: "user" },
];

interface Props {
  searchParams: Promise<{ q?: string; role?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = sp.q ?? "";
  const role = sp.role ?? "all";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const skip = (page - 1) * PER_PAGE;

  const { users, total } = await getAdminUsers({
    take: PER_PAGE,
    skip,
    search: search || undefined,
    role: role !== "all" ? role : undefined,
  });
  const totalPages = Math.ceil(total / PER_PAGE);

  function buildUrl(overrides: { q?: string; role?: string; page?: number }) {
    const params = new URLSearchParams();
    const q = "q" in overrides ? overrides.q : search;
    const r = "role" in overrides ? overrides.role : role;
    const p = "page" in overrides ? overrides.page : page;
    if (q) params.set("q", q);
    if (r && r !== "all") params.set("role", r);
    if (p && p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/meminhaj/users${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Users
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {total.toLocaleString()} {total === 1 ? "user" : "users"}
            {search && ` matching "${search}"`}
            {role !== "all" && ` — ${role === "admin" ? "admins" : role === "author" ? "authors" : "legacy readers"} only`}
          </p>
        </div>
      </div>

      {/* Search + role filter */}
      <div className="flex flex-wrap gap-3 mb-5">
        <form action="/meminhaj/users" className="flex-1 min-w-[200px]">
          {role !== "all" && <input type="hidden" name="role" value={role} />}
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or email…"
            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          />
        </form>

        <div className="flex gap-1.5 flex-wrap">
          {ROLE_FILTERS.map(({ label, value }) => {
            const isActive = role === value;
            return (
              <Link
                key={value}
                href={buildUrl({ role: value, page: 1 })}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: isActive ? "#c4426a" : "var(--card)",
                  color: isActive ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {users.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "var(--muted-foreground)" }}>
            <p className="text-base font-medium mb-1" style={{ color: "var(--foreground)" }}>
              No users found
            </p>
            <p className="text-sm">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>User</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Role</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>Activity</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden lg:table-cell" style={{ color: "var(--muted-foreground)" }}>Coins</th>
                  <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>Joined</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="group transition-colors"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {/* Name + email */}
                    <td className="px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: "var(--foreground)" }}>
                          {user.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                          {user.email}
                        </p>
                        {user.author && (
                          <Link
                            href={`/authors/${user.author.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs mt-0.5 hover:opacity-75"
                            style={{ color: "#c4426a" }}
                          >
                            Author: {user.author.name}
                            <ExternalLink size={10} />
                          </Link>
                        )}
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{
                          background:
                            user.role === "admin"
                              ? "rgba(99,102,241,0.15)"
                              : user.role === "author"
                              ? "rgba(196,66,106,0.1)"
                              : "rgba(128,128,128,0.12)",
                          color:
                            user.role === "admin"
                              ? "#6366f1"
                              : user.role === "author"
                              ? "#c4426a"
                              : "var(--muted-foreground)",
                        }}
                      >
                        {user.role === "admin" ? "Admin" : user.role === "author" ? "Author" : "Reader"}
                      </span>
                    </td>

                    {/* Activity counts */}
                    <td className="px-4 py-3 text-xs hidden md:table-cell" style={{ color: "var(--muted-foreground)" }}>
                      <span title="Comments">{user._count.comments} comments</span>
                      <span className="mx-1">·</span>
                      <span title="Ratings">{user._count.ratings} ratings</span>
                      <span className="mx-1">·</span>
                      <span title="Bookmarks">{user._count.bookmarks} saves</span>
                    </td>

                    {/* Coin balance */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        <Coins size={12} style={{ color: "#c4426a" }} />
                        {user.coinBalance.toLocaleString()}
                      </span>
                    </td>

                    {/* Joined date */}
                    <td className="px-4 py-3 text-xs hidden sm:table-cell" style={{ color: "var(--muted-foreground)" }}>
                      {formatDateShort(new Date(user.createdAt))}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {user.suspended && (
                          <span className="mr-1 px-1.5 py-0.5 rounded text-[10px] font-semibold" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                            Suspended
                          </span>
                        )}
                        <UserSuspendButton id={user.id} name={user.name} suspended={user.suspended} />
                        <UserDeleteButton id={user.id} name={user.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1.5 mt-6" aria-label="Pagination">
          {page > 1 && (
            <Link
              href={buildUrl({ page: page - 1 })}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              <ChevronLeft size={14} /> Prev
            </Link>
          )}
          {buildPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`e${i}`} className="px-2 text-sm" style={{ color: "var(--muted-foreground)" }}>…</span>
            ) : (
              <Link
                key={p}
                href={buildUrl({ page: p as number })}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-all"
                style={{
                  background: p === page ? "#c4426a" : "var(--card)",
                  color: p === page ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--border)",
                }}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            )
          )}
          {page < totalPages && (
            <Link
              href={buildUrl({ page: page + 1 })}
              className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-75"
              style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              Next <ChevronRight size={14} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
