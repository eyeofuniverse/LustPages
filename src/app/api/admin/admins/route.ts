import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ALL_PERMISSION_KEYS } from "@/lib/admin-permissions";

type AdminUser = { id?: string; role?: string; isSuperAdmin?: boolean };

async function getSuperAdminSession() {
  const session = await auth();
  const user = session?.user as AdminUser | undefined;
  if (!user?.id || user.role !== "admin" || !user.isSuperAdmin) return null;
  return user;
}

export async function GET() {
  const user = await getSuperAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      adminProfile: {
        select: { isSuperAdmin: true, nickname: true, permissions: true, invitedById: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(admins);
}

export async function POST(req: NextRequest) {
  const user = await getSuperAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, name, password, permissions } = await req.json();

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const validPermissions = Array.isArray(permissions)
    ? permissions.filter((p: string) => ALL_PERMISSION_KEYS.includes(p as never))
    : [];

  const hashed = await bcrypt.hash(password, 12);

  const newAdmin = await prisma.user.create({
    data: {
      email,
      name,
      password: hashed,
      role: "admin",
      adminProfile: {
        create: {
          isSuperAdmin: false,
          permissions: validPermissions,
          invitedById: user.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      adminProfile: {
        select: { isSuperAdmin: true, nickname: true, permissions: true, invitedById: true },
      },
    },
  });

  return NextResponse.json(newAdmin, { status: 201 });
}
