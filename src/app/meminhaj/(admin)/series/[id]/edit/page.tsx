import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { getAdminSeriesById } from "@/lib/queries";
import { AdminSeriesSettingsForm } from "@/components/admin/AdminSeriesSettingsForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Series — Admin" };

export default async function AdminSeriesEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "admin") redirect("/meminhaj/login");

  const series = await getAdminSeriesById(id);
  if (!series) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href="/meminhaj/series"
        className="inline-flex items-center gap-2 text-sm mb-8 transition-opacity hover:opacity-75"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft size={15} /> Back to Series
      </Link>

      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          {series.name}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          By {series.author.name} · {series._count.stories} stories · {series._count.unlocks} unlocks
        </p>
      </div>

      <AdminSeriesSettingsForm series={series} />
    </div>
  );
}
