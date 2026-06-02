import { getVisitorData } from "@/lib/visitor-analytics";
import { VisitorsClient } from "@/components/admin/VisitorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visitor Analytics" };

export default async function VisitorsPage() {
  const data = await getVisitorData();

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Visitor Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          Website traffic — last 7 days
        </p>
      </div>
      <VisitorsClient data={data} />
    </div>
  );
}
