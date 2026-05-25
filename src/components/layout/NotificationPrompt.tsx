"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Settings } from "lucide-react";

const STORAGE_KEY = "push_prompt_ts";
const SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 7000;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationPrompt() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [browserBlocked, setBrowserBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (Notification.permission === "granted") return;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && Date.now() - Number(stored) < SNOOZE_MS) return;

    setBrowserBlocked(Notification.permission === "denied");
    const t = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [session]);

  function snooze() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  }

  async function handleEnable() {
    if (browserBlocked) {
      snooze();
      return;
    }
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const reg = await navigator.serviceWorker.ready;
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (vapidKey) {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          });
          window.dispatchEvent(new CustomEvent("push:subscribed"));
        }
      } else {
        localStorage.setItem(STORAGE_KEY, String(Date.now()));
      }
    } catch {
      // SW not ready or subscribe failed — fail silently
    } finally {
      setLoading(false);
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm"
      style={{ animation: "push-slide-up 0.3s ease both" }}
    >
      <div
        className="rounded-2xl p-4 shadow-2xl flex items-start gap-3"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: "rgba(196,66,106,0.12)" }}
        >
          {browserBlocked
            ? <Settings size={18} style={{ color: "#c4426a" }} />
            : <Bell size={18} style={{ color: "#c4426a" }} />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--foreground)" }}>
            {browserBlocked ? "Notifications are blocked" : "Never miss a new chapter"}
          </p>
          <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
            {browserBlocked
              ? "Click the lock icon in your browser's address bar and allow Notifications to re-enable."
              : "Get notified when authors you follow publish new stories or chapters."}
          </p>
          <div className="flex items-center gap-2">
            {!browserBlocked && (
              <button
                onClick={handleEnable}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#c4426a" }}
              >
                {loading ? "Enabling…" : "Enable notifications"}
              </button>
            )}
            <button
              onClick={snooze}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-70"
              style={{ color: "var(--muted-foreground)" }}
            >
              {browserBlocked ? "Got it" : "Not now"}
            </button>
          </div>
        </div>

        <button
          onClick={snooze}
          className="p-1 rounded-lg transition-opacity hover:opacity-60 shrink-0"
          style={{ color: "var(--muted-foreground)" }}
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
