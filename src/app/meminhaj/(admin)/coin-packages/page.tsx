"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Coins, X, Save, Loader2 } from "lucide-react";

interface CoinPackage {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  bonusCoins: number;
  price: number;
  subscriberDiscount: number;
  isActive: boolean;
  order: number;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  coins: "",
  bonusCoins: "0",
  price: "",
  subscriberDiscount: "0",
  isActive: true,
  order: "0",
};

export default function CoinPackagesPage() {
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/coin-packages");
    const data = await res.json();
    setPackages(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  function openNew() {
    setForm(EMPTY_FORM);
    setError("");
    setEditingId("new");
  }

  function openEdit(pkg: CoinPackage) {
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      coins: String(pkg.coins),
      bonusCoins: String(pkg.bonusCoins),
      price: String(pkg.price),
      subscriberDiscount: String(pkg.subscriberDiscount),
      isActive: pkg.isActive,
      order: String(pkg.order),
    });
    setError("");
    setEditingId(pkg.id);
  }

  function closeForm() {
    setEditingId(null);
    setError("");
  }

  async function handleSave() {
    if (!form.name || !form.coins || !form.price) {
      setError("Name, coins, and price are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body = {
        name: form.name,
        description: form.description || null,
        coins: Number(form.coins),
        bonusCoins: Number(form.bonusCoins),
        price: Number(form.price),
        subscriberDiscount: Number(form.subscriberDiscount),
        isActive: form.isActive,
        order: Number(form.order),
      };
      const isNew = editingId === "new";
      const url = isNew ? "/api/admin/coin-packages" : `/api/admin/coin-packages/${editingId}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to save");
        return;
      }
      await fetchPackages();
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(pkg: CoinPackage) {
    await fetch(`/api/admin/coin-packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    await fetchPackages();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this coin package? This cannot be undone.")) return;
    await fetch(`/api/admin/coin-packages/${id}`, { method: "DELETE" });
    await fetchPackages();
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
            Coin Packages
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Manage the coin packs readers can buy in the store
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#c4426a" }}
        >
          <Plus size={15} /> New Package
        </button>
      </div>

      {/* Form modal */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                {editingId === "new" ? "New Coin Package" : "Edit Package"}
              </h2>
              <button onClick={closeForm} style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                {error}
              </p>
            )}

            <div className="space-y-3">
              <FormField label="Package Name *" value={form.name} onChange={(v) => setForm(f => ({ ...f, name: v }))} placeholder="e.g. Starter Pack" />
              <FormField label="Description" value={form.description} onChange={(v) => setForm(f => ({ ...f, description: v }))} placeholder="Short description shown to readers" />
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Coins *" value={form.coins} onChange={(v) => setForm(f => ({ ...f, coins: v }))} placeholder="e.g. 500" type="number" />
                <FormField label="Bonus Coins" value={form.bonusCoins} onChange={(v) => setForm(f => ({ ...f, bonusCoins: v }))} placeholder="0" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Price (USD) *" value={form.price} onChange={(v) => setForm(f => ({ ...f, price: v }))} placeholder="e.g. 4.99" type="number" />
                <FormField label="Subscriber Discount (0–1)" value={form.subscriberDiscount} onChange={(v) => setForm(f => ({ ...f, subscriberDiscount: v }))} placeholder="e.g. 0.1" type="number" />
              </div>
              <FormField label="Display Order" value={form.order} onChange={(v) => setForm(f => ({ ...f, order: v }))} placeholder="0" type="number" />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Active (visible in store)</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "#c4426a" }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? "Saving…" : "Save Package"}
              </button>
              <button onClick={closeForm} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--muted-foreground)" }} />
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Coins size={36} className="mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
          <p className="font-medium mb-1" style={{ color: "var(--foreground)" }}>No coin packages yet</p>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Create your first package to start monetizing.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                {["Order", "Name", "Coins", "Price", "Sub Discount", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg, i) => (
                <tr
                  key={pkg.id}
                  style={{
                    background: i % 2 === 0 ? "var(--card)" : "var(--background)",
                    borderBottom: "1px solid var(--border)",
                    opacity: pkg.isActive ? 1 : 0.55,
                  }}
                >
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{pkg.order}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold" style={{ color: "var(--foreground)" }}>{pkg.name}</p>
                    {pkg.description && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{pkg.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: "#c4426a" }}>{pkg.coins.toLocaleString()}</span>
                    {pkg.bonusCoins > 0 && (
                      <span className="ml-1 text-xs" style={{ color: "#22c55e" }}>+{pkg.bonusCoins} bonus</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold" style={{ color: "var(--foreground)" }}>
                    ${pkg.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                    {pkg.subscriberDiscount > 0 ? `${Math.round(pkg.subscriberDiscount * 100)}%` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(pkg)} className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70">
                      {pkg.isActive
                        ? <><ToggleRight size={16} style={{ color: "#22c55e" }} /> Active</>
                        : <><ToggleLeft size={16} style={{ color: "var(--muted-foreground)" }} /> Inactive</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(pkg)}
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                        style={{ background: "rgba(196,66,106,0.1)", color: "#c4426a" }}
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id)}
                        className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
        Subscriber Discount: extra coins granted on top of base + bonus when a subscriber buys this pack (e.g. 0.1 = 10% more coins).
      </p>
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-sm"
        style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );
}
