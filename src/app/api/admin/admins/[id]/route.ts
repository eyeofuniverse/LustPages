import { NextRequest, NextResponse } from "next/server";
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

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSuperAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot modify your own permissions." }, { status: 400 });
  }

  const { permissions, nickname } = await req.json();

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, adminProfile: { select: { isSuperAdmin: true } } },
  });
  if (!target || target.role !== "admin") {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }
  if (target.adminProfile?.isSuperAdmin) {
    return NextResponse.json({ error: "Cannot modify super admin." }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {};
  if (Array.isArray(permissions)) {
    updateData.permissions = permissions.filter((p: string) =>
      ALL_PERMISSION_KEYS.includes(p as never),
    );
  }
  if (typeof nickname === "string" || nickname === null) {
    updateData.nickname = typeof nickname === "string" ? nickname.trim().slice(0, 40) || null : null;
  }

  await prisma.adminProfile.upsert({
    where: { userId: id },
    update: updateData,
    create: { userId: id, isSuperAdmin: false, ...(updateData as object) },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSuperAdminSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (id === user.id) {
    return NextResponse.json({ error: "Cannot remove yourself." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, adminProfile: { select: { isSuperAdmin: true } } },
  });
  if (!target || target.role !== "admin") {
    return NextResponse.json({ error: "Admin not found." }, { status: 404 });
  }
  if (target.adminProfile?.isSuperAdmin) {
    return NextResponse.json({ error: "Cannot remove super admin." }, { status: 400 });
  }

  await prisma.user.update({ where: { id }, data: { role: "user" } });

  return NextResponse.json({ ok: true });
}
