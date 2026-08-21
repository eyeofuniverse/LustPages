import { permanentRedirect } from "next/navigation";

export default async function OldCategoryRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const query = sp.page ? `?page=${sp.page}` : "";
  permanentRedirect(`/categories/${slug}${query}`);
}
