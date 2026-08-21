import { NextResponse } from "next/server";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be self-deleted." }, { status: 403 });
  }

  // Delete the user — cascades are handled by DB foreign keys
  await prisma.user.delete({ where: { id: session.user.id } });

  // Sign out the session after deletion
  await signOut({ redirect: false });

  return NextResponse.json({ ok: true });
}
