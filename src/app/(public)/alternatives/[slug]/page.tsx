import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, X, ChevronRight, BookOpen } from "lucide-react";
import { alternativesBySlug, allAlternativeSlugs } from "@/data/alternatives";
import type { Metadata } from "next";

const BASE = "https://lustpages.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return allAlternativeSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = alternativesBySlug[slug];
  if (!page) return { title: "Not Found" };
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: `${BASE}/alternatives/${slug}` },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      type: "article",
      url: `${BASE}/alternatives/${slug}`,
      siteName: "LustPages",
    },
    twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription },
  };
}

export default async function AlternativePage({ params }: Props) {
  const { slug } = await params;
  const page = alternativesBySlug[slug];
  if (!page) notFound();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Hero ───────────────────────────────────────────────── */}
        <div
          className="relative py-16 px-4"
          style={{
            background: "linear-gradient(180deg, rgba(196,66,106,0.08) 0%, transparent 100%)",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "rgba(196,66,106,0.12)", color: "#c4426a" }}>
              <BookOpen size={12} /> vs. {page.competitor}
            </div>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              {page.headline}
            </h1>
            <p className="text-base sm:text-lg mb-8" style={{ color: "var(--muted-foreground)" }}>
              {page.subheadline}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm sm:text-base transition-opacity hover:opacity-90"
                style={{ background: "#c4426a" }}
              >
                Try LustPages Free <ChevronRight size={16} />
              </Link>
              <Link
                href="/stories"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm sm:text-base transition-opacity hover:opacity-75"
                style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Browse Stories
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-14">

          {/* ── Intro ─────────────────────────────────────────────── */}
          <section>
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: "var(--foreground)", lineHeight: "1.85" }}>
              {page.intro}
            </p>
          </section>

          {/* ── Why leave ─────────────────────────────────────────── */}
          <section>
            <h2
              className="text-xl sm:text-2xl font-bold mb-6"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Why readers leave {page.competitor}
            </h2>
            <div className="space-y-3">
              {page.whyLeaveReasons.map((reason, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(239,68,68,0.12)" }}
                    >
                      <X size={12} style={{ color: "#ef4444" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: "var(--foreground)" }}>
                        {reason.heading}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        {reason.body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Comparison table ──────────────────────────────────── */}
          <section>
            <h2
              className="text-xl sm:text-2xl font-bold mb-6"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              LustPages vs. {page.competitor} — feature comparison
            </h2>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr style={{ background: "var(--card)", borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--muted-foreground)", width: "40%" }}>
                        Feature
                      </th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "#c4426a" }}>
                        LustPages
                      </th>
                      <th className="text-left px-4 py-3 font-semibold" style={{ color: "var(--muted-foreground)" }}>
                        {page.competitor}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {page.comparison.map((row, i) => (
                      <tr
                        key={i}
                        style={{
                          borderBottom: i < page.comparison.length - 1 ? "1px solid var(--border)" : undefined,
                          background: i % 2 === 0 ? "var(--card)" : "rgba(255,255,255,0.01)",
                        }}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: "var(--foreground)" }}>
                          {row.feature}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="flex items-center gap-1.5"
                            style={{ color: row.lustpagesWins ? "#22c55e" : "var(--muted-foreground)" }}
                          >
                            {row.lustpagesWins && <Check size={13} />}
                            {row.lustpages}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="flex items-center gap-1.5"
                            style={{ color: row.lustpagesWins ? "var(--muted-foreground)" : "var(--foreground)" }}
                          >
                            {row.competitor}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ── LustPages highlights ───────────────────────────────── */}
          <section>
            <h2
              className="text-xl sm:text-2xl font-bold mb-6"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Why LustPages is the better choice
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {page.lustpagesFeatures.map((feat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "rgba(196,66,106,0.12)" }}
                    >
                      <Check size={12} style={{ color: "#c4426a" }} />
                    </div>
                    <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                      {feat.heading}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed pl-8" style={{ color: "var(--muted-foreground)" }}>
                    {feat.body}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA mid-page ──────────────────────────────────────── */}
          <div
            className="p-6 sm:p-8 rounded-2xl text-center"
            style={{ background: "rgba(196,66,106,0.06)", border: "1px solid rgba(196,66,106,0.2)" }}
          >
            <h3
              className="text-lg sm:text-xl font-bold mb-2"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Ready to make the switch?
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
              Join LustPages for free — no credit card, no commitments.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              Create your free account <ChevronRight size={15} />
            </Link>
          </div>

          {/* ── FAQ ───────────────────────────────────────────────── */}
          <section>
            <h2
              className="text-xl sm:text-2xl font-bold mb-6"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Frequently asked questions
            </h2>
            <div className="space-y-3">
              {page.faqs.map((faq, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <p className="font-semibold text-sm mb-2" style={{ color: "var(--foreground)" }}>
                    {faq.question}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Verdict ───────────────────────────────────────────── */}
          <section>
            <h2
              className="text-xl sm:text-2xl font-bold mb-4"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Our verdict
            </h2>
            <p className="text-base leading-relaxed" style={{ color: "var(--foreground)", lineHeight: "1.85" }}>
              {page.verdict}
            </p>
          </section>

          {/* ── Final CTA ─────────────────────────────────────────── */}
          <div
            className="p-6 sm:p-8 rounded-2xl flex flex-col sm:flex-row items-center gap-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-base mb-1" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
                LustPages — adult fiction for modern readers
              </p>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                Dark mode. Mobile-first. Author tips. Free to read.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: "#c4426a" }}
              >
                Sign up free
              </Link>
              <Link
                href="/stories"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-75"
                style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                Browse stories
              </Link>
            </div>
          </div>

          {/* ── Other comparisons ─────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.55 }}>
              More comparisons
            </p>
            <div className="flex flex-wrap gap-2">
              {allAlternativeSlugs
                .filter((s) => s !== slug)
                .map((s) => {
                  const other = alternativesBySlug[s];
                  return (
                    <Link
                      key={s}
                      href={`/alternatives/${s}`}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-75"
                      style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                    >
                      vs. {other.competitor}
                    </Link>
                  );
                })}
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
