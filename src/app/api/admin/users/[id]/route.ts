import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const me = session?.user as { id?: string; role?: string; isSuperAdmin?: boolean; adminPermissions?: string[] } | undefined;
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!me.isSuperAdmin && !me.adminPermissions?.includes("users")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === me.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (user.role === "admin" && !me.isSuperAdmin) {
    return NextResponse.json({ error: "Only super admins can delete admin accounts" }, { status: 403 });
  }

  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
