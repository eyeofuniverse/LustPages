"use client";

import { useState, useEffect, useCallback } from "react";
import { AD_SLOTS, AdSlotId, RevenueLevel } from "@/lib/ad-slots";
import {
  Plus, Edit2, Trash2, X, Monitor, Link as LinkIcon,
  ToggleLeft, ToggleRight, Megaphone, Info,
} from "lucide-react";

interface Ad {
  id: string;
  slot: string;
  name: string;
  type: string;
  deviceType: string;
  networkCode: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  altText: string | null;
  adTitle: string | null;
  adDescription: string | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
}

const SLOT_KEYS = Object.keys(AD_SLOTS) as AdSlotId[];

const DEVICE_OPTIONS = [
  { value: "all",     label: "All Devices",  desc: "For Native / auto-sizing formats" },
  { value: "mobile",  label: "Mobile",       desc: "< 768px — phones" },
  { value: "desktop", label: "Desktop",      desc: "≥ 1024px — laptops & monitors" },
] as const;

const DEVICE_COLORS: Record<string, string> = {
  all:     "var(--muted-foreground)",
  mobile:  "#22c55e",
  desktop: "#6366f1",
};

const REVENUE_META: Record<RevenueLevel, { label: string; color: string; bg: string }> = {
  very_high: { label: "Top earner", color: "#22c55e", bg: "rgba(34,197,94,0.1)" },
  high:      { label: "Strong revenue", color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  medium:    { label: "Steady revenue", color: "#6366f1", bg: "rgba(99,102,241,0.1)" },
};

const EMPTY_FORM = {
  slot: SLOT_KEYS[0] as string,
  name: "",
  type: "affiliate",
  deviceType: "all",
  networkCode: "",
  imageUrl: "",
  linkUrl: "",
  altText: "",
  adTitle: "",
  adDescription: "",
  isActive: true,
  priority: 0,
};

const inputStyle: React.CSSProperties = {
  background: "var(--background)",
  border: "1px solid var(--border)",
  color: "var(--foreground)",
  borderRadius: "0.75rem",
  padding: "0.5rem 0.75rem",
  fontSize: "0.875rem",
  width: "100%",
  outline: "none",
};

function InfoTooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info
        size={11}
        style={{ color: "var(--muted-foreground)", opacity: 0.55, cursor: "help", flexShrink: 0 }}
      />
      {visible && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 7px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.625rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.6875rem",
            lineHeight: 1.5,
            color: "var(--foreground)",
            whiteSpace: "normal",
            width: "220px",
            zIndex: 200,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            pointerEvents: "none",
          }}
        >
          {text}
          {/* caret */}
          <span
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid var(--border)",
            }}
          />
        </span>
      )}
    </span>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: "block",
        fontSize: "0.6875rem",
        fontWeight: 600,
        color: "var(--muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {children}
    </label>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.375rem" }}>
        <Label>{label}</Label>
        {hint && <InfoTooltip text={hint} />}
      </div>
      {children}
    </div>
  );
}

export function AdsManager() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [filterSlot, setFilterSlot] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/ads");
    if (res.ok) setAds(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  function openCreate(slotId?: string) {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, slot: slotId ?? SLOT_KEYS[0] });
    setError(null);
    setModalOpen(true);
  }

  function openEdit(ad: Ad) {
    setEditingId(ad.id);
    setForm({
      slot: ad.slot,
      name: ad.name,
      type: ad.type,
      deviceType: ad.deviceType ?? "all",
      networkCode: ad.networkCode ?? "",
      imageUrl: ad.imageUrl ?? "",
      linkUrl: ad.linkUrl ?? "",
      altText: ad.altText ?? "",
      adTitle: ad.adTitle ?? "",
      adDescription: ad.adDescription ?? "",
      isActive: ad.isActive,
      priority: ad.priority,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ad?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    setAds((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleToggle(ad: Ad) {
    const res = await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ad, isActive: !ad.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setAds((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    }
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Ad name is required"); return; }
    if (form.type === "network" && !form.networkCode.trim()) { setError("Embed code is required"); return; }
    if (form.type === "affiliate" && !form.imageUrl.trim()) { setError("Image URL is required"); return; }
    if (form.type === "affiliate" && !form.linkUrl.trim()) { setError("Destination URL is required"); return; }

    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      networkCode: form.networkCode || null,
      imageUrl: form.imageUrl || null,
      linkUrl: form.linkUrl || null,
      altText: form.altText || null,
      adTitle: form.adTitle || null,
      adDescription: form.adDescription || null,
      priority: Number(form.priority) || 0,
    };

    const url = editingId ? `/api/admin/ads/${editingId}` : "/api/admin/ads";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const saved = await res.json();
      if (editingId) {
        setAds((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
      } else {
        setAds((prev) => [...prev, saved]);
      }
      setModalOpen(false);
    } else {
      setError("Failed to save. Please try again.");
    }

    setSaving(false);
  }

  const totalAds = ads.length;
  const activeAds = ads.filter((a) => a.isActive).length;
  const networkAds = ads.filter((a) => a.type === "network").length;
  const affiliateAds = ads.filter((a) => a.type === "affiliate").length;

  const filteredAds = filterSlot === "all" ? ads : ads.filter((a) => a.slot === filterSlot);

  const adsBySlot = Object.fromEntries(
    SLOT_KEYS.map((k) => [k, ads.filter((a) => a.slot === k)])
  );

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "var(--foreground)",
              lineHeight: 1.2,
            }}
          >
            Ad Management
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
            Manage advertisement slots across the site
          </p>
        </div>
        <button
          onClick={() => openCreate()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#c4426a", whiteSpace: "nowrap" }}
        >
          <Plus size={15} /> New Ad
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Ads", value: totalAds, color: "var(--foreground)" },
          { label: "Active", value: activeAds, color: "#22c55e" },
          { label: "Network", value: networkAds, color: "#6366f1" },
          { label: "Affiliate", value: affiliateAds, color: "#c4426a" },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl p-4"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}>{label}</p>
            <p style={{ color, fontSize: "1.625rem", fontWeight: 700, marginTop: "0.25rem" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Slot Overview */}
      <div className="mb-8">
        <h2
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: "0.875rem",
          }}
        >
          Slot Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SLOT_KEYS.map((id) => {
            const slotDef = AD_SLOTS[id];
            const slotAds = adsBySlot[id] ?? [];
            const activeCount = slotAds.filter((a) => a.isActive).length;
            const hasActive = activeCount > 0;
            return (
              <div
                key={id}
                className="rounded-xl p-4 flex items-start justify-between gap-3"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: hasActive ? "#22c55e" : "var(--muted-foreground)", opacity: hasActive ? 1 : 0.4 }}
                    />
                    <p
                      className="truncate"
                      style={{ color: "var(--foreground)", fontSize: "0.8125rem", fontWeight: 600 }}
                    >
                      {slotDef.label}
                    </p>
                  </div>
                  <p
                    className="truncate"
                    style={{ color: "var(--muted-foreground)", fontSize: "0.75rem" }}
                  >
                    {hasActive
                      ? `${activeCount} active ad${activeCount > 1 ? "s" : ""}`
                      : slotAds.length > 0 ? `${slotAds.length} inactive` : "No ads"}
                  </p>
                  {slotDef.hint && (() => {
                    const rev = REVENUE_META[slotDef.hint.revenue];
                    return (
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span
                          style={{
                            fontSize: "0.5625rem",
                            fontWeight: 700,
                            color: rev.color,
                            background: rev.bg,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "9999px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rev.label}
                        </span>
                        <span
                          className="truncate"
                          style={{ fontSize: "0.5625rem", color: "var(--muted-foreground)", opacity: 0.75 }}
                        >
                          {slotDef.hint.format} · {slotDef.hint.size}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <button
                  onClick={() => openCreate(id)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                >
                  <Plus size={11} /> Add
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Ads table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2
            style={{
              fontFamily: "var(--font-playfair), serif",
              fontSize: "1.125rem",
              fontWeight: 600,
              color: "var(--foreground)",
            }}
          >
            All Ads
          </h2>
          <select
            value={filterSlot}
            onChange={(e) => setFilterSlot(e.target.value)}
            style={{
              ...inputStyle,
              width: "auto",
              padding: "0.375rem 0.75rem",
              fontSize: "0.8125rem",
            }}
          >
            <option value="all">All Slots</option>
            {SLOT_KEYS.map((id) => (
              <option key={id} value={id}>{AD_SLOTS[id].label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
            Loading…
          </div>
        ) : filteredAds.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <Megaphone
              size={32}
              className="mx-auto mb-3 opacity-20"
              style={{ color: "var(--muted-foreground)" }}
            />
            <p style={{ color: "var(--foreground)", fontWeight: 500, fontSize: "0.9375rem" }}>
              No ads yet
            </p>
            <p style={{ color: "var(--muted-foreground)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
              Create your first ad to start monetizing
            </p>
            <button
              onClick={() => openCreate()}
              className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              Create Ad
            </button>
          </div>
        ) : (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
                <thead>
                  <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                    {["Name", "Slot", "Type", "Device", "Status", "Priority", ""].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "0.75rem 1rem",
                          textAlign: "left",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--muted-foreground)",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAds.map((ad, i) => (
                    <tr
                      key={ad.id}
                      style={{
                        background: i % 2 === 0 ? "var(--background)" : "var(--card)",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", maxWidth: "180px" }}>
                        <p
                          style={{
                            color: "var(--foreground)",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ad.name}
                        </p>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            color: "var(--muted-foreground)",
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "0.5rem",
                            padding: "0.1875rem 0.5rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {AD_SLOTS[ad.slot as AdSlotId]?.label ?? ad.slot}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: ad.type === "network" ? "#6366f1" : "#c4426a",
                          }}
                        >
                          {ad.type === "network" ? <Monitor size={12} /> : <LinkIcon size={12} />}
                          {ad.type === "network" ? "Network" : "Affiliate"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: DEVICE_COLORS[ad.deviceType ?? "all"],
                            background: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "0.5rem",
                            padding: "0.1875rem 0.5rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {DEVICE_OPTIONS.find((d) => d.value === (ad.deviceType ?? "all"))?.label ?? "All Devices"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <button
                          onClick={() => handleToggle(ad)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          {ad.isActive ? (
                            <>
                              <ToggleRight size={20} style={{ color: "#22c55e" }} />
                              <span style={{ fontSize: "0.75rem", color: "#22c55e", fontWeight: 600 }}>
                                Active
                              </span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={20} style={{ color: "var(--muted-foreground)" }} />
                              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
                                Inactive
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span style={{ color: "var(--muted-foreground)", fontSize: "0.875rem" }}>
                          {ad.priority}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                          <button
                            onClick={() => openEdit(ad)}
                            title="Edit"
                            style={{
                              padding: "0.375rem",
                              borderRadius: "0.5rem",
                              color: "var(--muted-foreground)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            title="Delete"
                            style={{
                              padding: "0.375rem",
                              borderRadius: "0.5rem",
                              color: "#ef4444",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              transition: "opacity 0.15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.72)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 overflow-y-auto"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              maxHeight: "90vh",
            }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <h3
                style={{
                  fontFamily: "var(--font-playfair), serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--foreground)",
                }}
              >
                {editingId ? "Edit Ad" : "New Ad"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ color: "var(--muted-foreground)", background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Name */}
              <Field
                label="Ad Name (internal)"
                hint="Your private reference label — never shown to readers. Be specific, e.g. 'TrafficJunky Leaderboard June' so you can tell ads apart at a glance."
              >
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. TrafficJunky Leaderboard #1"
                  style={inputStyle}
                />
              </Field>

              {/* Slot */}
              <Field
                label="Ad Slot"
                hint="The position on the site where this ad will appear. Each slot has a fixed location — see the description below the dropdown for exact placement."
              >
                <select
                  value={form.slot}
                  onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                  style={inputStyle}
                >
                  {SLOT_KEYS.map((id) => (
                    <option key={id} value={id}>{AD_SLOTS[id].label}</option>
                  ))}
                </select>
                <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                  {AD_SLOTS[form.slot as AdSlotId]?.description}
                </p>
                <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", opacity: 0.7 }}>
                  Recommended size: {AD_SLOTS[form.slot as AdSlotId]?.recommended}
                </p>
                {(() => {
                  const hint = AD_SLOTS[form.slot as AdSlotId]?.hint;
                  if (!hint) return null;
                  const rev = REVENUE_META[hint.revenue];
                  return (
                    <div
                      style={{
                        marginTop: "0.625rem",
                        padding: "0.625rem 0.75rem",
                        borderRadius: "0.625rem",
                        background: rev.bg,
                        border: `1px solid ${rev.color}33`,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                        <span
                          style={{
                            fontSize: "0.5625rem",
                            fontWeight: 700,
                            color: rev.color,
                            background: `${rev.color}22`,
                            padding: "0.1rem 0.45rem",
                            borderRadius: "9999px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {rev.label}
                        </span>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--foreground)" }}>
                          Best: {hint.format}
                        </span>
                        <span style={{ fontSize: "0.6rem", color: "var(--muted-foreground)", opacity: 0.8, whiteSpace: "nowrap" }}>
                          {hint.size}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", lineHeight: 1.5, margin: 0 }}>
                        {hint.why}
                      </p>
                    </div>
                  );
                })()}
              </Field>

              {/* Type selector */}
              <Field
                label="Ad Type"
                hint="Affiliate: you supply a banner image and a destination link. Ad Network: paste raw embed code (script tags) from networks like Google AdSense or TrafficJunky."
              >
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {(["affiliate", "network"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      style={{
                        flex: 1,
                        padding: "0.5rem",
                        borderRadius: "0.75rem",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "1px solid var(--border)",
                        background: form.type === t ? "#c4426a" : "var(--background)",
                        color: form.type === t ? "white" : "var(--muted-foreground)",
                        transition: "all 0.15s",
                      }}
                    >
                      {t === "network" ? "Ad Network" : "Affiliate"}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Device target — shown for network ads only (native/auto-sizing uses "all") */}
              {form.type === "network" && (
                <Field
                  label="Target Device"
                  hint="Choose which device this ad unit is sized for. Native / auto-sizing formats should stay on 'All Devices'. For ExoClick Banner, create two separate ads — one 728×90 targeting Desktop, one 300×250 targeting Mobile."
                >
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {DEVICE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setForm((f) => ({ ...f, deviceType: opt.value }))}
                        style={{
                          flex: 1,
                          padding: "0.5rem 0.375rem",
                          borderRadius: "0.75rem",
                          fontSize: "0.8125rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          border: "1px solid var(--border)",
                          background: form.deviceType === opt.value ? `${DEVICE_COLORS[opt.value]}22` : "var(--background)",
                          color: form.deviceType === opt.value ? DEVICE_COLORS[opt.value] : "var(--muted-foreground)",
                          transition: "all 0.15s",
                        }}
                        title={opt.desc}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    {DEVICE_OPTIONS.find((d) => d.value === form.deviceType)?.desc}
                  </p>
                </Field>
              )}

              {/* Network fields */}
              {form.type === "network" && (
                <Field
                  label="Embed Code (HTML / Script)"
                  hint="Paste the full ad tag from your ad network exactly as provided. Scripts are re-executed on each page load. Use one ad unit per slot — multiple tags in one slot may conflict."
                >
                  <textarea
                    value={form.networkCode}
                    onChange={(e) => setForm((f) => ({ ...f, networkCode: e.target.value }))}
                    placeholder={"<script async src='...'></script>\n<ins class='adsbygoogle' ...></ins>"}
                    rows={5}
                    style={{ ...inputStyle, fontFamily: "monospace", resize: "vertical" }}
                  />
                </Field>
              )}

              {/* Affiliate fields */}
              {form.type === "affiliate" && (
                <>
                  <Field
                    label="Banner Image URL"
                    hint="Direct URL to the banner image (JPG, PNG, or GIF). Standard sizes: 728×90 leaderboard, 300×250 medium rectangle, or 320×50 mobile banner. Use a CDN-hosted URL for fast loading."
                  >
                    <input
                      type="url"
                      value={form.imageUrl}
                      onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                      placeholder="https://cdn.example.com/banner.jpg"
                      style={inputStyle}
                    />
                    {form.imageUrl && (
                      <img
                        src={form.imageUrl}
                        alt="Preview"
                        style={{
                          marginTop: "0.5rem",
                          maxWidth: "100%",
                          maxHeight: "80px",
                          objectFit: "contain",
                          borderRadius: "0.5rem",
                          border: "1px solid var(--border)",
                        }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = "block"; }}
                      />
                    )}
                  </Field>
                  <Field
                    label="Destination URL"
                    hint="The page readers land on when they click the ad. Use your affiliate tracking link here so commissions are credited correctly."
                  >
                    <input
                      type="url"
                      value={form.linkUrl}
                      onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
                      placeholder="https://affiliate-partner.com/?ref=lustpages"
                      style={inputStyle}
                    />
                  </Field>
                  <Field
                    label="Alt Text"
                    hint="A short description of the banner for screen readers and accessibility compliance. Keep it neutral and factual, e.g. 'Visit ExampleSite.com'. Shown if the image fails to load."
                  >
                    <input
                      type="text"
                      value={form.altText}
                      onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
                      placeholder="Brief accessible description"
                      style={inputStyle}
                    />
                  </Field>
                  <Field
                    label="Ad Title (optional)"
                    hint="A short headline displayed below the banner image. Adds context and can improve click-through rate. Leave blank to show the image alone."
                  >
                    <input
                      type="text"
                      value={form.adTitle}
                      onChange={(e) => setForm((f) => ({ ...f, adTitle: e.target.value }))}
                      placeholder="Short headline shown below banner"
                      style={inputStyle}
                    />
                  </Field>
                  <Field
                    label="Ad Description (optional)"
                    hint="One line of promotional copy shown below the title. Supports a brief call-to-action or offer highlight. Leave blank if you prefer a clean image-only ad."
                  >
                    <input
                      type="text"
                      value={form.adDescription}
                      onChange={(e) => setForm((f) => ({ ...f, adDescription: e.target.value }))}
                      placeholder="Brief promotional copy"
                      style={inputStyle}
                    />
                  </Field>
                </>
              )}

              {/* Priority & Active */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <Field
                  label="Priority"
                  hint="When multiple ads are assigned to the same slot, the highest priority number wins. Ties are broken by random rotation, so equal-priority ads share impressions evenly."
                >
                  <input
                    type="number"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    min={0}
                    style={inputStyle}
                  />
                  <p style={{ fontSize: "0.6875rem", color: "var(--muted-foreground)", marginTop: "0.25rem" }}>
                    Higher = shown first
                  </p>
                </Field>
                <Field
                  label="Status"
                  hint="Active ads are eligible to appear on the site. Set to Inactive to pause the ad without deleting it — useful for seasonal campaigns or A/B testing."
                >
                  <button
                    onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "0.75rem",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      border: "1px solid var(--border)",
                      background: form.isActive ? "rgba(34,197,94,0.1)" : "var(--background)",
                      color: form.isActive ? "#22c55e" : "var(--muted-foreground)",
                      transition: "all 0.15s",
                    }}
                  >
                    {form.isActive ? "Active" : "Inactive"}
                  </button>
                </Field>
              </div>
            </div>

            {error && (
              <p style={{ color: "#ef4444", fontSize: "0.8125rem", marginTop: "1rem" }}>{error}</p>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--muted-foreground)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: "0.5rem 1.25rem",
                  borderRadius: "0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "white",
                  background: "#c4426a",
                  border: "none",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Ad"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
