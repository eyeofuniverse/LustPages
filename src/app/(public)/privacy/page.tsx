import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How LustPages collects, uses, and protects your personal data.",
  robots: { index: true, follow: true },
};

const UPDATED = "26 May 2026";
const CONTACT = "privacy@lustpages.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2
        className="text-xl font-bold mb-4 pb-2"
        style={{ color: "var(--foreground)", borderBottom: "1px solid var(--border)", fontFamily: "var(--font-playfair), serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Legal</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Privacy Policy
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Last updated: {UPDATED}</p>
      </div>

      <div
        className="p-4 rounded-xl mb-10 text-sm"
        style={{ background: "rgba(196,66,106,0.07)", border: "1px solid rgba(196,66,106,0.2)", color: "var(--muted-foreground)" }}
      >
        <strong style={{ color: "var(--foreground)" }}>Your privacy matters.</strong> LustPages is an adult content platform. We understand that our users are particularly sensitive about data privacy. We do not sell your data, we do not share your reading history with third parties for advertising, and we take reasonable technical and organisational steps to keep your information secure.
      </div>

      <Section title="1. Who We Are">
        <p>LustPages (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the website at <strong>lustpages.com</strong>. We are the data controller for personal information collected through this site. You can contact us at <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a>.</p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong style={{ color: "var(--foreground)" }}>Account information:</strong> When you register, we collect your name, email address, and a hashed password. We never store your password in plain text.</p>
        <p><strong style={{ color: "var(--foreground)" }}>Reading activity:</strong> We record which stories you have bookmarked, liked, and your reading progress. This data is used solely to provide the service (e.g. resuming where you left off) and to generate anonymous, aggregated analytics for authors.</p>
        <p><strong style={{ color: "var(--foreground)" }}>Payment information:</strong> When payments are enabled, cryptocurrency transactions are processed by NOWPayments. We do not store any card numbers or wallet private keys. We record the transaction ID, amount, and status for accounting purposes.</p>
        <p><strong style={{ color: "var(--foreground)" }}>Communications:</strong> If you contact us by email or submit content as an author, we retain that correspondence.</p>
        <p><strong style={{ color: "var(--foreground)" }}>Technical data:</strong> We collect standard server logs including IP address, browser type, pages visited, and timestamps. These logs are retained for up to 90 days for security and debugging purposes.</p>
      </Section>

      <Section title="3. Cookies">
        <p>We use the following cookies:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong style={{ color: "var(--foreground)" }}>Age verification cookie</strong> (<code>lustpages_age_verified</code>) — set for 365 days when you confirm you are 18+. Without this cookie you will be shown the age gate on every visit.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Session cookie</strong> (<code>next-auth.session-token</code>) — set when you log in. Used to keep you authenticated. Expires when you log out or after 30 days of inactivity.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Theme preference</strong> — a lightweight localStorage entry storing your dark/light mode preference. Not transmitted to our servers.</li>
        </ul>
        <p>We do not use advertising cookies, third-party tracking pixels, or behavioural profiling cookies.</p>
      </Section>

      <Section title="4. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate and improve the LustPages platform</li>
          <li>To authenticate your account and keep your session secure</li>
          <li>To deliver transactional emails (welcome, password reset, purchase receipts)</li>
          <li>To provide authors with anonymous aggregated analytics (total views, likes, bookmarks)</li>
          <li>To detect and prevent fraud, abuse, and illegal activity</li>
          <li>To comply with applicable law</li>
        </ul>
        <p>We do <strong style={{ color: "var(--foreground)" }}>not</strong> use your reading history to serve targeted advertising. We do not sell, rent, or trade your personal data to any third party.</p>
      </Section>

      <Section title="5. Third-Party Services">
        <p>We use the following sub-processors who may handle your data:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong style={{ color: "var(--foreground)" }}>Supabase</strong> — database hosting (EU region). Your account data and reading history are stored here.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Vercel</strong> — application hosting and CDN. Processes request logs.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Resend</strong> — transactional email delivery. Your email address is shared only to deliver emails you have requested.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Atlos</strong> — cryptocurrency payment processing for coin subscriptions. Relevant only when you make a purchase.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Cloudinary</strong> — image hosting for story cover images. No personal data is stored.</li>
        </ul>
        <p>Each sub-processor is bound by data processing agreements and is prohibited from using your data for their own purposes.</p>
      </Section>

      <Section title="6. Data Retention">
        <p>We retain your account data for as long as your account is active. If you request deletion of your account, we will delete or anonymise your personal data within 30 days, except where we are required by law to retain it (e.g. financial transaction records, which are retained for 7 years).</p>
        <p>Anonymised, aggregated analytics data (e.g. total story view counts) may be retained indefinitely as it cannot be linked back to any individual.</p>
      </Section>

      <Section title="7. Your Rights">
        <p>Depending on your jurisdiction you may have the right to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong style={{ color: "var(--foreground)" }}>Access</strong> — request a copy of the personal data we hold about you</li>
          <li><strong style={{ color: "var(--foreground)" }}>Rectification</strong> — correct inaccurate data</li>
          <li><strong style={{ color: "var(--foreground)" }}>Erasure</strong> — request deletion of your account and associated data</li>
          <li><strong style={{ color: "var(--foreground)" }}>Portability</strong> — receive your data in a machine-readable format</li>
          <li><strong style={{ color: "var(--foreground)" }}>Objection</strong> — object to processing based on legitimate interests</li>
          <li><strong style={{ color: "var(--foreground)" }}>Withdrawal of consent</strong> — where processing is based on consent, withdraw it at any time</li>
        </ul>
        <p>To exercise any of these rights, email us at <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a>. We will respond within 30 days.</p>
      </Section>

      <Section title="8. Children's Privacy">
        <p>LustPages is strictly for adults aged 18 or over (or the age of majority in your jurisdiction, whichever is higher). We do not knowingly collect personal information from minors. If we discover that a minor has created an account, we will immediately delete all associated data. If you believe a minor has accessed our service, please contact us immediately.</p>
      </Section>

      <Section title="9. Security">
        <p>We implement industry-standard security measures including TLS encryption in transit, hashed passwords (bcrypt), and access controls limiting who within our team can access user data. However, no system is completely secure and we cannot guarantee absolute security.</p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Material changes will be notified by email to registered users and by a prominent notice on the site. Your continued use of LustPages after the effective date constitutes acceptance of the updated policy.</p>
      </Section>

      <Section title="11. Contact">
        <p>For privacy-related enquiries: <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a></p>
      </Section>

      <div className="mt-10 pt-6 flex gap-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
        <Link href="/terms" style={{ color: "#c4426a" }}>Terms of Service</Link>
        <span>·</span>
        <Link href="/content-warning" style={{ color: "#c4426a" }}>Content Warning</Link>
        <span>·</span>
        <Link href="/" style={{ color: "#c4426a" }}>Home</Link>
      </div>
    </div>
  );
}
