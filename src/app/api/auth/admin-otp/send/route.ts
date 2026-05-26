import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendAdminOtpEmail } from "@/lib/email";

const OTP_TTL_MINUTES = 10;
const MAX_SENDS_PER_WINDOW = 3;
const WINDOW_MINUTES = 15;

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
    }

    // Verify credentials
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "admin") {
      // Constant-time-ish: still run bcrypt to avoid timing oracle
      await bcrypt.compare(password, "$2a$10$dummyhashtopreventtimingattacks00000000000000");
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Rate limit: max 3 OTPs per 15-minute window
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
    const recentCount = await prisma.adminOtp.count({
      where: { email, createdAt: { gte: windowStart } },
    });
    if (recentCount >= MAX_SENDS_PER_WINDOW) {
      return NextResponse.json(
        { error: `Too many OTP requests. Try again in ${WINDOW_MINUTES} minutes.` },
        { status: 429 }
      );
    }

    // Delete any existing unused OTPs for this email
    await prisma.adminOtp.deleteMany({ where: { email } });

    // Generate 6-digit OTP
    const code = String(randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await prisma.adminOtp.create({ data: { email, code, expiresAt } });

    await sendAdminOtpEmail(email, code, OTP_TTL_MINUTES);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin-otp/send]", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
