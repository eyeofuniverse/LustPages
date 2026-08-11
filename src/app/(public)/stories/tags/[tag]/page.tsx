import { permanentRedirect } from "next/navigation";

export default async function OldTagRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { tag } = await params;
  const sp = await searchParams;
  const query = sp.page ? `?page=${sp.page}` : "";
  permanentRedirect(`/tags/${tag}${query}`);
}
