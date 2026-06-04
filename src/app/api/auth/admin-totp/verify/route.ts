import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const PRE_AUTH_TTL_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const { email, challengeToken, code } = await req.json();
    if (!email || !challengeToken || !code) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    // Look up and validate the challenge token
    const challenge = await prisma.adminTotpChallenge.findUnique({ where: { token: challengeToken } });

    if (!challenge || challenge.email !== email) {
      return NextResponse.json({ error: "Invalid session. Please log in again." }, { status: 400 });
    }
    if (new Date() > challenge.expiresAt) {
      await prisma.adminTotpChallenge.delete({ where: { id: challenge.id } });
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 400 });
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await prisma.adminTotpChallenge.delete({ where: { id: challenge.id } });
      return NextResponse.json({ error: "Too many failed attempts. Please log in again." }, { status: 429 });
    }

    // Fetch the stored TOTP config for this email
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 400 });
    }

    const totpConfig = await prisma.adminTotp.findUnique({ where: { userId: user.id } });
    if (!totpConfig) {
      return NextResponse.json({ error: "TOTP not configured." }, { status: 400 });
    }

    const trimmedCode = code.trim().replace(/\s/g, "");

    // Check if it's a backup code (format XXXXX-XXXXX)
    const isBackupFormat = /^[A-F0-9]{5}-[A-F0-9]{5}$/i.test(trimmedCode);
    if (isBackupFormat) {
      const normalised = trimmedCode.toUpperCase().replace("-", "");
      let usedIndex = -1;

      for (let i = 0; i < totpConfig.backupCodes.length; i++) {
        const match = await bcrypt.compare(normalised, totpConfig.backupCodes[i]);
        if (match) { usedIndex = i; break; }
      }

      if (usedIndex === -1) {
        await prisma.adminTotpChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        const remaining = MAX_ATTEMPTS - challenge.attempts - 1;
        return NextResponse.json(
          { error: `Invalid backup code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
          { status: 400 }
        );
      }

      // Consume the backup code — remove it from the array
      const updatedCodes = totpConfig.backupCodes.filter((_, i) => i !== usedIndex);
      await prisma.adminTotp.update({
        where: { userId: user.id },
        data: { backupCodes: updatedCodes },
      });
    } else {
      // Standard TOTP verification
      const isValid = authenticator.verify({ token: trimmedCode, secret: totpConfig.secret });
      if (!isValid) {
        await prisma.adminTotpChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
        const remaining = MAX_ATTEMPTS - challenge.attempts - 1;
        return NextResponse.json(
          { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
          { status: 400 }
        );
      }
    }

    // Code is correct — consume the challenge and issue the adminPreAuth token
    await prisma.adminTotpChallenge.delete({ where: { id: challenge.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PRE_AUTH_TTL_SECONDS * 1000);
    await prisma.adminPreAuth.deleteMany({ where: { email } });
    await prisma.adminPreAuth.create({ data: { email, token, expiresAt } });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[admin-totp/verify]", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
