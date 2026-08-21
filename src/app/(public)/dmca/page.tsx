import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA Policy — LustPages",
  description: "LustPages DMCA takedown procedure — how to report copyright-infringing content and what to expect.",
  robots: { index: true, follow: true },
};

const UPDATED = "21 Aug 2026";
const DMCA_EMAIL = "dmca@lustpages.com";

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

export default function DmcaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#c4426a" }}>Legal</p>
        <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}>
          DMCA Policy
        </h1>
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Last updated: {UPDATED}</p>
      </div>

      <div
        className="p-4 rounded-xl mb-10 text-sm"
        style={{ background: "rgba(196,66,106,0.07)", border: "1px solid rgba(196,66,106,0.2)", color: "var(--muted-foreground)" }}
      >
        LustPages respects intellectual property rights and complies with the Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512. If you believe your copyrighted work has been published on this platform without authorisation, you may submit a takedown notice using the procedure below.
      </div>

      <Section title="1. Designated Agent">
        <p>
          Our designated DMCA agent for receiving takedown notices is reachable at:{" "}
          <a href={`mailto:${DMCA_EMAIL}`} style={{ color: "#c4426a" }}>{DMCA_EMAIL}</a>
        </p>
        <p>
          This is the <strong style={{ color: "var(--foreground)" }}>only</strong> authorised channel for copyright notices. Notices sent through other means (comment forms, social media, general contact) will not be processed as DMCA notices.
        </p>
      </Section>

      <Section title="2. Requirements for a Valid Takedown Notice">
        <p>To be valid under 17 U.S.C. § 512(c)(3), your notice must include all of the following:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>A physical or electronic signature of the copyright owner or authorised agent.</li>
          <li>Identification of the copyrighted work (or a representative list of works) that you claim has been infringed.</li>
          <li>Identification of the material claimed to be infringing, with sufficient detail to locate it (e.g. the URL of the specific page).</li>
          <li>Your contact information: name, address, telephone number, and email address.</li>
          <li>A statement that you have a good-faith belief that the disputed use is not authorised by the copyright owner, its agent, or the law.</li>
          <li>A statement that the information in the notice is accurate and, under penalty of perjury, that you are the copyright owner or authorised to act on the copyright owner&apos;s behalf.</li>
        </ol>
        <p className="mt-2">
          <strong style={{ color: "var(--foreground)" }}>Warning:</strong> Knowingly submitting a false or misleading DMCA notice is a violation of 17 U.S.C. § 512(f) and may expose you to civil liability and damages.
        </p>
      </Section>

      <Section title="3. Counter-Notice Procedure">
        <p>
          If your content was removed in response to a DMCA notice and you believe the removal was made in error or based on misidentification, you may submit a counter-notice to{" "}
          <a href={`mailto:${DMCA_EMAIL}`} style={{ color: "#c4426a" }}>{DMCA_EMAIL}</a>.
        </p>
        <p>A valid counter-notice must include:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>Your physical or electronic signature.</li>
          <li>Identification of the material removed and the location where it appeared before removal.</li>
          <li>A statement under penalty of perjury that you have a good-faith belief the material was removed by mistake or misidentification.</li>
          <li>Your name, address, telephone number, and email address.</li>
          <li>A statement consenting to the jurisdiction of the federal court in your district (or, if outside the United States, any judicial district in which LustPages may be found).</li>
        </ol>
      </Section>

      <Section title="4. Repeat Infringers">
        <p>
          LustPages has a policy of terminating the accounts of users who are found to be repeat infringers of intellectual property rights, in appropriate circumstances.
        </p>
      </Section>

      <Section title="5. Response Timeline">
        <p>
          We aim to acknowledge valid DMCA notices within <strong style={{ color: "var(--foreground)" }}>5 business days</strong> and to take action on clearly valid notices promptly. Complex cases may take longer.
        </p>
      </Section>
    </div>
  );
}
