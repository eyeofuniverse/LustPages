import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EMAIL_TYPE_KEYS, EMAIL_TYPES } from "@/lib/email-config";
import { EmailsClient } from "./EmailsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Email System — Admin" };

export default async function EmailsPage() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") redirect("/meminhaj/login");

  // Fetch settings, seeding defaults for any missing types
  const existing = await prisma.emailSetting.findMany();
  const settingsMap = Object.fromEntries(existing.map((s) => [s.type, s]));
  const missing = EMAIL_TYPE_KEYS.filter((k) => !settingsMap[k]);
  if (missing.length > 0) {
    await Promise.all(
      missing.map((type) =>
        prisma.emailSetting.upsert({
          where: { type },
          create: { type, enabled: true },
          update: {},
        })
      )
    );
    const fresh = await prisma.emailSetting.findMany();
    fresh.forEach((s) => { settingsMap[s.type] = s; });
  }

  const settings = EMAIL_TYPE_KEYS.map((k) => settingsMap[k]).filter(Boolean) as {
    id: string;
    type: string;
    enabled: boolean;
    subject: string | null;
    customNote: string | null;
    updatedAt: Date;
  }[];

  const configs = Object.entries(EMAIL_TYPES).map(([type, config]) => ({ type, ...config }));

  return <EmailsClient settings={settings} configs={configs} />;
}
