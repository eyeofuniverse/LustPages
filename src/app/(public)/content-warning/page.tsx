import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ShieldCheck, BookOpen, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Content Warning & Disclaimer",
  description: "Important information about the nature of content on LustPages, including content warnings and disclaimers.",
  robots: { index: true, follow: true },
};

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 mt-0.5">{icon}</div>
        <div>
          <h3 className="font-bold mb-2" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>{title}</h3>
          <div className="text-sm leading-relaxed space-y-2" style={{ color: "var(--muted-foreground)" }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContentWarningPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Legal</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Content Warning & Disclaimer
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Please read before proceeding.</p>
      </div>

      {/* Primary Warning */}
      <div
        className="flex items-start gap-4 p-5 rounded-2xl mb-8"
        style={{ background: "rgba(196,66,106,0.08)", border: "2px solid rgba(196,66,106,0.3)" }}
      >
        <AlertTriangle size={24} className="shrink-0 mt-0.5" style={{ color: "#c4426a" }} />
        <div>
          <h2 className="font-bold text-lg mb-2" style={{ color: "#c4426a", fontFamily: "var(--font-playfair), serif" }}>
            Adults Only — 18+
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            LustPages contains <strong style={{ color: "var(--foreground)" }}>sexually explicit material</strong> intended exclusively for adults aged 18 years or older (or the age of majority in your jurisdiction). If you are a minor, or if explicit sexual content offends you, or if it is illegal to view such content in your community, you must leave this site immediately.
          </p>
        </div>
      </div>

      <div className="space-y-4 mb-10">
        <Card
          icon={<BookOpen size={20} style={{ color: "#6366f1" }} />}
          title="Nature of Content"
        >
          <p>LustPages is a platform for adult fiction — written erotic and romantic stories submitted by independent authors. Content on this site may include:</p>
          <ul className="list-disc pl-4 space-y-1 mt-2">
            <li>Explicit sexual descriptions between consenting adults</li>
            <li>Themes of romance, fantasy, BDSM (consensual), and contemporary erotica</li>
            <li>Strong language and mature themes</li>
            <li>Content exploring taboo or fantasy scenarios within a fictional context</li>
          </ul>
          <p className="mt-2">Content is categorised and tagged to help readers find what they enjoy and avoid what they do not. We encourage you to use these filters.</p>
        </Card>

        <Card
          icon={<ShieldCheck size={20} style={{ color: "#22c55e" }} />}
          title="All Content is Fictional"
        >
          <p>All stories, characters, names, places, incidents, and situations on LustPages are entirely fictional. Any resemblance to actual persons, living or dead, or actual events is purely coincidental.</p>
          <p><strong style={{ color: "var(--foreground)" }}>All characters depicted in sexual situations are adults aged 18 years or older.</strong> LustPages has a zero-tolerance policy for any content that sexualises or depicts minors. Such content is illegal, and we will remove it immediately and report it to the relevant authorities.</p>
        </Card>

        <Card
          icon={<Users size={20} style={{ color: "#f59e0b" }} />}
          title="User-Generated Content"
        >
          <p>Stories on LustPages are written and submitted by independent authors. While we review all content before publication and enforce our <Link href="/terms" style={{ color: "#c4426a" }}>content policies</Link>, we cannot guarantee that every piece of content will suit your personal preferences or expectations.</p>
          <p>If you encounter content you believe violates our policies — including content that appears to involve minors, non-consensual acts presented approvingly, or content that is otherwise illegal — please report it immediately using the report button on the story page or by contacting <a href="mailto:reports@lustpages.com" style={{ color: "#c4426a" }}>reports@lustpages.com</a>.</p>
        </Card>
      </div>

      {/* Specific Warnings Grid */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4" style={{ color: "var(--foreground)", fontFamily: "var(--font-playfair), serif" }}>
          Specific Content Warnings
        </h2>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          Stories may be tagged with the following warnings. Always check a story&rsquo;s tags before reading.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            "Explicit sexual content",
            "Strong language",
            "BDSM / kink themes",
            "Non-consent fantasy (fiction only)",
            "Dubious consent (fiction only)",
            "Violence (non-sexual)",
            "Infidelity / cheating",
            "Taboo fantasy scenarios",
            "Polyamory / multiple partners",
          ].map((w) => (
            <div
              key={w}
              className="px-3 py-2 rounded-xl text-xs font-medium text-center"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
            >
              {w}
            </div>
          ))}
        </div>
      </div>

      {/* Absolute Prohibitions */}
      <div
        className="p-5 rounded-2xl mb-10"
        style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}
      >
        <h2 className="font-bold text-lg mb-3" style={{ color: "#ef4444", fontFamily: "var(--font-playfair), serif" }}>
          Absolutely Prohibited Content
        </h2>
        <p className="text-sm mb-3" style={{ color: "var(--muted-foreground)" }}>
          The following content is strictly prohibited and will never appear on LustPages:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
          <li>Any sexual content involving minors (CSAM) — zero tolerance, immediately reported to authorities</li>
          <li>Real-person sexual content without clear consent indicators</li>
          <li>Content glorifying or instructing real-world violence, terrorism, or hate crimes</li>
          <li>Content that is illegal under applicable law</li>
        </ul>
      </div>

      {/* Mental Health Note */}
      <div
        className="p-5 rounded-2xl mb-10 text-sm leading-relaxed"
        style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
      >
        <strong style={{ color: "var(--foreground)" }}>A note on wellbeing:</strong> Adult fiction is a legitimate and healthy form of entertainment for adults. However, if you find that your reading habits are causing distress, affecting your relationships, or feel compulsive, we encourage you to speak with a qualified mental health professional.
      </div>

      <div className="mt-10 pt-6 flex gap-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
        <Link href="/terms" style={{ color: "#c4426a" }}>Terms of Service</Link>
        <span>·</span>
        <Link href="/privacy" style={{ color: "#c4426a" }}>Privacy Policy</Link>
        <span>·</span>
        <Link href="/" style={{ color: "#c4426a" }}>Home</Link>
      </div>
    </div>
  );
}
