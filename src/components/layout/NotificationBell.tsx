"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

export function NotificationBell() {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if (!session?.user || !("Notification" in window) || !("serviceWorker" in navigator)) return;
    setSupported(true);
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => setSubscribed(false));

    function onPromptSubscribed() { setSubscribed(true); }
    window.addEventListener("push:subscribed", onPromptSubscribed);
    return () => window.removeEventListener("push:subscribed", onPromptSubscribed);
  }, [session]);

  async function toggle() {
    if (loading || !supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (subscribed) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setSubscribed(false);
      } else {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const json = sub.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(json),
        });
        setSubscribed(true);
      }
    } catch {
      // permission denied or SW error — fail silently
    } finally {
      setLoading(false);
    }
  }

  if (!session?.user || !supported || subscribed === null) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="p-2 rounded-lg transition-opacity hover:opacity-75"
      style={{ color: subscribed ? "#c4426a" : "var(--muted-foreground)" }}
      aria-label={subscribed ? "Disable story notifications" : "Enable story notifications"}
      title={subscribed ? "Notifications on — click to turn off" : "Get notified of new stories"}
    >
      <Bell size={18} fill={subscribed ? "currentColor" : "none"} />
    </button>
  );
}
