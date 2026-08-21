export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <div className="h-3 w-24 rounded mb-2 animate-pulse" style={{ background: "var(--muted)" }} />
          <div className="h-7 w-48 rounded animate-pulse" style={{ background: "var(--muted)" }} />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-2xl h-20 animate-pulse" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-2xl p-5 h-28 animate-pulse" style={{ background: "var(--card)", border: "1px solid var(--border)" }} />
        ))}
      </div>
    </div>
  );
}
