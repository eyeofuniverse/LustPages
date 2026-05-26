"use client";

import { useState, useCallback, useEffect } from "react";
import {
  UserPlus, Pencil, Trash2, ShieldCheck, Shield, X,
  CheckCircle, AlertCircle, Eye, EyeOff, Loader2,
} from "lucide-react";
import { ADMIN_PERMISSIONS, ALL_PERMISSION_KEYS, type AdminPermissionKey } from "@/lib/admin-permissions";

type Admin = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  adminProfile: {
    isSuperAdmin: boolean;
    nickname: string | null;
    permissions: string[];
    invitedById: string | null;
  } | null;
};

const card: React.CSSProperties = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "16px",
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

function PermissionCheckboxes({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(key: AdminPermissionKey) {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {ALL_PERMISSION_KEYS.map((key) => (
        <label
          key={key}
          className="flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer text-sm"
          style={{
            background: value.includes(key) ? "rgba(196,66,106,0.1)" : "var(--muted)",
            border: `1px solid ${value.includes(key) ? "rgba(196,66,106,0.4)" : "var(--border)"}`,
            color: value.includes(key) ? "#c4426a" : "var(--foreground)",
          }}
        >
          <input
            type="checkbox"
            className="accent-pink-600"
            checked={value.includes(key)}
            onChange={() => toggle(key)}
          />
          <span className="text-xs">{ADMIN_PERMISSIONS[key]}</span>
        </label>
      ))}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
      <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base" style={{ color: "var(--foreground)" }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:opacity-75" style={{ color: "var(--muted-foreground)" }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminsClient() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // Add admin modal
  const [showAdd, setShowAdd] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [showAddPw, setShowAddPw] = useState(false);
  const [addPermissions, setAddPermissions] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  // Edit permissions modal
  const [editTarget, setEditTarget] = useState<Admin | null>(null);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editNickname, setEditNickname] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/admins");
    if (res.ok) setAdmins(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    const res = await fetch("/api/admin/admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: addEmail, name: addName, password: addPassword, permissions: addPermissions }),
    });
    const d = await res.json();
    setAdding(false);
    if (res.ok) {
      showToast("Admin added.", true);
      setShowAdd(false);
      setAddEmail(""); setAddName(""); setAddPassword(""); setAddPermissions([]);
      setAdmins((prev) => [...prev, d]);
    } else {
      showToast(d.error ?? "Failed to add admin.", false);
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSaving(true);
    const res = await fetch(`/api/admin/admins/${editTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: editPermissions, nickname: editNickname || null }),
    });
    setSaving(false);
    if (res.ok) {
      showToast("Permissions updated.", true);
      setEditTarget(null);
      setAdmins((prev) =>
        prev.map((a) =>
          a.id === editTarget.id
            ? { ...a, adminProfile: { ...a.adminProfile!, permissions: editPermissions, nickname: editNickname || null } }
            : a,
        ),
      );
    } else {
      const d = await res.json();
      showToast(d.error ?? "Failed to update.", false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/admins/${deleteTarget.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      showToast("Admin removed.", true);
      setDeleteTarget(null);
      setAdmins((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    } else {
      const d = await res.json();
      showToast(d.error ?? "Failed to remove.", false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Admin Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>Manage admin accounts and their permissions</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: "#c4426a" }}
        >
          <UserPlus size={16} />
          Add Admin
        </button>
      </div>

      {toast && <Toast {...toast} />}

      <div style={card}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
          </div>
        ) : admins.length === 0 ? (
          <p className="text-center py-16 text-sm" style={{ color: "var(--muted-foreground)" }}>No admins found.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {admins.map((admin) => {
              const isSuperAdmin = admin.adminProfile?.isSuperAdmin ?? false;
              const displayName = admin.adminProfile?.nickname ?? admin.name;
              const perms = admin.adminProfile?.permissions ?? [];

              return (
                <div key={admin.id} className="flex items-start gap-4 p-5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: isSuperAdmin ? "rgba(196,66,106,0.12)" : "rgba(99,102,241,0.1)" }}
                  >
                    {isSuperAdmin
                      ? <ShieldCheck size={18} style={{ color: "#c4426a" }} />
                      : <Shield size={18} style={{ color: "#6366f1" }} />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                        {displayName}
                      </span>
                      {admin.adminProfile?.nickname && (
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({admin.name})</span>
                      )}
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: isSuperAdmin ? "rgba(196,66,106,0.12)" : "rgba(99,102,241,0.1)",
                          color: isSuperAdmin ? "#c4426a" : "#6366f1",
                        }}
                      >
                        {isSuperAdmin ? "Super Admin" : "Admin"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{admin.email}</p>
                    {!isSuperAdmin && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {perms.length === 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                            No permissions
                          </span>
                        ) : (
                          perms.map((p) => (
                            <span
                              key={p}
                              className="text-xs px-2 py-0.5 rounded-md"
                              style={{ background: "var(--muted)", color: "var(--foreground)" }}
                            >
                              {ADMIN_PERMISSIONS[p as AdminPermissionKey] ?? p}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setEditTarget(admin);
                          setEditPermissions(admin.adminProfile?.permissions ?? []);
                          setEditNickname(admin.adminProfile?.nickname ?? "");
                        }}
                        className="p-2 rounded-xl hover:opacity-75 transition-opacity"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}
                        title="Edit permissions"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="p-2 rounded-xl hover:opacity-75 transition-opacity"
                        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                        title="Remove admin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add admin modal */}
      {showAdd && (
        <Modal title="Add Admin" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Full Name</label>
                <input required value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="Name" style={inputStyle} suppressHydrationWarning />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Email</label>
                <input required type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="email@site.com" style={inputStyle} suppressHydrationWarning />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Password</label>
              <div className="relative">
                <input
                  required
                  type={showAddPw ? "text" : "password"}
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  suppressHydrationWarning
                />
                <button type="button" onClick={() => setShowAddPw(!showAddPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }}>
                  {showAddPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Permissions</label>
              <PermissionCheckboxes value={addPermissions} onChange={setAddPermissions} />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: "#c4426a" }}
            >
              {adding ? "Adding…" : "Add Admin"}
            </button>
          </form>
        </Modal>
      )}

      {/* Edit permissions modal */}
      {editTarget && (
        <Modal title={`Edit: ${editTarget.adminProfile?.nickname ?? editTarget.name}`} onClose={() => setEditTarget(null)}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Nickname</label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="Display name (optional)"
                maxLength={40}
                style={inputStyle}
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>Permissions</label>
              <PermissionCheckboxes value={editPermissions} onChange={setEditPermissions} />
            </div>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
              style={{ background: "#c4426a" }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <Modal title="Remove Admin" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              Remove <strong style={{ color: "var(--foreground)" }}>{deleteTarget.adminProfile?.nickname ?? deleteTarget.name}</strong> ({deleteTarget.email}) from the admin team? Their account will become a regular user.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold hover:opacity-75 transition-all"
                style={{ background: "var(--muted)", color: "var(--foreground)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 transition-all"
                style={{ background: "#c4426a" }}
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
