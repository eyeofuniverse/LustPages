import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getCategories } from "@/lib/queries";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session) redirect("/");

  const categories = await getCategories();

  return (
    <div className="flex flex-col min-h-screen">
      <Header categories={categories} />
      <main className="flex flex-1">{children}</main>
      <Footer />
    </div>
  );
}
