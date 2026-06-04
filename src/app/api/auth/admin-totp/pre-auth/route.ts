import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const CHALLENGE_TTL_SECONDS = 5 * 60; // 5 minutes to enter TOTP code
const PRE_AUTH_TTL_SECONDS = 60;      // 60s to call signIn after TOTP verified

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials." }, { status: 400 });
    }

    // Verify credentials — always run bcrypt to prevent timing oracle
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.role !== "admin") {
      await bcrypt.compare(password, "$2a$10$dummyhashtopreventtimingattacks00000000000000");
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // Check whether TOTP has been configured for this admin
    const totpConfig = await prisma.adminTotp.findUnique({ where: { userId: user.id } });

    if (!totpConfig) {
      // No TOTP set up yet — issue adminPreAuth directly so login proceeds
      // and the admin can then visit /meminhaj/totp-setup
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + PRE_AUTH_TTL_SECONDS * 1000);
      await prisma.adminPreAuth.deleteMany({ where: { email } });
      await prisma.adminPreAuth.create({ data: { email, token, expiresAt } });
      return NextResponse.json({ requireTotp: false, token });
    }

    // TOTP is configured — issue a short-lived challenge token
    const challengeToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + CHALLENGE_TTL_SECONDS * 1000);
    await prisma.adminTotpChallenge.deleteMany({ where: { email } });
    await prisma.adminTotpChallenge.create({ data: { email, token: challengeToken, expiresAt } });

    return NextResponse.json({ requireTotp: true, challengeToken });
  } catch (err) {
    console.error("[admin-totp/pre-auth]", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
