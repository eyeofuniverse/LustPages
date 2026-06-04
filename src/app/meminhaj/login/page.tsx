"use client";

import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, AlertCircle, Smartphone, CheckCircle, KeyRound } from "lucide-react";

type Step = "credentials" | "totp";

export default function AdminLoginPage() {
  const router = useRouter();

  // Step 1 state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Step 2 state
  const [challengeToken, setChallengeToken] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupInput, setBackupInput] = useState("");

  const [step, setStep] = useState<Step>("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (step === "totp" && !useBackupCode) setTimeout(() => codeRefs.current[0]?.focus(), 80);
  }, [step, useBackupCode]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin-totp/pre-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid credentials.");
        return;
      }

      if (!data.requireTotp) {
        // TOTP not configured yet — sign in directly, then redirect to setup
        const result = await signIn("credentials", {
          email,
          adminPreAuthToken: data.token,
          redirect: false,
        });
        if (result?.error) { setError("Sign-in failed. Please try again."); return; }
        router.push("/meminhaj/totp-setup");
        router.refresh();
        return;
      }

      setChallengeToken(data.challengeToken);
      setStep("totp");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleCodeChange(idx: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = char;
    setCode(next);
    setError("");
    if (char && idx < 5) codeRefs.current[idx + 1]?.focus();
  }

  function handleCodeKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[idx] && idx > 0) codeRefs.current[idx - 1]?.focus();
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      codeRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function submitTotp(codeStr: string) {
    setLoading(true);
    setError("");
    try {
      const verifyRes = await fetch("/api/auth/admin-totp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, challengeToken, code: codeStr }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error ?? "Verification failed.");
        if (verifyRes.status === 429) {
          setTimeout(() => {
            setStep("credentials");
            setCode(["", "", "", "", "", ""]);
            setBackupInput("");
            setChallengeToken("");
          }, 1500);
        }
        return;
      }

      const result = await signIn("credentials", {
        email,
        adminPreAuthToken: verifyData.token,
        redirect: false,
      });

      if (result?.error) { setError("Sign-in failed. Please try again."); return; }

      router.push("/meminhaj");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault();
    const codeStr = useBackupCode ? backupInput.trim() : code.join("");
    if (!useBackupCode && codeStr.length < 6) { setError("Enter the full 6-digit code."); return; }
    if (useBackupCode && !codeStr) { setError("Enter your backup code."); return; }
    await submitTotp(codeStr);
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
            style={{ background: step === "totp" ? "rgba(99,102,241,0.12)" : "rgba(196,66,106,0.12)" }}
          >
            {step === "totp"
              ? <Smartphone size={22} style={{ color: "#6366f1" }} />
              : <Shield size={22} style={{ color: "#c4426a" }} />}
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {step === "totp" ? "Authenticator Code" : "Admin Access"}
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            {step === "totp"
              ? "Enter the 6-digit code from your authenticator app"
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
              {loading ? "Checking…" : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2: TOTP */}
        {step === "totp" && (
          <form onSubmit={handleTotpSubmit} className="space-y-5">
            {!useBackupCode ? (
              <div>
                <label className="block text-sm font-medium mb-3 text-center" style={{ color: "var(--foreground)" }}>
                  6-digit code
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { codeRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(idx, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                      suppressHydrationWarning
                      className="w-11 text-center text-xl font-bold rounded-xl"
                      style={{
                        height: 52,
                        background: digit ? "rgba(99,102,241,0.12)" : "var(--muted)",
                        border: digit ? "2px solid #6366f1" : "1px solid var(--border)",
                        color: "var(--foreground)",
                        outline: "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                  Backup code
                </label>
                <input
                  type="text"
                  value={backupInput}
                  onChange={(e) => { setBackupInput(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="XXXXX-XXXXX"
                  autoFocus
                  suppressHydrationWarning
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-mono tracking-widest text-center"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                    outline: "none",
                  }}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!useBackupCode && code.join("").length < 6) || (useBackupCode && !backupInput.trim())}
              suppressHydrationWarning
              className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60 active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "#6366f1" }}
            >
              {loading ? "Verifying…" : <><CheckCircle size={16} /> Verify & Sign In</>}
            </button>

            <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
              <button
                type="button"
                onClick={() => {
                  setStep("credentials");
                  setCode(["", "", "", "", "", ""]);
                  setBackupInput("");
                  setChallengeToken("");
                  setUseBackupCode(false);
                  setError("");
                }}
                className="hover:opacity-75 transition-opacity"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => { setUseBackupCode(!useBackupCode); setError(""); setCode(["", "", "", "", "", ""]); setBackupInput(""); }}
                className="flex items-center gap-1 hover:opacity-75 transition-opacity"
              >
                <KeyRound size={11} />
                {useBackupCode ? "Use authenticator app" : "Use backup code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
