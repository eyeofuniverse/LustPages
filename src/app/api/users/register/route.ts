import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { WELCOME_COINS, WELCOME_COINS_DAYS } from "@/lib/subscription-tiers";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const welcomeExpiry = new Date(Date.now() + WELCOME_COINS_DAYS * 24 * 60 * 60 * 1000);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalised,
        password: hashed,
        coinBalance: WELCOME_COINS,
        welcomeCoinsExpireAt: welcomeExpiry,
      },
      select: { id: true, email: true, name: true },
    });

    await prisma.coinTransaction.create({
      data: {
        userId: user.id,
        amount: WELCOME_COINS,
        type: "welcome_bonus",
        description: `Welcome bonus — ${WELCOME_COINS} coins (expires in ${WELCOME_COINS_DAYS} days)`,
      },
    });

    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
