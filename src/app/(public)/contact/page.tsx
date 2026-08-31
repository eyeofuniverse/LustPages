import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "Contact — LustPages",
  description: "Get in touch with the LustPages team — for support, author enquiries, or copyright matters.",
  alternates: { canonical: `${BASE}/contact` },
  openGraph: {
    title: "Contact — LustPages",
    description: "Get in touch with the LustPages team — for support, author enquiries, or copyright matters.",
    type: "website",
    url: `${BASE}/contact`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact — LustPages",
    description: "Get in touch with the LustPages team.",
    images: [`${BASE}/og-default.jpg`],
  },
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Contact</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Get in Touch
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Choose the right channel below — we aim to respond within 3 business days.
        </p>
      </div>

      <div className="space-y-4">
        {[
          {
            title: "General Support",
            desc: "Account issues, technical problems, billing questions, or anything else.",
            email: "support@lustpages.com",
          },
          {
            title: "Author Enquiries",
            desc: "Questions about publishing, earnings, story review, or the author programme.",
            email: "authors@lustpages.com",
          },
          {
            title: "Copyright / DMCA",
            desc: "To report infringing content, use our dedicated DMCA process.",
            link: { href: "/dmca", label: "DMCA Policy" },
            email: "dmca@lustpages.com",
          },
          {
            title: "Advertising",
            desc: "Partnership and advertising enquiries.",
            email: "ads@lustpages.com",
          },
        ].map((item) => (
          <div
            key={item.email}
            className="p-5 rounded-2xl"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <h2 className="font-bold text-base mb-1" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
              {item.title}
            </h2>
            <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
              {item.desc}{" "}
              {item.link && (
                <>
                  See the{" "}
                  <Link href={item.link.href} style={{ color: "#c4426a" }}>{item.link.label}</Link>
                  {" "}for required fields.
                </>
              )}
            </p>
            <a
              href={`mailto:${item.email}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ color: "#c4426a" }}
            >
              {item.email}
            </a>
          </div>
        ))}
      </div>

      <p className="mt-10 text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
        To report a story that violates our content rules, use the Report button on the story page — that goes directly to our moderation queue.
      </p>
    </div>
  );
}
