"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import OneSignal from "react-onesignal";

const APP_ID = "86a12f35-8c44-44c7-b1c1-e8e88c8a84d3";

let initialized = false;

export function OneSignalProvider() {
  const { data: session } = useSession();

  useEffect(() => {
    if (initialized) return;
    initialized = true;

    OneSignal.init({
      appId: APP_ID,
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV === "development",
    }).catch(() => {});
  }, []);

  // Tie the OneSignal subscription to the logged-in user
  useEffect(() => {
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return;
    OneSignal.login(userId).catch(() => {});
  }, [session]);

  return null;
}
