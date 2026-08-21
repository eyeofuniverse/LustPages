import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import slugify from "slug";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEmail } from "@/lib/email";
import { WELCOME_COINS, WELCOME_COINS_DAYS } from "@/lib/subscription-tiers";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // 10 registrations per IP per hour
  const ip = getClientIp(req);
  const { allowed } = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
  }

  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    // Basic field-length limits
    if (typeof name !== "string" || name.trim().length > 80) {
      return NextResponse.json({ error: "Name must be 80 characters or fewer." }, { status: 400 });
    }
    if (typeof email !== "string" || email.length > 254) {
      return NextResponse.json({ error: "Email must be 254 characters or fewer." }, { status: 400 });
    }

    // Email format validation
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password must be 128 characters or fewer." }, { status: 400 });
    }

    const normalised = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalised } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    // Build a unique author slug from the display name
    let baseSlug = slugify(name.trim(), { lower: true });
    if (!baseSlug) baseSlug = "author";
    let authorSlug = baseSlug;
    const MAX_PROBES = 10;
    for (let i = 1; i <= MAX_PROBES; i++) {
      const taken = await prisma.author.findUnique({ where: { slug: authorSlug }, select: { id: true } });
      if (!taken) break;
      authorSlug = i < MAX_PROBES ? `${baseSlug}-${i}` : `${baseSlug}-${Date.now().toString(36)}`;
    }

    const hashed = await bcrypt.hash(password, 12);
    const welcomeExpiry = new Date(Date.now() + WELCOME_COINS_DAYS * 24 * 60 * 60 * 1000);

    // Create User + Author in one transaction — every member can read and write
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalised,
        password: hashed,
        role: "author",
        coinBalance: WELCOME_COINS,
        welcomeCoinsExpireAt: welcomeExpiry,
        author: {
          create: {
            name: name.trim(),
            slug: authorSlug,
          },
        },
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
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
