"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Heart,
  PenSquare,
  Coins,
  TrendingUp,
} from "lucide-react";

const BENEFITS = [
  { icon: BookOpen, text: "Read thousands of stories for free" },
  { icon: Heart, text: "Bookmark and like your favourite stories" },
  { icon: PenSquare, text: "Publish your own stories to thousands of readers" },
  { icon: Coins, text: "Earn coins when readers tip or unlock your work" },
  { icon: TrendingUp, text: "Track views, likes, and reader engagement" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      setSuccess(true);
      await signIn("credentials", { email, password, redirect: false });
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
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
            <PenSquare size={11} />
            Read. Write. Earn.
          </div>

          <h2
            className="text-3xl font-bold mb-3 leading-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            One account for readers and authors
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Join LustPages and do it all — dive into thousands of stories or publish your own and start earning.
          </p>

          <ul className="space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: "rgba(196,66,106,0.12)",
                    border: "1px solid rgba(196,66,106,0.2)",
                  }}
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
              Create your account
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Free forever — anyone can read and publish stories
            </p>
          </div>

          {/* Writing pitch banner */}
          <div
            className="flex items-start gap-3 p-3.5 rounded-xl mb-5"
            style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
          >
            <PenSquare size={15} className="shrink-0 mt-0.5" style={{ color: "#c4426a" }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-semibold" style={{ color: "#c4426a" }}>Anyone can publish stories and earn.</span>{" "}
              Your author dashboard is ready the moment you sign up — no separate application needed.
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

          {success && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                color: "#22c55e",
              }}
            >
              <CheckCircle size={15} />
              Account created! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                Display Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name or pen name"
                required
                autoComplete="name"
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
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
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  autoComplete="new-password"
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

            <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              By registering you confirm you are 18+ and agree to our terms.
            </p>

            <button
              type="submit"
              disabled={loading || success}
              suppressHydrationWarning
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
              style={{ background: "#c4426a" }}
            >
              {loading ? "Creating account…" : "Create Free Account"}
            </button>
          </form>

          <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: "#c4426a" }}
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
