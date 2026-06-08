import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") return null;
  return session;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.tagRelationship.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code;
    if (code === "P2025") return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    console.error("DELETE /api/admin/tag-relationships/[id]", e);
    return NextResponse.json({ error: "Failed to delete relationship" }, { status: 500 });
  }
}
