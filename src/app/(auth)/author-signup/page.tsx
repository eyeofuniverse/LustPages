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
  PenSquare,
  BookOpen,
  Sparkles,
  TrendingUp,
  Coins,
} from "lucide-react";

const BENEFITS = [
  { icon: PenSquare, text: "Publish stories to thousands of readers" },
  { icon: BookOpen, text: "Build your own author profile page" },
  { icon: Coins, text: "Earn coins when readers tip your work" },
  { icon: TrendingUp, text: "Track views, likes & reader engagement" },
  { icon: Sparkles, text: "Organise your stories into series" },
];

const inputStyle = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  outline: "none",
} as const;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AuthorSignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");

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
      const res = await fetch("/api/authors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, penName, bio, website }),
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
            Author Account
          </div>

          <h2
            className="text-3xl font-bold mb-3 leading-tight"
            style={{
              fontFamily: "var(--font-playfair), serif",
              color: "var(--foreground)",
            }}
          >
            Share your stories with the world
          </h2>
          <p className="text-sm mb-10 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            Join our community of authors and reach passionate readers every day.
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
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1
              className="text-2xl sm:text-3xl font-bold mb-1.5"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Start writing on LustPages
            </h1>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Create your author account and publish your first story
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
              Author account created! Redirecting…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account section */}
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                Account Details
              </p>
              <div className="space-y-4">
                <Field label="Display Name">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your real name or nickname"
                    required
                    autoComplete="name"
                    suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Email address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Password">
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
                      style={inputStyle}
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
                </Field>
              </div>
            </div>

            {/* Author profile section */}
            <div
              className="pt-5"
              style={{ borderTop: "1px solid var(--border)" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider mb-4"
                style={{ color: "var(--muted-foreground)" }}
              >
                Author Profile
              </p>
              <div className="space-y-4">
                <Field label="Pen Name" hint="Leave blank to use your display name">
                  <input
                    type="text"
                    value={penName}
                    onChange={(e) => setPenName(e.target.value)}
                    placeholder={name || "e.g. A. N. Other"}
                    suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Bio" hint="Optional — shown on your author profile">
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell readers a little about yourself…"
                    rows={3}
                    suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none transition-all"
                    style={inputStyle}
                  />
                </Field>

                <Field label="Website" hint="Optional — your blog, social link, etc.">
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                    suppressHydrationWarning
                    className="w-full px-4 py-3 rounded-xl text-sm transition-all"
                    style={inputStyle}
                  />
                </Field>
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
              {loading ? "Creating author account…" : "Create Author Account"}
            </button>
          </form>

          <div className="mt-6 pt-6 space-y-2.5" style={{ borderTop: "1px solid var(--border)" }}>
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Just here to read?{" "}
              <Link
                href="/register"
                className="font-semibold hover:opacity-75 transition-opacity"
                style={{ color: "#c4426a" }}
              >
                Create a reader account
              </Link>
            </p>
            <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold hover:opacity-75 transition-opacity"
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
