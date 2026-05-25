import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_TYPE_KEYS } from "@/lib/email-config";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await params;
  if (!EMAIL_TYPE_KEYS.includes(type as never)) {
    return NextResponse.json({ error: "Unknown email type" }, { status: 404 });
  }

  const body = await req.json();
  const data: { enabled?: boolean; subject?: string | null; customNote?: string | null } = {};

  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if ("subject" in body) data.subject = body.subject?.trim() || null;
  if ("customNote" in body) data.customNote = body.customNote?.trim() || null;

  const setting = await prisma.emailSetting.upsert({
    where: { type },
    create: { type, enabled: true, ...data },
    update: data,
  });

  return NextResponse.json(setting);
}
