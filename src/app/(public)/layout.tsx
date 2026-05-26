import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { NotificationPrompt } from "@/components/layout/NotificationPrompt";
import { getCategories } from "@/lib/queries";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  return (
    <div className="flex flex-col min-h-screen">
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
      <NotificationPrompt />
    </div>
  );
}
