"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) setError("Invalid or missing reset link. Please request a new one.");
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
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
        {success ? (
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
              Password changed!
            </h1>
            <p className="text-sm mb-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Your password has been updated successfully.
            </p>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Redirecting you to sign in…
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(196,66,106,0.12)", border: "1px solid rgba(196,66,106,0.25)" }}
              >
                <KeyRound size={20} style={{ color: "#c4426a" }} />
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold mb-1.5"
                style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
              >
                Set new password
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                Choose a strong password for your account.
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
                <span>
                  {error}{" "}
                  {error.includes("expired") || error.includes("Invalid") ? (
                    <Link href="/forgot-password" style={{ color: "#c4426a", fontWeight: 600 }}>
                      Request a new link
                    </Link>
                  ) : null}
                </span>
              </div>
            )}

            {!error.includes("Invalid or missing") && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--foreground)" }}
                  >
                    New password
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

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "var(--foreground)" }}
                  >
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    autoComplete="new-password"
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
                  disabled={loading || !token}
                  suppressHydrationWarning
                  className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95"
                  style={{ background: "#c4426a" }}
                >
                  {loading ? "Saving…" : "Save New Password"}
                </button>
              </form>
            )}

            <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                <Link
                  href="/login"
                  className="font-semibold transition-opacity hover:opacity-75"
                  style={{ color: "#c4426a" }}
                >
                  Back to sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
