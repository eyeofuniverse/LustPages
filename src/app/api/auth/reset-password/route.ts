import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetSuccessEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
    }
    if (record.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { tokenHash } });
      return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: record.email },
      select: { id: true, name: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { tokenHash } }),
    ]);

    // Fire-and-forget — don't block the response
    sendPasswordResetSuccessEmail(user.email, user.name).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
