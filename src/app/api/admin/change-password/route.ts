import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminOtpEmail } from "@/lib/email";

const OTP_TTL_MINUTES = 10;
const MAX_SENDS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;
const MAX_SENDS_PER_DAY = 9; // 3 full windows; exhausting this locks the account for 24 h
const DAY_MINUTES = 24 * 60;

type AdminUser = { id?: string; role?: string; email?: string | null };

export async function POST() {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin" || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email;

  const now = Date.now();

  const windowStart = new Date(now - WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.adminPasswordOtp.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_SENDS_PER_WINDOW) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  const dayStart = new Date(now - DAY_MINUTES * 60 * 1000);
  const dailyCount = await prisma.adminPasswordOtp.count({
    where: { email, createdAt: { gte: dayStart } },
  });
  if (dailyCount >= MAX_SENDS_PER_DAY) {
    return NextResponse.json(
      { error: "Account locked: too many OTP requests today. Try again in 24 hours." },
      { status: 429 },
    );
  }

  // Only purge expired OTPs — keep recent records so the counts above remain accurate
  await prisma.adminPasswordOtp.deleteMany({
    where: { email, expiresAt: { lt: new Date() } },
  });

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.adminPasswordOtp.create({ data: { email, code, expiresAt } });

  await sendAdminOtpEmail(email, code, OTP_TTL_MINUTES);

  return NextResponse.json({ ok: true });
}
