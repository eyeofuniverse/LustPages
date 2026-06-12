import { getVisitorData } from "@/lib/visitor-analytics";
import { VisitorsClient } from "@/components/admin/VisitorsClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Visitor Analytics" };

export default async function VisitorsPage() {
  const data = await getVisitorData(7);

  return (
    <div>
      <div className="mb-6">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          Visitor Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          {data.totalVisits.toLocaleString()} visits · {data.uniqueVisitors.toLocaleString()} unique IPs
        </p>
      </div>
      <VisitorsClient data={data} />
    </div>
  );
}
