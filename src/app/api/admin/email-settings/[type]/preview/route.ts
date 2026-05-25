import { auth } from "@/auth";
import { EMAIL_TYPE_KEYS } from "@/lib/email-config";
import { buildEmailPreviewHtml } from "@/lib/email";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const session = await auth();
  if ((session?.user as { role?: string })?.role !== "admin") {
    return new Response("Forbidden", { status: 403 });
  }

  const { type } = await params;
  if (!EMAIL_TYPE_KEYS.includes(type as never)) {
    return new Response("Unknown email type", { status: 404 });
  }

  const html = buildEmailPreviewHtml(type);
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
