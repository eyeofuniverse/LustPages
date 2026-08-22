import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountSettingsForm } from "@/components/account/AccountSettingsForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Account Settings — LustPages" };

export default async function AccountSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={14} /> My Library
      </Link>

      <h1
        className="text-2xl font-bold mb-8"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        Account Settings
      </h1>

      <AccountSettingsForm userName={session.user.name ?? ""} userEmail={session.user.email ?? ""} />
    </div>
  );
}
