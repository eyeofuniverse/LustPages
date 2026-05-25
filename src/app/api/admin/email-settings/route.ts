import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_TYPE_KEYS, EMAIL_TYPES } from "@/lib/email-config";

export async function GET() {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.emailSetting.findMany();
  const settingsMap = Object.fromEntries(existing.map((s) => [s.type, s]));

  // Seed any missing types with defaults
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
    const ordered = EMAIL_TYPE_KEYS.map((k) => fresh.find((s) => s.type === k)).filter(Boolean);
    return NextResponse.json(ordered);
  }

  const ordered = EMAIL_TYPE_KEYS.map((k) => settingsMap[k]).filter(Boolean);
  return NextResponse.json(ordered);
}

// Metadata for client (email type labels, descriptions, triggers)
export async function OPTIONS() {
  return NextResponse.json(
    Object.entries(EMAIL_TYPES).map(([type, config]) => ({ type, ...config }))
  );
}
