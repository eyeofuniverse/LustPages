import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

const MAX_ATTEMPTS = 5;
const PRE_AUTH_TTL_SECONDS = 60;

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields." }, { status: 400 });
    }

    const otp = await prisma.adminOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json({ error: "No OTP found. Request a new one." }, { status: 400 });
    }

    if (new Date() > otp.expiresAt) {
      await prisma.adminOtp.delete({ where: { id: otp.id } });
      return NextResponse.json({ error: "OTP expired. Request a new one." }, { status: 400 });
    }

    if (otp.attempts >= MAX_ATTEMPTS) {
      await prisma.adminOtp.delete({ where: { id: otp.id } });
      return NextResponse.json({ error: "Too many failed attempts. Request a new OTP." }, { status: 429 });
    }

    if (otp.code !== code.trim()) {
      await prisma.adminOtp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_ATTEMPTS - otp.attempts - 1;
      return NextResponse.json(
        { error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.` },
        { status: 400 }
      );
    }

    // OTP is correct — delete it and issue a short-lived pre-auth token
    await prisma.adminOtp.delete({ where: { id: otp.id } });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + PRE_AUTH_TTL_SECONDS * 1000);

    // Clean up any stale pre-auth tokens for this email before creating new one
    await prisma.adminPreAuth.deleteMany({ where: { email } });
    await prisma.adminPreAuth.create({ data: { email, token, expiresAt } });

    return NextResponse.json({ token });
  } catch (err) {
    console.error("[admin-otp/verify]", err);
    return NextResponse.json({ error: "Internal error." }, { status: 500 });
  }
}
