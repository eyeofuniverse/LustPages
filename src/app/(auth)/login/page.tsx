"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, BookOpen, Heart, Sparkles, Shield } from "lucide-react";

const BENEFITS = [
  { icon: BookOpen, text: "Access thousands of free stories" },
  { icon: Heart, text: "Bookmark favourites & track your reading" },
  { icon: Sparkles, text: "Like & comment on stories you love" },
  { icon: Shield, text: "Private, adults-only community (18+)" },
];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-1 w-full">
      {/* ── Decorative left panel (desktop only) ───────────────── */}
      <div
        className="hidden lg:flex flex-col justify-center px-14 relative overflow-hidden"
        style={{
          width: "420px",
          flexShrink: 0,
          background:
            "linear-gradient(160deg, rgba(196,66,106,0.14) 0%, rgba(196,66,106,0.04) 60%, transparent 100%)",
          borderRight: "1px solid var(--border)",
        }}
      >
        <div
          className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(196,66,106,0.2) 0%, transparent 70%)",
            transform: "translate(-30%, -30%)",
          }}
        />
        <div className="relative">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
            style={{
              background: "rgba(196,66,106,0.12)",
              color: "#c4426a",
              border: "1px solid rgba(196,66,106,0.25)",
            }}
          >
            <Sparkles size={11} />
            Premium Adult Fiction
          </div>

          <h2
            className="text-3xl font-bold mb-3 leading-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            Welcome back to LustPages
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Your stories, bookmarks, and reading history are waiting for you.
          </p>

          <ul className="space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "rgba(196,66,106,0.12)", border: "1px solid rgba(196,66,106,0.2)" }}
                >
                  <Icon size={16} style={{ color: "#c4426a" }} />
                </div>
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Form panel ─────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-bold mb-1.5"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Sign in
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Enter your credentials to continue reading
            </p>
          </div>

          {error && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{
                background: "rgba(196,66,106,0.08)",
                border: "1px solid rgba(196,66,106,0.25)",
                color: "#c4426a",
              }}
            >
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--foreground)" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                suppressHydrationWarning
                className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                style={{
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  outline: "none",
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--foreground)" }}
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  suppressHydrationWarning
                  className="w-full px-4 py-3 pr-11 rounded-xl text-sm transition-all"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  suppressHydrationWarning
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
              style={{ background: "#c4426a" }}
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 space-y-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: "#c4426a" }}
              >
                Join free
              </Link>
            </p>
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Want to write?{" "}
              <Link
                href="/author-signup"
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: "#c4426a" }}
              >
                Become an author
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
