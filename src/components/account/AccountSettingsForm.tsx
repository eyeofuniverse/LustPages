"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export function AccountSettingsForm({
  userName,
  userEmail,
}: {
  userName: string;
  userEmail: string;
}) {
  const router = useRouter();

  // Password change state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/users/me/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwSaving(false);
    if (!res.ok) {
      setPwError(data.error ?? "Failed to change password.");
      return;
    }
    setPwSuccess(true);
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    const res = await fetch("/api/users/me", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
    router.push("/");
  }

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
    fontSize: 14,
    outline: "none",
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "var(--foreground)",
  };

  return (
    <div className="space-y-8">
      {/* Account info (read-only) */}
      <div
        className="p-5 rounded-2xl space-y-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-bold text-base" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Account Info
        </h2>
        <div>
          <label style={labelStyle}>Name</label>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{userName}</p>
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{userEmail}</p>
        </div>
      </div>

      {/* Change password */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <h2 className="font-bold text-base mb-5" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label style={labelStyle}>Current Password</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              style={inputStyle}
            />
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Minimum 8 characters.</p>
          </div>
          <div>
            <label style={labelStyle}>Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>
          {pwError && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(34,197,94,0.08)", color: "#16a34a" }}>
              Password changed successfully.
            </p>
          )}
          <button
            type="submit"
            disabled={pwSaving}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: "#c4426a" }}
          >
            {pwSaving ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Delete account */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.25)" }}
      >
        <h2 className="font-bold text-base mb-2" style={{ color: "#ef4444", fontFamily: "var(--font-playfair), serif" }}>
          Delete Account
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          Permanently deletes your login access. Your published stories will remain on the platform unless you delete them individually first. This action cannot be undone.
        </p>
        <div className="space-y-3">
          <div>
            <label style={{ ...labelStyle, color: "#ef4444" }}>
              Type <span className="font-mono">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              style={{ ...inputStyle, borderColor: "rgba(239,68,68,0.3)" }}
            />
          </div>
          {deleteError && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
              {deleteError}
            </p>
          )}
          <button
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirm !== "DELETE"}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: "#ef4444" }}
          >
            {deleting ? "Deleting…" : "Delete My Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
