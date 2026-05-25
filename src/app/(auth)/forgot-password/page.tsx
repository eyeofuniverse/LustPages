"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSent(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16 sm:px-8">
      <div className="w-full max-w-sm">
        {sent ? (
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "rgba(196,66,106,0.12)", border: "1px solid rgba(196,66,106,0.25)" }}
            >
              <CheckCircle size={28} style={{ color: "#c4426a" }} />
            </div>
            <h1
              className="text-2xl font-bold mb-3"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Check your email
            </h1>
            <p className="text-sm mb-8 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              If an account exists for <strong style={{ color: "var(--foreground)" }}>{email}</strong>,
              you&apos;ll receive a password reset link within a few minutes.
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Didn&apos;t get it?{" "}
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="font-semibold transition-opacity hover:opacity-75"
                style={{ color: "#c4426a" }}
              >
                Try again
              </button>
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(196,66,106,0.12)", border: "1px solid rgba(196,66,106,0.25)" }}
              >
                <Mail size={20} style={{ color: "#c4426a" }} />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                Forgot your password?
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Enter your email and we&apos;ll send you a link to reset your password.
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

              <button
                type="submit"
                disabled={loading}
                suppressHydrationWarning
                className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
                style={{ background: "#c4426a" }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>

            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
