import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SearchSynonymsManager } from "@/components/admin/SearchSynonymsManager";

export const metadata = { title: "Search Synonyms — Admin" };

export default async function SearchSynonymsPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "admin") redirect("/meminhaj/login");

  const rows = await prisma.searchSynonym.findMany({
    orderBy: [{ type: "asc" }, { term: "asc" }],
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Search Synonyms
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Control which related terms are searched together. TOKEN synonyms expand individual words;
          PHRASE synonyms expand a full multi-word query concept.
        </p>
      </div>

      <SearchSynonymsManager initial={JSON.parse(JSON.stringify(rows))} />
    </div>
  );
}
