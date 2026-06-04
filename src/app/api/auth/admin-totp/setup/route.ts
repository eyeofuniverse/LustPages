import { NextRequest, NextResponse } from "next/server";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const APP_NAME = "LustPages Admin";
const BACKUP_CODE_COUNT = 10;

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if ((session.user as { role?: string }).role !== "admin") return null;
  return session.user;
}

// GET — generate a fresh secret + QR code (not saved yet)
export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const secret = authenticator.generateSecret(20);
  const keyUri = authenticator.keyuri(user.email!, APP_NAME, secret);
  const qrDataUrl = await QRCode.toDataURL(keyUri, { width: 200, margin: 2 });

  return NextResponse.json({ secret, qrDataUrl });
}

// POST — verify first code, save secret and backup codes
export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { secret, code } = await req.json();
  if (!secret || !code) {
    return NextResponse.json({ error: "Missing secret or code." }, { status: 400 });
  }

  // Verify the TOTP code against the provided secret
  const isValid = authenticator.verify({ token: code.trim(), secret });
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect code — make sure your authenticator app is synced." }, { status: 400 });
  }

  // Generate backup codes: 10 × 5-byte random hex strings formatted as XXXXX-XXXXX
  const plainCodes = Array.from({ length: BACKUP_CODE_COUNT }, () => {
    const hex = randomBytes(5).toString("hex").toUpperCase();
    return `${hex.slice(0, 5)}-${hex.slice(5)}`;
  });

  // Hash each backup code for safe storage
  const hashedCodes = await Promise.all(plainCodes.map((c) => bcrypt.hash(c.replace("-", ""), 10)));

  // Upsert the AdminTotp record for this user
  const userId = adminUser.id!;
  await prisma.adminTotp.upsert({
    where: { userId },
    update: { secret, backupCodes: hashedCodes, updatedAt: new Date() },
    create: { userId, secret, backupCodes: hashedCodes },
  });

  // Return the plaintext backup codes — displayed once, never stored in plain form
  return NextResponse.json({ backupCodes: plainCodes });
}
