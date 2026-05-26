import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type AdminUser = { id?: string; role?: string };

async function getAdminSession() {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin") return null;
  return user;
}

export async function GET() {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.adminProfile.findUnique({
    where: { userId: user.id },
    select: { nickname: true, isSuperAdmin: true, permissions: true },
  });

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true },
  });

  return NextResponse.json({ ...dbUser, ...profile });
}

export async function PATCH(req: NextRequest) {
  const user = await getAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { nickname } = await req.json();
  if (typeof nickname !== "string") {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const trimmed = nickname.trim().slice(0, 40);

  await prisma.adminProfile.upsert({
    where: { userId: user.id! },
    update: { nickname: trimmed || null },
    create: { userId: user.id!, nickname: trimmed || null },
  });

  return NextResponse.json({ ok: true });
}
