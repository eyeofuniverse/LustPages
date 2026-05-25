"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Coins, Zap, Star, Crown, CheckCircle, Loader2, X,
  Copy, ExternalLink, RefreshCw, Clock, AlertTriangle,
} from "lucide-react";
import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/nowpayments";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";
import { ComingSoonGate } from "@/components/ui/ComingSoonGate";

interface CoinPackage {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  bonusCoins: number;
  price: number;
  isActive: boolean;
  order: number;
}

interface PendingPayment {
  paymentId: string;
  payAddress: string;
  payAmount: number;
  payCurrency: string;
  amountUsd: number;
  totalCoins: number;
  expiresAt: string | null;
  paymentUrl: string | null;
  pkg: CoinPackage;
}

const PACKAGE_ICONS = [Coins, Zap, Star, Crown];
const PACKAGE_ACCENTS = ["#6366f1", "#f59e0b", "#c4426a", "#22c55e"];
const PACKAGE_POPULAR = [false, false, true, false];

function qrUrl(data: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=180x180&margin=8&color=000000&bgcolor=ffffff`;
}

function CurrencyPicker({
  value,
  onChange,
  minAmounts,
  packagePrice,
}: {
  value: SupportedCurrency;
  onChange: (v: SupportedCurrency) => void;
  minAmounts: Record<string, number>;
  packagePrice: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {SUPPORTED_CURRENCIES.map((c) => {
        const min = minAmounts[c.id] ?? 0;
        const disabled = min > 0 && packagePrice < min;
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(c.id)}
            className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: disabled
                ? "var(--muted)"
                : active
                ? "rgba(196,66,106,0.12)"
                : "var(--muted)",
              border: active && !disabled
                ? "1px solid rgba(196,66,106,0.5)"
                : "1px solid transparent",
              color: disabled
                ? "var(--muted-foreground)"
                : active
                ? "#c4426a"
                : "var(--muted-foreground)",
              opacity: disabled ? 0.45 : 1,
              cursor: disabled ? "not-allowed" : "pointer",
            }}
          >
            <span>{c.label}</span>
            <span className="text-xs">
              {disabled
                ? `Min $${min.toFixed(2)}`
                : c.note}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0"
      style={{
        background: copied ? "rgba(34,197,94,0.15)" : "rgba(196,66,106,0.1)",
        color: copied ? "#22c55e" : "#c4426a",
      }}
    >
      {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expired"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return (
    <span className="flex items-center gap-1" style={{ color: remaining === "Expired" ? "#ef4444" : "#f59e0b" }}>
      <Clock size={12} /> {remaining}
    </span>
  );
}

// Inner component — all hooks live here, safely below the flag check
function StorePageInner() {
  const { data: session } = useSession();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [minAmounts, setMinAmounts] = useState<Record<string, number>>({});
  const [selectedPkg, setSelectedPkg] = useState<CoinPackage | null>(null);
  const [currency, setCurrency] = useState<SupportedCurrency>("usdttrc20");
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [creating, setCreating] = useState(false);
  const [payStatus, setPayStatus] = useState<"waiting" | "confirming" | "finished" | "failed" | "expired">("waiting");
  const [success, setSuccess] = useState<{ coins: number; balance: number } | null>(null);

  useEffect(() => {
    fetch("/api/coins/balance")
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? null))
      .catch(() => {});

    fetch("/api/coin-packages")
      .then((r) => r.json())
      .then((d) => { setPackages(d); setLoading(false); })
      .catch(() => setLoading(false));

    fetch("/api/coins/min-amounts")
      .then((r) => r.json())
      .then((d) => setMinAmounts(d))
      .catch(() => {});
  }, []);

  // When a package is selected, make sure the active currency meets its minimum
  useEffect(() => {
    if (!selectedPkg || Object.keys(minAmounts).length === 0) return;
    const currentMin = minAmounts[currency] ?? 0;
    if (currentMin > 0 && selectedPkg.price < currentMin) {
      // Switch to first currency that works
      const first = SUPPORTED_CURRENCIES.find((c) => {
        const m = minAmounts[c.id] ?? 0;
        return m === 0 || selectedPkg.price >= m;
      });
      if (first) setCurrency(first.id);
    }
  }, [selectedPkg, minAmounts, currency]);

  const pollStatus = useCallback(async (paymentId: string) => {
    try {
      const res = await fetch(`/api/coins/payment-status?paymentId=${paymentId}`);
      const data = await res.json();
      setPayStatus(data.status);
      if (data.status === "finished") {
        setSuccess({ coins: data.totalCoins, balance: data.balance });
        setPending(null);
        setBalance(data.balance);
      }
    } catch {
      // silent — will retry on next interval
    }
  }, []);

  useEffect(() => {
    if (!pending) return;
    const id = setInterval(() => pollStatus(pending.paymentId), 10000);
    return () => clearInterval(id);
  }, [pending, pollStatus]);

  async function handleBuy() {
    if (!session || !selectedPkg) return;
    setCreating(true);
    try {
      const res = await fetch("/api/coins/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg.id, payCurrency: currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to create payment");
        return;
      }
      setPending({ ...data, pkg: selectedPkg });
      setPayStatus("waiting");
      setSelectedPkg(null);
    } finally {
      setCreating(false);
    }
  }

  function closePending() {
    setPending(null);
    setPayStatus("waiting");
  }

  const statusLabel: Record<string, string> = {
    waiting: "Waiting for payment…",
    confirming: "Confirming on blockchain…",
    confirmed: "Confirmed — finalising…",
    finished: "Payment complete!",
    failed: "Payment failed",
    expired: "Payment expired",
  };

  // Check if the selected currency is valid for the currently selected package
  const currentMin = selectedPkg ? (minAmounts[currency] ?? 0) : 0;
  const currencyInvalid = currentMin > 0 && selectedPkg !== null && selectedPkg.price < currentMin;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      {/* Success toast */}
      {success && (
        <div
          className="fixed top-20 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e" }}
        >
          <CheckCircle size={16} />
          {success.coins} coins added! Balance: {success.balance.toLocaleString()}
          <button onClick={() => setSuccess(null)}><X size={14} /></button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl sm:text-5xl font-bold mb-3"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Coin Store
        </h1>
        <p className="text-lg mb-2" style={{ color: "var(--muted-foreground)" }}>
          Buy coins with crypto — instant delivery on confirmation
        </p>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Powered by <span style={{ color: "#c4426a", fontWeight: 600 }}>NOWPayments</span> · BTC · ETH · USDT · BNB accepted
        </p>

        {session && balance !== null && (
          <div
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <Coins size={15} style={{ color: "#f59e0b" }} />
            Your balance: <span style={{ color: "#f59e0b" }}>{balance.toLocaleString()} coins</span>
          </div>
        )}
      </div>

      {/* Packages grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: "#c4426a" }} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg, i) => {
            const Icon = PACKAGE_ICONS[i % PACKAGE_ICONS.length];
            const accent = PACKAGE_ACCENTS[i % PACKAGE_ACCENTS.length];
            const isPopular = PACKAGE_POPULAR[i];
            const total = pkg.coins + pkg.bonusCoins;

            return (
              <div
                key={pkg.id}
                className="relative flex flex-col rounded-2xl overflow-hidden transition-transform hover:translate-y-[-2px]"
                style={{ background: "var(--card)", border: isPopular ? `2px solid ${accent}` : "1px solid var(--border)" }}
              >
                {isPopular && (
                  <div className="text-center text-xs font-bold py-1" style={{ background: accent, color: "white" }}>
                    BEST DEAL
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: accent + "20" }}>
                    <Icon size={20} style={{ color: accent }} />
                  </div>
                  <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                    {pkg.name}
                  </h3>
                  {pkg.description && (
                    <p className="text-xs mb-4" style={{ color: "var(--muted-foreground)" }}>{pkg.description}</p>
                  )}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold" style={{ color: accent }}>{total.toLocaleString()}</span>
                      <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>coins</span>
                    </div>
                    {pkg.bonusCoins > 0 && (
                      <div className="text-xs mt-0.5" style={{ color: "#22c55e" }}>+{pkg.bonusCoins} bonus included</div>
                    )}
                  </div>
                  <div className="mt-auto pt-4">
                    <div className="text-2xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                      ${pkg.price < 1 ? pkg.price.toFixed(2) : pkg.price.toFixed(0)}
                    </div>
                    {session ? (
                      <button
                        onClick={() => setSelectedPkg(pkg)}
                        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 text-white"
                        style={{ background: accent }}
                      >
                        Buy with Crypto
                      </button>
                    ) : (
                      <Link
                        href="/login"
                        className="block w-full py-2.5 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-85 text-white"
                        style={{ background: accent }}
                      >
                        Login to Buy
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs mt-6" style={{ color: "var(--muted-foreground)" }}>
        100 coins = $1.00 USD &nbsp;·&nbsp; Coins never expire &nbsp;·&nbsp; Delivered on blockchain confirmation
      </p>

      {/* ── Currency picker modal ── */}
      {selectedPkg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedPkg(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                Choose Currency
              </h3>
              <button onClick={() => setSelectedPkg(null)} style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>

            <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: "var(--muted)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{selectedPkg.name}</p>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {(selectedPkg.coins + selectedPkg.bonusCoins).toLocaleString()} coins
                </p>
              </div>
              <span className="text-xl font-bold" style={{ color: "#c4426a" }}>${selectedPkg.price.toFixed(0)}</span>
            </div>

            <CurrencyPicker
              value={currency}
              onChange={setCurrency}
              minAmounts={minAmounts}
              packagePrice={selectedPkg.price}
            />

            <button
              onClick={handleBuy}
              disabled={creating || currencyInvalid}
              className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-85 disabled:opacity-60"
              style={{ background: "#c4426a" }}
            >
              {creating
                ? <><Loader2 size={15} className="animate-spin" /> Creating payment…</>
                : currencyInvalid
                ? `Min $${currentMin.toFixed(2)} for this currency`
                : <>Continue →</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Payment modal ── */}
      {pending && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}
        >
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                Send Payment
              </h3>
              <button onClick={closePending} style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>

            {/* Status bar */}
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold"
              style={{
                background: payStatus === "finished"
                  ? "rgba(34,197,94,0.12)"
                  : payStatus === "failed" || payStatus === "expired"
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(245,158,11,0.1)",
                color: payStatus === "finished"
                  ? "#22c55e"
                  : payStatus === "failed" || payStatus === "expired"
                  ? "#ef4444"
                  : "#f59e0b",
              }}
            >
              <span className="flex items-center gap-1.5">
                {payStatus === "finished"
                  ? <CheckCircle size={12} />
                  : payStatus === "failed" || payStatus === "expired"
                  ? <AlertTriangle size={12} />
                  : <Loader2 size={12} className="animate-spin" />}
                {statusLabel[payStatus] ?? payStatus}
              </span>
              {pending.expiresAt && payStatus === "waiting" && (
                <CountdownTimer expiresAt={pending.expiresAt} />
              )}
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--muted-foreground)" }}>{pending.pkg.name}</span>
              <span className="font-bold" style={{ color: "var(--foreground)" }}>{pending.totalCoins.toLocaleString()} coins</span>
            </div>

            {/* QR code */}
            <div className="flex justify-center">
              <div className="p-2 rounded-xl" style={{ background: "white" }}>
                <Image
                  src={qrUrl(pending.payAddress)}
                  alt="Payment QR code"
                  width={180}
                  height={180}
                  unoptimized
                />
              </div>
            </div>

            {/* Amount + Address */}
            <div className="space-y-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                  Send exactly
                </p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <span className="flex-1 font-mono text-sm font-bold" style={{ color: "var(--foreground)" }}>
                    {pending.payAmount} {pending.payCurrency.toUpperCase()}
                  </span>
                  <CopyButton text={String(pending.payAmount)} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--muted-foreground)" }}>
                  To address
                </p>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                  <span className="flex-1 font-mono text-xs break-all" style={{ color: "var(--foreground)" }}>
                    {pending.payAddress}
                  </span>
                  <CopyButton text={pending.payAddress} />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Send <strong>exactly</strong> the amount shown. Partial or excess payments may not be credited automatically.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => pollStatus(pending.paymentId)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-75"
                style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              >
                <RefreshCw size={12} /> Refresh
              </button>
              {pending.paymentUrl && (
                <a
                  href={pending.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
                >
                  <ExternalLink size={12} /> Open payment page
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StorePage() {
  if (!PAYMENTS_ENABLED) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <ComingSoonGate
          title="Coin Store Coming Soon"
          description="We're setting up secure payment processing. Coin packs will be available very soon — stay tuned!"
        />
      </div>
    );
  }
  return <StorePageInner />;
}
