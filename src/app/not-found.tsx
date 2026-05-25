import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 text-center"
      style={{ background: "var(--background)" }}
    >
      <div>
        <Link href="/" className="inline-flex items-center gap-2 mb-8 justify-center">
          <BookOpen size={22} style={{ color: "#c4426a" }} />
          <span
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
          >
            LustPages
          </span>
        </Link>
        <h1
          className="text-6xl font-bold mb-4"
          style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
        >
          404
        </h1>
        <p className="text-lg mb-2" style={{ color: "var(--foreground)" }}>
          Page not found
        </p>
        <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
          The story you&apos;re looking for doesn&apos;t exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "#c4426a" }}
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
