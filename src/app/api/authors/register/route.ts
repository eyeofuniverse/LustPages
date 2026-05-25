import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import slugify from "slug";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password, penName, bio, website } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const authorName = penName?.trim() || name.trim();
    let baseSlug = slugify(authorName, { lower: true });
    if (!baseSlug) baseSlug = "author";

    // Find a unique slug by appending a number if needed
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.author.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashed,
        role: "author",
        author: {
          create: {
            name: authorName,
            slug,
            bio: bio?.trim() || null,
            website: website?.trim() || null,
          },
        },
      },
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
