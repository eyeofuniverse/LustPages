import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const SITE = process.env.NEXTAUTH_URL ?? "https://lustpages.com";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalised },
      select: { id: true, name: true, email: true },
    });

    // Always return success — never reveal whether an email exists
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Invalidate any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: normalised } });

    // Generate a secure random token and store its SHA-256 hash
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.passwordResetToken.create({
      data: {
        id: crypto.randomUUID(),
        email: normalised,
        tokenHash,
        expiresAt,
      },
    });

    const resetLink = `${SITE}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(normalised, resetLink);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
