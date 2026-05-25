"use client";

import { useState, useCallback } from "react";
import {
  Mail, ToggleLeft, ToggleRight, Send, Eye, EyeOff, ChevronDown,
  ChevronUp, CheckCircle, AlertCircle, Loader2, Pencil, RotateCcw,
} from "lucide-react";

type Setting = {
  id: string;
  type: string;
  enabled: boolean;
  subject: string | null;
  customNote: string | null;
  updatedAt: Date;
};

type Config = {
  type: string;
  label: string;
  description: string;
  defaultSubject: string;
  trigger: string;
  category: "transactional" | "notification";
};

const inputStyle: React.CSSProperties = {
  background: "var(--muted)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  outline: "none",
  width: "100%",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
};

const CATEGORY_LABELS = {
  transactional: "Transactional",
  notification: "Notifications",
};

export function EmailsClient({
  settings: initialSettings,
  configs,
}: {
  settings: Setting[];
  configs: Config[];
}) {
  const [settings, setSettings] = useState<Setting[]>(initialSettings);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<Record<string, string>>({});
  const [editNote, setEditNote] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const getSetting = (type: string) => settings.find((s) => s.type === type);

  const toggleEnabled = useCallback(async (type: string) => {
    const current = getSetting(type);
    const newVal = !(current?.enabled ?? true);
    setSettings((prev) =>
      prev.map((s) => (s.type === type ? { ...s, enabled: newVal } : s))
    );
    const res = await fetch(`/api/admin/email-settings/${type}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: newVal }),
    });
    if (!res.ok) {
      setSettings((prev) =>
        prev.map((s) => (s.type === type ? { ...s, enabled: !newVal } : s))
      );
      showToast("Failed to update setting", false);
    }
  }, [settings]);

  const handleExpand = (type: string) => {
    if (expanded === type) {
      setExpanded(null);
      setPreviewing(null);
    } else {
      const s = getSetting(type);
      setEditSubject((p) => ({ ...p, [type]: s?.subject ?? "" }));
      setEditNote((p) => ({ ...p, [type]: s?.customNote ?? "" }));
      setExpanded(type);
      setPreviewing(null);
    }
  };

  const handleSave = async (type: string) => {
    setSaving(type);
    try {
      const res = await fetch(`/api/admin/email-settings/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: editSubject[type] || null,
          customNote: editNote[type] || null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings((prev) => prev.map((s) => (s.type === type ? updated : s)));
        showToast("Settings saved", true);
      } else {
        showToast("Failed to save", false);
      }
    } finally {
      setSaving(null);
    }
  };

  const handleTest = async (type: string) => {
    setTesting(type);
    try {
      const res = await fetch(`/api/admin/email-settings/${type}/test`, { method: "POST" });
      const data = await res.json();
      if (res.ok) showToast(`Test email sent to ${data.sentTo}`, true);
      else showToast(data.error ?? "Failed to send test", false);
    } finally {
      setTesting(null);
    }
  };

  const grouped = (["transactional", "notification"] as const).map((cat) => ({
    cat,
    items: configs.filter((c) => c.category === cat),
  }));

  const enabledCount = settings.filter((s) => s.enabled).length;
  const disabledCount = settings.length - enabledCount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
            Email System
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage notification templates, toggle delivery, and send test emails
          </p>
        </div>
        {/* Stats */}
        <div className="flex gap-3 shrink-0">
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
            {settings.length} templates
          </div>
          <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(34,197,94,0.12)", color: "#22c55e" }}>
            {enabledCount} active
          </div>
          {disabledCount > 0 && (
            <div className="px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}>
              {disabledCount} off
            </div>
          )}
        </div>
      </div>

      {/* Groups */}
      {grouped.map(({ cat, items }) => (
        <div key={cat} className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest px-1" style={{ color: "var(--muted-foreground)" }}>
            {CATEGORY_LABELS[cat]}
          </p>
          <div className="space-y-2">
            {items.map((config) => {
              const setting = getSetting(config.type);
              const enabled = setting?.enabled ?? true;
              const isExpanded = expanded === config.type;
              const isPreviewing = previewing === config.type;
              const hasCustomSubject = !!(setting?.subject);
              const hasCustomNote = !!(setting?.customNote);

              return (
                <div
                  key={config.type}
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: "var(--card)",
                    border: `1px solid ${isExpanded ? "rgba(196,66,106,0.3)" : "var(--border)"}`,
                    opacity: enabled ? 1 : 0.6,
                    transition: "all 0.15s",
                  }}
                >
                  {/* Card header row */}
                  <div className="flex items-center gap-4 px-5 py-4">
                    {/* Icon */}
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: enabled ? "rgba(196,66,106,0.12)" : "var(--muted)" }}
                    >
                      <Mail size={16} style={{ color: enabled ? "#c4426a" : "var(--muted-foreground)" }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
                          {config.label}
                        </span>
                        {hasCustomSubject && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
                            custom subject
                          </span>
                        )}
                        {hasCustomNote && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "rgba(99,102,241,0.15)", color: "#6366f1" }}>
                            custom note
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted-foreground)" }}>
                        {config.description}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Edit expand */}
                      <button
                        type="button"
                        onClick={() => handleExpand(config.type)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-75"
                        style={{
                          background: isExpanded ? "rgba(196,66,106,0.12)" : "var(--muted)",
                          color: isExpanded ? "#c4426a" : "var(--muted-foreground)",
                          border: isExpanded ? "1px solid rgba(196,66,106,0.3)" : "1px solid transparent",
                        }}
                      >
                        <Pencil size={12} />
                        Edit
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>

                      {/* Test */}
                      <button
                        type="button"
                        onClick={() => handleTest(config.type)}
                        disabled={testing === config.type}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-opacity hover:opacity-75 disabled:opacity-50"
                        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                        title="Send test email to your admin address"
                      >
                        {testing === config.type ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Send size={12} />
                        )}
                        Test
                      </button>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleEnabled(config.type)}
                        className="transition-opacity hover:opacity-75"
                        title={enabled ? "Disable this email" : "Enable this email"}
                      >
                        {enabled ? (
                          <ToggleRight size={28} style={{ color: "#c4426a" }} />
                        ) : (
                          <ToggleLeft size={28} style={{ color: "var(--muted-foreground)" }} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded edit panel */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5"
                      style={{ borderTop: "1px solid var(--border)" }}
                    >
                      <div className="pt-4 grid gap-4 lg:grid-cols-2">
                        {/* Left: edit form */}
                        <div className="space-y-4">
                          {/* Trigger info */}
                          <div className="text-xs rounded-xl px-3 py-2.5" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                            <span className="font-semibold">Trigger:</span> {config.trigger}
                          </div>

                          {/* Subject override */}
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                              Subject Line
                            </label>
                            <input
                              type="text"
                              value={editSubject[config.type] ?? ""}
                              onChange={(e) => setEditSubject((p) => ({ ...p, [config.type]: e.target.value }))}
                              placeholder={config.defaultSubject}
                              style={inputStyle}
                            />
                            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                              Leave blank to use default: <em>{config.defaultSubject}</em>
                            </p>
                          </div>

                          {/* Custom note */}
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                              Custom Footer Note
                            </label>
                            <textarea
                              rows={3}
                              value={editNote[config.type] ?? ""}
                              onChange={(e) => setEditNote((p) => ({ ...p, [config.type]: e.target.value }))}
                              placeholder="Optional note shown in the email footer (e.g. promotional message, disclaimer)"
                              style={{ ...inputStyle, resize: "vertical" }}
                            />
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSave(config.type)}
                              disabled={saving === config.type}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                              style={{ background: "#c4426a" }}
                            >
                              {saving === config.type ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              Save Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditSubject((p) => ({ ...p, [config.type]: "" }));
                                setEditNote((p) => ({ ...p, [config.type]: "" }));
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-75"
                              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                              title="Clear overrides and use defaults"
                            >
                              <RotateCcw size={14} />
                              Reset
                            </button>
                          </div>
                        </div>

                        {/* Right: preview */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                              Email Preview
                            </label>
                            <button
                              type="button"
                              onClick={() => setPreviewing(isPreviewing ? null : config.type)}
                              className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-75"
                              style={{ color: "#c4426a" }}
                            >
                              {isPreviewing ? <EyeOff size={12} /> : <Eye size={12} />}
                              {isPreviewing ? "Hide preview" : "Show preview"}
                            </button>
                          </div>

                          {isPreviewing ? (
                            <iframe
                              src={`/api/admin/email-settings/${config.type}/preview`}
                              title={`Preview: ${config.label}`}
                              className="w-full rounded-xl"
                              style={{
                                height: 420,
                                border: "1px solid var(--border)",
                                background: "#f0eff4",
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPreviewing(config.type)}
                              className="w-full flex flex-col items-center justify-center gap-2 rounded-xl transition-opacity hover:opacity-75"
                              style={{
                                height: 160,
                                border: "2px dashed var(--border)",
                                background: "var(--muted)",
                                color: "var(--muted-foreground)",
                              }}
                            >
                              <Eye size={20} />
                              <span className="text-sm">Click to preview email</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl z-50 text-sm font-medium"
          style={{
            background: toast.ok ? "rgba(34,197,94,0.15)" : "rgba(196,66,106,0.15)",
            border: `1px solid ${toast.ok ? "rgba(34,197,94,0.4)" : "rgba(196,66,106,0.4)"}`,
            color: toast.ok ? "#22c55e" : "#c4426a",
            backdropFilter: "blur(8px)",
          }}
        >
          {toast.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
