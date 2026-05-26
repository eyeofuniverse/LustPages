import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;

type AdminUser = { id?: string; role?: string; email?: string | null };

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin" || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, newPassword } = await req.json();
  if (!code || !newPassword) {
    return NextResponse.json({ error: "Missing fields." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const email = user.email;
  const otp = await prisma.adminPasswordOtp.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json({ error: "No OTP found. Request a new one." }, { status: 400 });
  }
  if (new Date() > otp.expiresAt) {
    await prisma.adminPasswordOtp.delete({ where: { id: otp.id } });
    return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
  }
  if (otp.attempts >= MAX_ATTEMPTS) {
    await prisma.adminPasswordOtp.delete({ where: { id: otp.id } });
    return NextResponse.json({ error: "Too many failed attempts." }, { status: 429 });
  }
  if (otp.code !== String(code).trim()) {
    await prisma.adminPasswordOtp.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    const remaining = MAX_ATTEMPTS - otp.attempts - 1;
    return NextResponse.json(
      { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
      { status: 400 },
    );
  }

  await prisma.adminPasswordOtp.delete({ where: { id: otp.id } });

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
