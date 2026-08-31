import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "About LustPages",
  description: "LustPages is an independent adult fiction platform for writers and readers who love storytelling without limits.",
  alternates: { canonical: `${BASE}/about` },
  openGraph: {
    title: "About LustPages",
    description: "LustPages is an independent adult fiction platform for writers and readers who love storytelling without limits.",
    type: "website",
    url: `${BASE}/about`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About LustPages",
    description: "LustPages is an independent adult fiction platform for writers and readers.",
    images: [`${BASE}/og-default.jpg`],
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>About</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          About LustPages
        </h1>
      </div>

      <div className="space-y-6 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        <p>
          <strong style={{ color: "var(--foreground)" }}>LustPages</strong> is an independent adult fiction platform built for readers who crave quality storytelling and for authors who want a home for their most daring work.
        </p>

        <p>
          We believe great erotic fiction is more than explicit content — it&apos;s character, tension, and emotion. Every story on LustPages is written by a real author and reviewed before publication, so you&apos;re always getting original work, not AI-generated filler.
        </p>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
          For Readers
        </h2>
        <p>
          Browse thousands of free stories across dozens of categories — from slow-burn romance to steamy encounters. Filter by length, rating, and tags to find exactly what you&apos;re in the mood for. Premium stories and series are available through our coin system, with free chapters always available to try before you commit.
        </p>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
          For Authors
        </h2>
        <p>
          Submit your stories, build an audience, and earn through tips and premium content. Your profile is your brand — complete with a bio, follow count, and achievement badges. We handle the platform; you handle the writing.
        </p>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
          Our Content Rules
        </h2>
        <p>
          LustPages is strictly <strong style={{ color: "var(--foreground)" }}>18+ only</strong>. All fictional characters in sexual situations must be depicted as adults. We do not permit non-consensual content presented approvingly, content involving minors, or real-person fiction without clear consent indicators. Every submitted story is reviewed against these rules before going live.
        </p>
        <p>
          See our{" "}
          <Link href="/terms" style={{ color: "#c4426a" }}>Terms of Service</Link>,{" "}
          <Link href="/content-warning" style={{ color: "#c4426a" }}>Content Warning Policy</Link>, and{" "}
          <Link href="/dmca" style={{ color: "#c4426a" }}>DMCA Policy</Link> for full details.
        </p>

        <h2 className="text-xl font-bold pt-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
          Contact
        </h2>
        <p>
          For general enquiries, visit our{" "}
          <Link href="/contact" style={{ color: "#c4426a" }}>contact page</Link>. For copyright matters, use our{" "}
          <Link href="/dmca" style={{ color: "#c4426a" }}>DMCA page</Link>.
        </p>
      </div>
    </div>
  );
}
