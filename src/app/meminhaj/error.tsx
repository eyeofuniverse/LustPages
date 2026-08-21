"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1
        className="text-2xl font-bold mb-3"
        style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
      >
        Admin panel error
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
        An unexpected error occurred in the admin panel.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "#c4426a" }}
      >
        Try again
      </button>
    </div>
  );
}
