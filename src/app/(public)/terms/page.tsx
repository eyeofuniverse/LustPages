import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "LustPages Terms of Service — acceptable use, content rules, and your legal agreement with us.",
  robots: { index: true, follow: true },
};

const UPDATED = "26 May 2026";
const CONTACT = "legal@lustpages.com";

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

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Legal</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          Terms of Service
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Last updated: {UPDATED}</p>
      </div>

      <div
        className="p-4 rounded-xl mb-10 text-sm"
        style={{ background: "rgba(196,66,106,0.07)", border: "1px solid rgba(196,66,106,0.2)", color: "var(--muted-foreground)" }}
      >
        Please read these Terms of Service carefully before using LustPages. By accessing or using our platform you agree to be bound by these terms. If you do not agree, you must not use the site.
      </div>

      <Section title="1. Eligibility">
        <p>You must be at least <strong style={{ color: "var(--foreground)" }}>18 years of age</strong> — or the age of majority in your jurisdiction, whichever is greater — to access LustPages. By using this site you represent and warrant that you meet this requirement.</p>
        <p>If you are accessing LustPages from a jurisdiction where adult content is restricted or prohibited, you are solely responsible for compliance with your local laws. We do not represent that our content is appropriate or lawful for use in all locations.</p>
      </Section>

      <Section title="2. Account Registration">
        <p>You may browse a limited amount of content without an account. To post stories, bookmark content, or interact with the community you must register an account.</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>You must provide accurate and complete registration information.</li>
          <li>You are responsible for maintaining the confidentiality of your password.</li>
          <li>You are responsible for all activity that occurs under your account.</li>
          <li>You must notify us immediately of any unauthorised use of your account at <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a>.</li>
          <li>You may not create more than one account per person, or create an account on behalf of another person without their consent.</li>
        </ul>
      </Section>

      <Section title="3. Acceptable Use">
        <p>You agree not to use LustPages to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Upload, post, or transmit any content that depicts minors in a sexual context — this is an absolute prohibition and will result in immediate account termination and reporting to the relevant authorities.</li>
          <li>Upload content involving non-consensual acts presented approvingly or in a positive light.</li>
          <li>Harass, stalk, threaten, or abuse other users or authors.</li>
          <li>Impersonate any person or entity, or misrepresent your affiliation with any person or entity.</li>
          <li>Upload content that infringes any third-party copyright, trademark, or other intellectual property right.</li>
          <li>Attempt to gain unauthorised access to any portion of the platform, other accounts, or our systems.</li>
          <li>Scrape, crawl, or otherwise automatically collect data from the platform without our written consent.</li>
          <li>Use the platform for any unlawful purpose or in violation of any applicable local, national, or international law.</li>
          <li>Distribute spam, malware, or any other harmful code.</li>
        </ul>
      </Section>

      <Section title="4. Author Content & Publishing Rules">
        <p>Authors who publish stories on LustPages agree to the following:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong style={{ color: "var(--foreground)" }}>Age of characters:</strong> All characters depicted in sexual situations must be clearly adults (18+). Any ambiguity will be treated as a violation.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Originality:</strong> You represent that your submitted content is original work and does not infringe any third-party rights.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Ownership:</strong> You retain copyright in your work. By submitting, you grant LustPages a non-exclusive, royalty-free, worldwide licence to display, reproduce, and distribute your content on the platform.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Prohibited content:</strong> Content glorifying real-world violence, terrorism, child exploitation, or illegal acts is strictly forbidden regardless of its fictional framing.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Moderation:</strong> All submitted stories are subject to review before publication. We reserve the right to reject, remove, or edit any content at our sole discretion.</li>
          <li><strong style={{ color: "var(--foreground)" }}>Removal:</strong> You may request removal of your content at any time. Removed content will be unpublished within 48 hours.</li>
        </ul>
      </Section>

      <Section title="5. Content Monetisation">
        <p>When our coin and payment system is active, the following rules apply:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Authors earn <strong style={{ color: "var(--foreground)" }}>80%</strong> of all coins spent unlocking their stories and from tips received.</li>
          <li>LustPages retains a <strong style={{ color: "var(--foreground)" }}>20% platform fee</strong> on all monetary transactions.</li>
          <li>Coins are virtual credits with no cash value unless redeemed through the author payout system.</li>
          <li>All purchases are final. We do not offer refunds on coin purchases except where required by law.</li>
          <li>Payouts are processed at our discretion and subject to minimum thresholds and identity verification requirements.</li>
          <li>We reserve the right to withhold earnings from accounts found to be in violation of these Terms.</li>
          <li>Authors are solely responsible for declaring and paying any applicable taxes on their earnings.</li>
        </ul>
      </Section>

      <Section title="6. Intellectual Property">
        <p>The LustPages name, logo, platform design, and original content produced by us are our intellectual property and may not be reproduced without written permission.</p>
        <p>User-submitted stories remain the intellectual property of their respective authors. LustPages makes no claim of ownership over author content.</p>
        <p>If you believe content on LustPages infringes your copyright, please send a DMCA takedown notice to <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a> including: identification of the copyrighted work, the URL of the infringing content, your contact information, and a statement of good faith belief.</p>
      </Section>

      <Section title="7. Privacy">
        <p>Your use of LustPages is also governed by our <Link href="/privacy" style={{ color: "#c4426a" }}>Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
      </Section>

      <Section title="8. Disclaimer of Warranties">
        <p>LustPages is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
        <p>We do not warrant that the platform will be uninterrupted, error-free, or free of viruses or other harmful components.</p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>To the fullest extent permitted by applicable law, LustPages and its operators shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, goodwill, or other intangible losses, arising out of or relating to your use of the platform.</p>
        <p>Our total liability to you for any claims arising from your use of the platform shall not exceed the greater of (a) the amount you paid to LustPages in the 12 months preceding the claim, or (b) USD $50.</p>
        <p>We are not responsible for user-generated content published on the platform. Authors are solely responsible for the content they submit.</p>
      </Section>

      <Section title="10. Termination">
        <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms or for any other reason at our sole discretion.</p>
        <p>You may delete your account at any time by contacting us. Upon termination, your right to use the platform ceases immediately. Provisions that by their nature should survive termination will do so, including intellectual property rights, disclaimers, and limitations of liability.</p>
      </Section>

      <Section title="11. Governing Law & Disputes">
        <p>These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising from these Terms or your use of LustPages shall first be attempted to be resolved through good-faith negotiation. If unresolved, disputes shall be submitted to binding arbitration.</p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>We may modify these Terms at any time. We will provide at least 14 days&rsquo; notice of material changes by email and by posting a notice on the site. Your continued use of LustPages after the effective date of changes constitutes your acceptance of the updated Terms.</p>
      </Section>

      <Section title="13. Contact">
        <p>For legal enquiries: <a href={`mailto:${CONTACT}`} style={{ color: "#c4426a" }}>{CONTACT}</a></p>
      </Section>

      <div className="mt-10 pt-6 flex gap-4 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
        <Link href="/privacy" style={{ color: "#c4426a" }}>Privacy Policy</Link>
        <span>·</span>
        <Link href="/content-warning" style={{ color: "#c4426a" }}>Content Warning</Link>
        <span>·</span>
        <Link href="/" style={{ color: "#c4426a" }}>Home</Link>
      </div>
    </div>
  );
}
