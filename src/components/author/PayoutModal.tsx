"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, CheckCircle, DollarSign, AlertTriangle, Clock } from "lucide-react";
import { PAYMENTS_ENABLED } from "@/lib/feature-flags";

interface Props {
  coinEarnings: number;
}

export function PayoutModal({ coinEarnings }: Props) {
  if (!PAYMENTS_ENABLED) {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
        title="Payouts are coming soon — payment integration is in progress"
      >
        <Clock size={14} />
        Payouts Coming Soon
      </div>
    );
  }

  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("bank");
  const [accountDetails, setAccountDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const usdAmount = (coinEarnings / 100).toFixed(2);
  const canRequest = coinEarnings >= 100;

  async function handleSubmit() {
    if (!accountDetails.trim()) {
      setError("Please enter your account details.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/author/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, accountDetails }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit payout request.");
        return;
      }
      setSuccess(true);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setSuccess(false);
    setError("");
    setAccountDetails("");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canRequest}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-85"
        style={{ background: "#22c55e" }}
        title={!canRequest ? "Minimum 100 coins ($1.00) required to request payout" : undefined}
      >
        <DollarSign size={14} />
        Request Payout
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)" }}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-5" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
                Request Payout
              </h2>
              <button onClick={close} style={{ color: "var(--muted-foreground)" }}>
                <X size={18} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle size={40} style={{ color: "#22c55e" }} />
                <p className="font-bold text-lg" style={{ color: "var(--foreground)" }}>Request Submitted!</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  Your payout of <span className="font-semibold" style={{ color: "#22c55e" }}>${usdAmount}</span> has been submitted.
                  We&apos;ll process it within 7 business days and reach out to your registered email.
                </p>
                <button onClick={close} className="mt-2 px-6 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="p-4 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "#22c55e" }}>Available to withdraw</p>
                  <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                    {coinEarnings.toLocaleString()} coins
                  </p>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>${usdAmount} USD</p>
                </div>

                {/* Processing notice */}
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: "#22c55e" }} />
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    Payout requests are reviewed within 7 business days. You will be contacted at your registered email once processed.
                  </p>
                </div>

                {/* Method */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    Payout Method
                  </label>
                  <div className="flex gap-2">
                    {[
                      { id: "bank", label: "Bank Transfer" },
                      { id: "paypal", label: "PayPal" },
                      { id: "crypto", label: "Crypto" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMethod(m.id)}
                        className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: method === m.id ? "rgba(34,197,94,0.15)" : "var(--muted)",
                          color: method === m.id ? "#22c55e" : "var(--muted-foreground)",
                          border: method === m.id ? "1px solid rgba(34,197,94,0.4)" : "1px solid transparent",
                        }}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account details */}
                <div>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>
                    {method === "bank" ? "Account Number / IBAN" : method === "paypal" ? "PayPal Email" : "Wallet Address"}
                  </label>
                  <input
                    type="text"
                    value={accountDetails}
                    onChange={(e) => setAccountDetails(e.target.value)}
                    placeholder={method === "bank" ? "e.g. GB29NWBK60161331926819" : method === "paypal" ? "you@example.com" : "0x..."}
                    className="w-full px-3 py-2 rounded-xl text-sm"
                    style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)", outline: "none" }}
                  />
                </div>

                {error && (
                  <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: "#22c55e" }}
                >
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : <>Request ${usdAmount} Payout</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
