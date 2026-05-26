"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User, Mail, Shield, ShieldCheck, Pencil, KeyRound,
  CheckCircle, AlertCircle, RefreshCw, Eye, EyeOff,
} from "lucide-react";

type Step = "idle" | "otp_sent" | "done";

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
};

const inputStyle: React.CSSProperties = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  outline: "none",
  width: "100%",
  padding: "9px 14px",
  borderRadius: "10px",
  fontSize: "14px",
};

function Toast({ msg, ok }: { msg: string; ok: boolean }) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
      style={{
        background: ok ? "rgba(34,197,94,0.12)" : "rgba(196,66,106,0.1)",
        border: `1px solid ${ok ? "rgba(34,197,94,0.3)" : "rgba(196,66,106,0.3)"}`,
        color: ok ? "#22c55e" : "#c4426a",
      }}
    >
      {ok ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
      {msg}
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const user = session?.user as {
    name?: string;
    email?: string;
    isSuperAdmin?: boolean;
    adminNickname?: string | null;
  } | undefined;

  // Nickname section
  const [nickname, setNickname] = useState("");
  const [nickSaving, setNickSaving] = useState(false);
  const [nickToast, setNickToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Password section
  const [pwStep, setPwStep] = useState<Step>("idle");
  const [pwLoading, setPwLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwToast, setPwToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (user?.adminNickname !== undefined) setNickname(user.adminNickname ?? "");
  }, [user?.adminNickname]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (pwStep === "otp_sent") setTimeout(() => otpRefs.current[0]?.focus(), 80);
  }, [pwStep]);

  async function saveNickname(e: React.FormEvent) {
    e.preventDefault();
    setNickSaving(true);
    setNickToast(null);
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    setNickSaving(false);
    if (res.ok) {
      setNickToast({ msg: "Nickname updated.", ok: true });
      await updateSession();
    } else {
      const d = await res.json();
      setNickToast({ msg: d.error ?? "Failed to save.", ok: false });
    }
  }

  async function sendPasswordOtp() {
    setPwLoading(true);
    setPwToast(null);
    const res = await fetch("/api/admin/change-password", { method: "POST" });
    setPwLoading(false);
    if (res.ok) {
      setPwStep("otp_sent");
      setResendCooldown(60);
    } else {
      const d = await res.json();
      setPwToast({ msg: d.error ?? "Failed to send OTP.", ok: false });
    }
  }

  async function verifyAndChange(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setPwToast({ msg: "Enter the full 6-digit code.", ok: false }); return; }
    if (!newPw) { setPwToast({ msg: "Enter your new password.", ok: false }); return; }
    if (newPw !== confirmPw) { setPwToast({ msg: "Passwords do not match.", ok: false }); return; }
    if (newPw.length < 8) { setPwToast({ msg: "Password must be at least 8 characters.", ok: false }); return; }

    setPwLoading(true);
    setPwToast(null);
    const res = await fetch("/api/admin/change-password/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, newPassword: newPw }),
    });
    const d = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwStep("done");
      setPwToast({ msg: "Password changed successfully.", ok: true });
      setOtp(["", "", "", "", "", ""]);
      setNewPw("");
      setConfirmPw("");
    } else {
      setPwToast({ msg: d.error ?? "Failed to change password.", ok: false });
      if (res.status === 429) setPwStep("idle");
    }
  }

  function handleOtpChange(idx: number, value: string) {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = char;
    setOtp(next);
    if (char && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Manage your admin account settings</p>
      </div>

      {/* Account info */}
      <div style={card} className="space-y-4">
        <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Account</h2>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            <User size={20} style={{ color: "#c4426a" }} />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm" style={{ color: "var(--foreground)" }}>
              {user?.adminNickname ?? user?.name ?? "—"}
              {user?.adminNickname && (
                <span className="ml-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  ({user.name})
                </span>
              )}
            </p>
            <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              <Mail size={11} />
              {user?.email}
            </p>
          </div>
          <div className="ml-auto shrink-0">
            {user?.isSuperAdmin ? (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}
              >
                <ShieldCheck size={12} />
                Super Admin
              </span>
            ) : (
              <span
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}
              >
                <Shield size={12} />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nickname */}
      <div style={card} className="space-y-4">
        <div className="flex items-center gap-2">
          <Pencil size={15} style={{ color: "#c4426a" }} />
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Nickname</h2>
        </div>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Shown in the admin panel instead of your real name.
        </p>
        <form onSubmit={saveNickname} className="space-y-3">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="e.g. Chief Editor"
            maxLength={40}
            style={inputStyle}
            suppressHydrationWarning
          />
          {nickToast && <Toast {...nickToast} />}
          <button
            type="submit"
            disabled={nickSaving}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: "#c4426a" }}
          >
            {nickSaving ? "Saving…" : "Save Nickname"}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div style={card} className="space-y-4">
        <div className="flex items-center gap-2">
          <KeyRound size={15} style={{ color: "#c4426a" }} />
          <h2 className="font-semibold text-sm uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Change Password</h2>
        </div>

        {pwStep === "done" && (
          <Toast msg="Password changed successfully." ok={true} />
        )}

        {pwStep === "idle" && (
          <>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              An OTP will be sent to <strong>{user?.email}</strong> to confirm the change.
            </p>
            {pwToast && <Toast {...pwToast} />}
            <button
              onClick={sendPasswordOtp}
              disabled={pwLoading}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#c4426a" }}
            >
              {pwLoading ? "Sending…" : "Send OTP to change password"}
            </button>
          </>
        )}

        {pwStep === "otp_sent" && (
          <form onSubmit={verifyAndChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
                Verification code sent to {user?.email}
              </label>
              <div className="flex gap-2" onPaste={handleOtpPaste}>
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
                    className="w-10 text-center text-lg font-bold rounded-xl"
                    style={{
                      background: digit ? "rgba(196,66,106,0.12)" : "var(--muted)",
                      border: digit ? "2px solid #c4426a" : "1px solid var(--border)",
                      color: "var(--foreground)",
                      outline: "none",
                      height: "44px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>New Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Confirm Password</label>
              <input
                type={showPw ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Repeat new password"
                style={inputStyle}
                suppressHydrationWarning
              />
            </div>

            {pwToast && <Toast {...pwToast} />}

            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={pwLoading || otp.join("").length < 6}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "#c4426a" }}
              >
                {pwLoading ? "Verifying…" : "Confirm Change"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (resendCooldown > 0) return;
                  setOtp(["", "", "", "", "", ""]);
                  await sendPasswordOtp();
                }}
                disabled={resendCooldown > 0 || pwLoading}
                className="flex items-center gap-1 text-xs hover:opacity-75 disabled:opacity-40"
                style={{ color: "var(--muted-foreground)" }}
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
