"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle, Mail, RefreshCw, CheckCircle } from "lucide-react";

type Step = "credentials" | "otp";

export default function AdminLoginPage() {
  const router = useRouter();

  // Step 1 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Auto-focus first OTP box when step changes
  useEffect(() => {
    if (step === "otp") setTimeout(() => otpRefs.current[0]?.focus(), 80);
  }, [step]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/admin-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to send OTP.");
      return;
    }

    setStep("otp");
    setResendCooldown(60);
  }

  function handleOtpChange(idx: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    setError("");
    if (char && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the full 6-digit code."); return; }

    setLoading(true);
    setError("");

    const verifyRes = await fetch("/api/auth/admin-otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok) {
      setLoading(false);
      setError(verifyData.error ?? "Invalid code.");
      if (verifyRes.status === 429) {
        // Lockout — reset to credentials step
        setTimeout(() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); }, 1500);
      }
      return;
    }

    // OTP verified — sign in via pre-auth token
    const result = await signIn("credentials", {
      email,
      adminPreAuthToken: verifyData.token,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Sign-in failed. Please try again.");
      return;
    }

    router.push("/meminhaj");
    router.refresh();
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError("");
    setOtp(["", "", "", "", "", ""]);

    const res = await fetch("/api/auth/admin-otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Failed to resend.");
      return;
    }

    setResendCooldown(60);
    setTimeout(() => otpRefs.current[0]?.focus(), 80);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--background)" }}
    >
      <div
        className="w-full max-w-sm p-8 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            {step === "otp" ? (
              <Mail size={22} style={{ color: "#c4426a" }} />
            ) : (
              <Shield size={22} style={{ color: "#c4426a" }} />
            )}
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {step === "otp" ? "Check Your Email" : "Admin Access"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {step === "otp"
              ? `We sent a 6-digit code to ${email}`
              : "Restricted area — authorised personnel only"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-2.5 p-3 rounded-xl mb-4 text-sm"
            style={{
              background: "rgba(196,66,106,0.1)",
              border: "1px solid rgba(196,66,106,0.3)",
              color: "#c4426a",
            }}
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Step 1: Credentials */}
        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--foreground)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lustpages.com"
                required
                suppressHydrationWarning
                className="w-full px-4 py-2.5 rounded-xl text-sm"
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
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                  className="w-full px-4 py-2.5 pr-10 rounded-xl text-sm"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2"
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
              {loading ? "Sending code…" : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3 text-center" style={{ color: "var(--foreground)" }}>
                Enter verification code
              </label>
              <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { otpRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    suppressHydrationWarning
                    className="w-11 h-13 text-center text-xl font-bold rounded-xl"
                    style={{
                      background: digit ? "rgba(196,66,106,0.12)" : "var(--muted)",
                      border: digit ? "2px solid #c4426a" : "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                      height: "52px",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              suppressHydrationWarning
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "#c4426a" }}
            >
              {loading ? (
                "Verifying…"
              ) : (
                <>
                  <CheckCircle size={16} />
                  Verify & Sign In
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setOtp(["", "", "", "", "", ""]); setError(""); }}
                className="hover:opacity-75 transition-opacity"
              >
                ← Use different account
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || loading}
                className="flex items-center gap-1 hover:opacity-75 transition-opacity disabled:opacity-40"
              >
                <RefreshCw size={11} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
