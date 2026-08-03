"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import {
  BookOpen, Search, Menu, X, User, LogOut, Heart, Library,
  LayoutDashboard, ChevronDown, PenSquare, Coins, Lock, Layers, Tag, TrendingUp,
} from "lucide-react";
import { CoinBadge } from "@/components/coins/CoinBadge";

interface Category {
  id: string; name: string; slug: string; color: string;
  _count: { stories: number };
}

interface HeaderProps {
  categories: Category[];
}

export function Header({ categories }: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [mobileBrowseOpen, setMobileBrowseOpen] = useState(false);
  const browseRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (browseRef.current && !browseRef.current.contains(e.target as Node)) setBrowseOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setBrowseOpen(false);
    setMobileBrowseOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);
  const navCategories = categories.filter((cat) => cat._count.stories >= 10);
  const isAuthor = !!(session?.user as { authorId?: string | null } | undefined)?.authorId;
  const authorSlug = (session?.user as { authorSlug?: string } | undefined)?.authorSlug;
  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  return (
    <>
      <header
        className="sticky top-0 z-40 w-full"
        style={{
          background: "rgba(13,13,15,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <BookOpen size={22} style={{ color: "#c4426a" }} />
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
              >
                LustPages
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              <Link
                href="/stories"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname === "/stories" ? "#c4426a" : "var(--muted-foreground)" }}
              >
                Stories
              </Link>

              <Link
                href="/series"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname === "/series" ? "#c4426a" : "var(--muted-foreground)" }}
              >
                Series
              </Link>

              {/* Browse dropdown */}
              <div ref={browseRef} className="relative">
                <button
                  onClick={() => setBrowseOpen((v) => !v)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: browseOpen ? "#c4426a" : "var(--muted-foreground)" }}
                  aria-expanded={browseOpen}
                  aria-haspopup="true"
                >
                  Browse
                  <ChevronDown size={13} style={{ transform: browseOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                {browseOpen && (
                  <div
                    className="absolute left-0 top-full mt-2 z-50 rounded-2xl overflow-hidden flex"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      width: "660px",
                      boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
                    }}
                  >
                    {/* LEFT — Genres */}
                    <div className="flex-1 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>
                        Genres
                      </p>
                      <div className="grid grid-cols-3 gap-0.5">
                        {navCategories.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/categories/${cat.slug}`}
                            onClick={() => setBrowseOpen(false)}
                            className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors hover:bg-white/5"
                            style={{ color: "var(--foreground)" }}
                          >
                            <span
                              className="w-7 h-9 rounded-md shrink-0"
                              style={{
                                background: `linear-gradient(160deg, ${cat.color}50 0%, ${cat.color}90 100%)`,
                                border: `1px solid ${cat.color}35`,
                              }}
                            />
                            <span className="flex-1 min-w-0">
                              <span className="block truncate font-medium text-[13px]">{cat.name}</span>
                              <span className="block text-[11px] tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                                {cat._count.stories} stories
                              </span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* DIVIDER */}
                    <div className="w-px shrink-0 my-4" style={{ background: "var(--border)" }} />

                    {/* RIGHT — Discover */}
                    <div className="w-52 shrink-0 p-5 flex flex-col">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)" }}>
                        Discover
                      </p>
                      <div className="flex flex-col gap-0.5 flex-1">
                        {[
                          { href: "/trending",        icon: <TrendingUp size={14} />, label: "Trending",    sub: "Hot this week",       color: "#f59e0b" },
                          { href: "/series",          icon: <Layers size={14} />,     label: "Series",      sub: "Story collections",   color: "#3b82f6" },
                          { href: "/premium/stories", icon: <Lock size={14} />,       label: "Premium",     sub: "Exclusive content",   color: "#a855f7" },
                          { href: "/collections",     icon: <Layers size={14} />,     label: "Collections", sub: "Curated picks",       color: "#22c55e" },
                          { href: "/authors",         icon: <PenSquare size={14} />,  label: "Authors",     sub: "Meet the writers",    color: "#ec4899" },
                        ].map(({ href, icon, label, sub, color }) => (
                          <Link
                            key={href}
                            href={href}
                            onClick={() => setBrowseOpen(false)}
                            className="flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-colors hover:bg-white/5"
                            style={{ color: "var(--foreground)" }}
                          >
                            <span
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ background: color + "18" }}
                            >
                              <span style={{ color }}>{icon}</span>
                            </span>
                            <span>
                              <span className="block text-[13px] font-semibold">{label}</span>
                              <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{sub}</span>
                            </span>
                          </Link>
                        ))}
                      </div>

                      {/* CTA */}
                      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                        <Link
                          href="/stories"
                          onClick={() => setBrowseOpen(false)}
                          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          style={{ background: "#c4426a" }}
                        >
                          Browse All Stories →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/tags"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname === "/tags" ? "#c4426a" : "var(--muted-foreground)" }}
              >
                Tags
              </Link>

              <Link
                href="/authors"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname === "/authors" ? "#c4426a" : "var(--muted-foreground)" }}
              >
                Authors
              </Link>

              <Link
                href="/store"
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: pathname === "/store" ? "#c4426a" : "var(--muted-foreground)" }}
              >
                Get Coins
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* CoinBadge — hide on smallest screens to preserve space */}
              <div className="hidden sm:block">
                <CoinBadge />
              </div>

              {/* Search */}
              <Link
                href="/search"
                className="p-2 rounded-lg transition-opacity hover:opacity-75"
                style={{ color: "var(--muted-foreground)" }}
                aria-label="Search stories"
              >
                <Search size={18} />
              </Link>

              {/* User dropdown — desktop only */}
              {session ? (
                <div ref={userMenuRef} className="relative hidden md:block">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{ background: "var(--muted)", color: "var(--foreground)" }}
                    aria-expanded={userMenuOpen}
                  >
                    <User size={15} />
                    <span className="max-w-24 truncate">{session.user?.name?.split(" ")[0]}</span>
                    <ChevronDown size={13} style={{ transform: userMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </button>

                  {userMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-xl shadow-2xl overflow-hidden z-50"
                      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                    >
                      <div className="px-4 py-3 border-b text-xs" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                        {session.user?.email}
                      </div>
                      <Link href="/store" className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "#f59e0b" }} onClick={() => setUserMenuOpen(false)}>
                        <Coins size={15} /> Buy Coins
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }} onClick={() => setUserMenuOpen(false)}>
                        <Library size={15} /> My Library
                      </Link>
                      {isAuthor ? (
                        <>
                          <Link href="/author-dashboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }} onClick={() => setUserMenuOpen(false)}>
                            <PenSquare size={15} /> My Dashboard
                          </Link>
                          {authorSlug && (
                            <Link href={`/authors/${authorSlug}`} className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }} onClick={() => setUserMenuOpen(false)}>
                              <PenSquare size={15} /> Author Profile
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link href="/author-signup" className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "#c4426a" }} onClick={() => setUserMenuOpen(false)}>
                          <PenSquare size={15} /> Become an Author
                        </Link>
                      )}
                      {isAdmin && (
                        <Link href="/meminhaj" className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-opacity hover:opacity-75" style={{ color: "#c4426a" }} onClick={() => setUserMenuOpen(false)}>
                          <LayoutDashboard size={15} /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t" style={{ borderColor: "var(--border)" }} />
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left transition-opacity hover:opacity-75"
                        style={{ color: "var(--muted-foreground)" }}
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className="px-3 py-1.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
                    Login
                  </Link>
                  <Link href="/author-signup" className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-75" style={{ color: "#c4426a", border: "1px solid rgba(196,66,106,0.4)" }}>
                    <PenSquare size={13} /> Write
                  </Link>
                  <Link href="/register" className="px-4 py-1.5 text-sm font-semibold rounded-lg text-white transition-opacity hover:opacity-90" style={{ background: "#c4426a" }}>
                    Join Free
                  </Link>
                </div>
              )}

              {/* Mobile hamburger — always last, always reachable */}
              <button
                className="md:hidden p-2 rounded-lg transition-opacity hover:opacity-75"
                style={{ color: "var(--foreground)" }}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
                aria-expanded={mobileOpen}
              >
                <Menu size={22} />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {/* Backdrop */}
      <div
        className="md:hidden fixed inset-0 z-50 bg-black/60 transition-opacity duration-200"
        style={{ opacity: mobileOpen ? 1 : 0, pointerEvents: mobileOpen ? "auto" : "none" }}
        onClick={closeMobile}
        aria-hidden="true"
      />

      {/* Slide-in panel from right */}
      <div
        className="md:hidden fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] flex flex-col overflow-y-auto"
        style={{
          background: "var(--card)",
          borderLeft: "1px solid var(--border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
        }}
        aria-label="Mobile navigation"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 h-16 shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/" onClick={closeMobile} className="flex items-center gap-2">
            <BookOpen size={20} style={{ color: "#c4426a" }} />
            <span className="font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}>LustPages</span>
          </Link>
          <button onClick={closeMobile} className="p-2 rounded-lg transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)" }} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col px-4 py-4 gap-1 overflow-y-auto">

          {/* Logged-in user section */}
          {session && (
            <div className="mb-3 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1 rounded-xl" style={{ background: "var(--muted)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(196,66,106,0.15)", color: "#c4426a" }}>
                  <User size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{session.user?.name}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{session.user?.email}</p>
                </div>
              </div>
              <Link href="/store" onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#f59e0b" }}>
                <Coins size={15} /> Buy Coins
              </Link>
              <Link href="/profile" onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }}>
                <Library size={15} /> My Library
              </Link>
              {isAuthor ? (
                <>
                  <Link href="/author-dashboard" onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }}>
                    <PenSquare size={15} /> My Dashboard
                  </Link>
                  {authorSlug && (
                    <Link href={`/authors/${authorSlug}`} onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "var(--foreground)" }}>
                      <PenSquare size={15} /> Author Profile
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/author-signup" onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                  <PenSquare size={15} /> Become an Author
                </Link>
              )}
              {isAdmin && (
                <Link href="/meminhaj" onClick={closeMobile} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                  <LayoutDashboard size={15} /> Admin Panel
                </Link>
              )}
              <button
                onClick={() => { signOut(); closeMobile(); }}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-opacity hover:opacity-75"
                style={{ color: "var(--muted-foreground)" }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}

          {/* Main nav links */}
          <NavItem href="/stories" label="Stories" icon={<BookOpen size={16} />} onClick={closeMobile} active={pathname === "/stories"} />
          <NavItem href="/series" label="Series" icon={<Layers size={16} />} onClick={closeMobile} active={pathname === "/series"} />
          <NavItem href="/trending" label="Trending" icon={<TrendingUp size={16} />} onClick={closeMobile} active={pathname === "/trending"} />
          <NavItem href="/tags" label="Tags" icon={<Tag size={16} />} onClick={closeMobile} active={pathname === "/tags"} />
          <NavItem href="/premium/stories" label="Premium" icon={<Lock size={16} />} onClick={closeMobile} active={pathname.startsWith("/premium")} />
          <NavItem href="/authors" label="Authors" icon={<User size={16} />} onClick={closeMobile} active={pathname === "/authors"} />
          <NavItem href="/store" label="Get Coins" icon={<Coins size={16} />} onClick={closeMobile} active={pathname === "/store"} />

          {/* Browse by genre accordion */}
          <div className="mt-1">
            <button
              onClick={() => setMobileBrowseOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
              style={{ color: "var(--muted-foreground)" }}
              aria-expanded={mobileBrowseOpen}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen size={16} />
                Browse by Genre
              </span>
              <ChevronDown size={13} style={{ transform: mobileBrowseOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>

            {mobileBrowseOpen && (
              <div className="mt-1 grid grid-cols-2 gap-1 px-1">
                {navCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    onClick={closeMobile}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
                    style={{ background: cat.color + "15", color: "var(--foreground)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cat.color }} />
                    <span className="truncate">{cat.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Guest CTA */}
          {!session && (
            <div className="mt-4 pt-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
              <Link href="/register" onClick={closeMobile} className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90" style={{ background: "#c4426a" }}>
                Join Free
              </Link>
              <Link href="/login" onClick={closeMobile} className="flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                Log In
              </Link>
              <Link href="/author-signup" onClick={closeMobile} className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75" style={{ color: "#c4426a" }}>
                <PenSquare size={13} /> Start Writing
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function NavItem({ href, label, icon, onClick, active }: { href: string; label: string; icon: React.ReactNode; onClick: () => void; active: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
      style={{ color: active ? "#c4426a" : "var(--muted-foreground)", background: active ? "rgba(196,66,106,0.08)" : "transparent" }}
    >
      {icon}
      {label}
    </Link>
  );
}
