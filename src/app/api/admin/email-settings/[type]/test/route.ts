import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { EMAIL_TYPE_KEYS } from "@/lib/email-config";
import { sendTestEmail } from "@/lib/email";

export async function POST(
  _req: Request,
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

  const to = session?.user?.email;
  if (!to) {
    return NextResponse.json({ error: "Admin email not found" }, { status: 400 });
  }

  try {
    await sendTestEmail(to, type);
    return NextResponse.json({ success: true, sentTo: to });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
