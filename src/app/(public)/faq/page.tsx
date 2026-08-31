import type { Metadata } from "next";
import Link from "next/link";

const BASE = "https://lustpages.com";

export const metadata: Metadata = {
  title: "FAQ — LustPages",
  description: "Frequently asked questions about LustPages — accounts, coins, premium content, publishing, and more.",
  alternates: { canonical: `${BASE}/faq` },
  openGraph: {
    title: "FAQ — LustPages",
    description: "Frequently asked questions about LustPages — accounts, coins, premium content, publishing, and more.",
    type: "website",
    url: `${BASE}/faq`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "FAQ — LustPages",
    description: "Frequently asked questions about LustPages.",
    images: [`${BASE}/og-default.jpg`],
  },
};

const FAQ_JSONLD = [
  { q: "Is LustPages free to use?", a: "Yes. Reading most stories is completely free. Some authors publish premium stories or series that require coins to unlock, but every premium series has at least one free chapter so you can read before buying." },
  { q: "What are coins?", a: "Coins are the in-platform currency used to unlock premium stories and send tips to authors. You can purchase coins from the Store. New accounts receive a small welcome bonus." },
  { q: "Do I need an account to read stories?", a: "No. Free stories are accessible without an account. An account is required to like stories, leave comments, bookmark favourites, track reading progress, and unlock premium content." },
  { q: "How old do I need to be to use LustPages?", a: "LustPages is strictly for adults. You must be at least 18 years old — or the age of majority in your jurisdiction, whichever is greater." },
  { q: "How do I publish a story?", a: "Register for a free account, then go to your Author Dashboard and click New Story. Once submitted, a moderator will review your story before it goes live — usually within 24–48 hours." },
  { q: "What content is not allowed?", a: "Any fictional character in a sexual situation must be depicted as an adult. We prohibit content involving minors, non-consensual scenarios presented approvingly, and content targeting real individuals without consent indicators." },
  { q: "My story was rejected. What do I do?", a: "The rejection reason is shown in your dashboard. Fix the issues described, then resubmit. If you think the rejection was in error, contact us at authors@lustpages.com with your story title and we'll review it." },
  { q: "How do I earn as an author?", a: "Authors earn through two routes: readers can tip you directly on any story (you keep 80% of every tip), and you can set a coin price for standalone stories or premium series." },
  { q: "I found content that infringes my copyright. What should I do?", a: "Submit a formal DMCA notice using the procedure on our DMCA page. Do not email general support for copyright matters — only notices sent to the designated DMCA agent are processed under 17 U.S.C. § 512." },
  { q: "How do I delete my account?", a: "You can delete your account from Account Settings. Deletion is permanent and will remove your login access. Stories you have published will remain on the platform unless you delete them individually first." },
];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is LustPages free to use?",
    a: "Yes. Reading most stories is completely free. Some authors publish premium stories or series that require coins to unlock, but every premium series has at least one free chapter so you can read before buying.",
  },
  {
    q: "What are coins?",
    a: (
      <>
        Coins are the in-platform currency used to unlock premium stories and send tips to authors. You can purchase coins from the{" "}
        <Link href="/store" style={{ color: "#c4426a" }}>Store</Link>. New accounts receive a small welcome bonus.
      </>
    ),
  },
  {
    q: "Do I need an account to read stories?",
    a: "No. Free stories are accessible without an account. An account is required to like stories, leave comments, bookmark favourites, track reading progress, and unlock premium content.",
  },
  {
    q: "How old do I need to be to use LustPages?",
    a: "LustPages is strictly for adults. You must be at least 18 years old — or the age of majority in your jurisdiction, whichever is greater. By accessing the site you confirm you meet this requirement.",
  },
  {
    q: "How do I publish a story?",
    a: (
      <>
        Register for a free account, then go to your{" "}
        <Link href="/author-dashboard" style={{ color: "#c4426a" }}>Author Dashboard</Link>{" "}
        and click &quot;New Story.&quot; Once submitted, a moderator will review your story before it goes live — usually within 24–48 hours.
      </>
    ),
  },
  {
    q: "What content is not allowed?",
    a: (
      <>
        Any fictional character in a sexual situation must be depicted as an adult. We prohibit content involving minors, non-consensual scenarios presented approvingly, and content targeting real individuals without consent indicators. See our{" "}
        <Link href="/content-warning" style={{ color: "#c4426a" }}>Content Warning Policy</Link> and{" "}
        <Link href="/terms" style={{ color: "#c4426a" }}>Terms of Service</Link> for full details.
      </>
    ),
  },
  {
    q: "My story was rejected. What do I do?",
    a: "The rejection reason is shown in your dashboard. Fix the issues described, then resubmit. If you think the rejection was in error, contact us at authors@lustpages.com with your story title and we'll review it.",
  },
  {
    q: "How do I earn as an author?",
    a: "Authors earn through two routes: readers can tip you directly on any story (you keep 80% of every tip), and you can set a coin price for standalone stories or premium series. Earnings accumulate in your author wallet and can be requested for payout once you reach the minimum threshold.",
  },
  {
    q: "I found content that infringes my copyright. What should I do?",
    a: (
      <>
        Submit a formal DMCA notice using the procedure on our{" "}
        <Link href="/dmca" style={{ color: "#c4426a" }}>DMCA page</Link>. Do not email general support for copyright matters — only notices sent to the designated DMCA agent are processed under 17 U.S.C. § 512.
      </>
    ),
  },
  {
    q: "How do I delete my account?",
    a: (
      <>
        You can delete your account from{" "}
        <Link href="/account/settings" style={{ color: "#c4426a" }}>Account Settings</Link>. Deletion is permanent and will remove your login access. Stories you have published will remain on the platform unless you delete them individually first.
      </>
    ),
  },
];

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_JSONLD.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }),
        }}
      />
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Help</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Frequently Asked Questions
        </h1>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq) => (
          <details
            key={faq.q}
            className="group rounded-2xl overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <summary
              className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none font-semibold text-sm select-none"
              style={{ color: "var(--foreground)" }}
            >
              {faq.q}
              <span
                className="shrink-0 text-lg leading-none transition-transform group-open:rotate-45"
                style={{ color: "#c4426a" }}
                aria-hidden
              >
                +
              </span>
            </summary>
            <div className="px-5 pb-5 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {faq.a}
            </div>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
        Still have questions?{" "}
        <Link href="/contact" style={{ color: "#c4426a" }}>Contact us</Link>.
      </p>
    </div>
    </>
  );
}
