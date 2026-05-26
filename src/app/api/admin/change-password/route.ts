import { NextResponse } from "next/server";
import { randomInt } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminOtpEmail } from "@/lib/email";

const OTP_TTL_MINUTES = 10;
const MAX_SENDS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

type AdminUser = { id?: string; role?: string; email?: string | null };

export async function POST() {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin" || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = user.email;

  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.adminPasswordOtp.count({
    where: { email, createdAt: { gte: windowStart } },
  });
  if (recentCount >= MAX_SENDS_PER_WINDOW) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${WINDOW_MINUTES} minutes.` },
      { status: 429 },
    );
  }

  await prisma.adminPasswordOtp.deleteMany({ where: { email } });

  const code = String(randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.adminPasswordOtp.create({ data: { email, code, expiresAt } });

  await sendAdminOtpEmail(email, code, OTP_TTL_MINUTES);

  return NextResponse.json({ ok: true });
}
