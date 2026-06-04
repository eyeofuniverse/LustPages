"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Smartphone, ShieldCheck, AlertCircle, Copy, Check,
  RefreshCw, Loader2, KeyRound,
} from "lucide-react";

type Step = "scan" | "verify" | "backup";

export default function TotpSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("scan");

  // Scan step
  const [secret, setSecret] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [loadingQr, setLoadingQr] = useState(true);
  const [qrError, setQrError] = useState("");

  // Verify step
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Backup step
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Load QR code on mount
  useEffect(() => {
    generateQr();
  }, []);

  useEffect(() => {
    if (step === "verify") setTimeout(() => codeRefs.current[0]?.focus(), 80);
  }, [step]);

  async function generateQr() {
    setLoadingQr(true);
    setQrError("");
    try {
      const res = await fetch("/api/auth/admin-totp/setup");
      if (!res.ok) { setQrError("Failed to generate QR code."); return; }
      const data = await res.json();
      setSecret(data.secret);
      setQrDataUrl(data.qrDataUrl);
    } catch {
      setQrError("Network error. Please refresh.");
    } finally {
      setLoadingQr(false);
    }
  }

  function handleCodeChange(idx: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[idx] = char;
    setCode(next);
    setVerifyError("");
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

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const codeStr = code.join("");
    if (codeStr.length < 6) { setVerifyError("Enter the full 6-digit code."); return; }

    setVerifyLoading(true);
    setVerifyError("");
    try {
      const res = await fetch("/api/auth/admin-totp/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, code: codeStr }),
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.error ?? "Verification failed."); return; }
      setBackupCodes(data.backupCodes);
      setStep("backup");
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleCopyBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--muted)",
    border: "1px solid var(--border)",
    color: "var(--foreground)",
    outline: "none",
  };

  return (
    <div className="max-w-md">
      {/* Header */}
      <div className="mb-8">
        <div
          className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-4"
          style={{ background: "rgba(99,102,241,0.12)" }}
        >
          <Smartphone size={20} style={{ color: "#6366f1" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Set Up Authenticator
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {step === "scan" && "Scan the QR code with Google Authenticator, Authy, or any TOTP app."}
          {step === "verify" && "Enter the 6-digit code from your authenticator app to confirm setup."}
          {step === "backup" && "Save these backup codes somewhere safe. Each can only be used once."}
        </p>
      </div>

      {/* Step: scan */}
      {step === "scan" && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {qrError ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "#ef4444" }}>
              <AlertCircle size={14} />
              {qrError}
            </div>
          ) : loadingQr ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
            </div>
          ) : (
            <>
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="TOTP QR Code"
                  className="rounded-xl"
                  style={{ width: 200, height: 200, imageRendering: "pixelated" }}
                />
              </div>

              <div>
                <p className="text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                  Or enter this key manually
                </p>
                <div
                  className="px-3 py-2 rounded-lg text-xs font-mono break-all select-all"
                  style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  {secret}
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl text-xs" style={{ background: "rgba(99,102,241,0.07)", border: "1px solid rgba(99,102,241,0.18)", color: "var(--muted-foreground)" }}>
                <Smartphone size={13} className="shrink-0 mt-0.5" style={{ color: "#6366f1" }} />
                Open your authenticator app → tap + → scan QR code. Then click Continue.
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={generateQr}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setStep("verify")}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: "#6366f1" }}
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Step: verify */}
      {step === "verify" && (
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          {verifyError && (
            <div
              className="flex items-start gap-2 p-3 rounded-xl text-sm"
              style={{ background: "rgba(239,68,68,0.09)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {verifyError}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-3 text-center" style={{ color: "var(--foreground)" }}>
                6-digit code from your app
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
                      ...inputStyle,
                      height: 52,
                      background: digit ? "rgba(99,102,241,0.12)" : "var(--muted)",
                      border: digit ? "2px solid #6366f1" : "1px solid var(--border)",
                    }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={verifyLoading || code.join("").length < 6}
              className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: "#6366f1" }}
            >
              {verifyLoading
                ? <><Loader2 size={15} className="animate-spin" /> Verifying…</>
                : <><ShieldCheck size={15} /> Confirm Setup</>}
            </button>
          </form>

          <button
            type="button"
            onClick={() => { setCode(["", "", "", "", "", ""]); setStep("scan"); }}
            className="w-full text-xs text-center transition-opacity hover:opacity-75"
            style={{ color: "var(--muted-foreground)" }}
          >
            ← Back to QR code
          </button>
        </div>
      )}

      {/* Step: backup codes */}
      {step === "backup" && (
        <div className="space-y-4">
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-start gap-2.5 p-3 rounded-xl text-xs"
              style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.25)", color: "var(--muted-foreground)" }}
            >
              <KeyRound size={13} className="shrink-0 mt-0.5" style={{ color: "#eab308" }} />
              <span>
                <span className="font-semibold" style={{ color: "#eab308" }}>Save these now.</span>{" "}
                They will not be shown again. Use one if you lose access to your authenticator app.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code) => (
                <div
                  key={code}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono text-center select-all"
                  style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  {code}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyBackupCodes}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-opacity hover:opacity-80"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy all codes</>}
            </button>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded"
              suppressHydrationWarning
            />
            <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              I have saved my backup codes in a secure location.
            </span>
          </label>

          <button
            type="button"
            disabled={!confirmed}
            onClick={() => router.push("/meminhaj")}
            className="w-full py-3 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: "#22c55e" }}
          >
            <ShieldCheck size={15} />
            Authenticator setup complete
          </button>
        </div>
      )}
    </div>
  );
}
