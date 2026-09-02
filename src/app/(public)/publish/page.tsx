import type { Metadata } from "next";
import Link from "next/link";
import { getCachedPublicStats } from "@/lib/cached-queries";
import {
  PenSquare, DollarSign, Users, BarChart2, Shield,
  BookOpen, CheckCircle, Star, Zap, Globe, Heart,
} from "lucide-react";
import { formatStatCount } from "@/lib/utils";

const BASE = "https://lustpages.com";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Publish Your Erotica & Adult Fiction — Write on LustPages",
  description:
    "LustPages is the best platform to publish adult fiction and erotica stories online. Free to join, earn from tips and premium content, and build a loyal readership.",
  alternates: { canonical: `${BASE}/publish` },
  keywords: [
    "publish erotica online", "adult fiction writing platform",
    "where to publish adult stories", "publish erotic stories",
    "erotica author platform", "write adult fiction online",
    "publish nsfw stories", "erotica writing site",
    "adult story platform for writers",
  ],
  openGraph: {
    title: "Publish Your Adult Fiction on LustPages — Free to Join",
    description:
      "Build a readership, earn from your writing, and publish without limits. LustPages is the home for serious adult fiction authors.",
    type: "website",
    url: `${BASE}/publish`,
    images: [{ url: `${BASE}/og-default.jpg`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Publish Your Adult Fiction on LustPages",
    description: "Build a readership, earn from your writing, and publish without limits.",
    images: [`${BASE}/og-default.jpg`],
  },
};

const benefits = [
  {
    icon: DollarSign,
    title: "Earn from your writing",
    body: "Readers tip your stories with coins and unlock premium chapters. Set your own price per story or per series — you decide how much your work is worth.",
    color: "#22c55e",
  },
  {
    icon: Users,
    title: "A built-in readership",
    body: "Your stories appear in Browse, Trending, and category pages from day one. Readers actively searching for your genre will find you — no social following required.",
    color: "#6366f1",
  },
  {
    icon: BarChart2,
    title: "Real-time analytics",
    body: "See exactly who's reading, which stories earn the most, and where readers drop off. Make informed decisions about what to write next.",
    color: "#f59e0b",
  },
  {
    icon: Shield,
    title: "Publish without fear",
    body: "This is an adult platform built for adult content. Write explicit fiction freely — no shadow bans, no demonetisation for mature themes, no algorithm designed to hide your work.",
    color: "#c4426a",
  },
  {
    icon: Globe,
    title: "Own your SEO",
    body: "Each story gets its own URL, meta title, meta description, and open-graph image. Your work can rank on Google and bring in organic readers every day.",
    color: "#06b6d4",
  },
  {
    icon: Heart,
    title: "Build a loyal following",
    body: "Readers follow your author profile, bookmark your stories, and leave comments. Series build anticipation. Real fans come back for every new chapter.",
    color: "#a855f7",
  },
];

const steps = [
  {
    n: "1",
    title: "Create your author profile",
    body: "Sign up free. Complete your bio, add a photo, and set your pen name. Your profile is your public brand on the platform.",
  },
  {
    n: "2",
    title: "Write and submit your story",
    body: "Use our rich editor to write or paste your story. Add categories, tags, cover image, and SEO fields. Submit for review — approval usually takes under 24 hours.",
  },
  {
    n: "3",
    title: "Grow your audience and earn",
    body: "Once published, your story is live to thousands of readers. Promote it, keep writing, and watch tips and premium unlocks come in.",
  },
];

const features = [
  "Rich-text editor with full formatting",
  "Cover image upload",
  "Series and chapter management",
  "Custom SEO fields per story",
  "Coin tips from readers",
  "Premium story gating with coin price you set",
  "Author analytics dashboard",
  "Reader comments and ratings",
  "Achievement badges",
  "Author follow system",
  "Story scheduling",
  "Draft saving",
];

const faqs = [
  {
    q: "Is it free to publish on LustPages?",
    a: "Yes — creating an account and publishing stories is completely free. LustPages takes a platform fee on coin earnings, but there are no upfront costs.",
  },
  {
    q: "What kind of content is allowed?",
    a: "All fictional characters in sexual situations must be adults. Non-consensual content presented approvingly is not permitted. Explicit adult fiction, BDSM, dark themes, and taboo subjects are allowed within those rules. See our Terms of Service for the full policy.",
  },
  {
    q: "How do authors earn money?",
    a: "Readers purchase LustPages coins and spend them in two ways: tipping stories they love, and unlocking premium chapters you've priced. You receive your share of every coin spent on your content.",
  },
  {
    q: "Does my content get reviewed before publishing?",
    a: "Yes. Every new submission is reviewed by our moderation team to ensure it meets our content policy. This keeps the platform safe and your work in front of a quality audience.",
  },
  {
    q: "Can I publish a series with paid chapters?",
    a: "Yes. Create a series, offer free chapters to hook readers, then gate later chapters with a coin price. Readers unlock the full series in one purchase — better conversion than per-chapter pricing.",
  },
  {
    q: "Will my stories appear in Google search?",
    a: "Yes. Each story has its own URL and full SEO fields — meta title, meta description, and open-graph image. Stories marked Public are indexed by Google and can rank for search queries.",
  },
];

export default async function PublishPage() {
  const stats = await getCachedPublicStats();

  return (
    <div className="min-h-screen">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, var(--background) 0%, color-mix(in srgb, #c4426a 6%, var(--background)) 100%)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <p
            className="text-xs uppercase tracking-widest font-semibold mb-4"
            style={{ color: "#c4426a" }}
          >
            For Authors
          </p>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            The platform built for{" "}
            <span style={{ color: "#c4426a" }}>serious adult fiction</span>
          </h1>
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "var(--muted-foreground)" }}
          >
            Publish erotica and adult fiction without limits. Build a readership, earn from tips
            and premium content, and own your SEO — all on a platform designed for exactly what you write.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              <PenSquare size={18} />
              Start Writing Free
            </Link>
            <Link
              href="/authors"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold transition-opacity hover:opacity-75"
              style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--card)" }}
            >
              Browse Authors
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live stats ───────────────────────────────────────────── */}
      <section style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-center">
            {[
              { value: formatStatCount(stats.publishedStories), label: "Published Stories", sub: "and growing every day" },
              { value: formatStatCount(stats.totalUsers), label: "Registered Members", sub: "readers and authors" },
              { value: "Free", label: "to publish", sub: "no upfront cost, ever" },
            ].map(({ value, label, sub }) => (
              <div key={label}>
                <p
                  className="text-3xl sm:text-4xl font-bold mb-1"
                  style={{ fontFamily: "var(--font-playfair), serif", color: "#c4426a" }}
                >
                  {value}
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "#c4426a" }}>Why LustPages</p>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Everything a serious author needs
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {benefits.map(({ icon: Icon, title, body, color }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}18` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: "var(--foreground)" }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "#c4426a" }}>Getting Started</p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              Three steps to your first reader
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="text-center sm:text-left">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto sm:mx-0 mb-4 text-xl font-bold"
                  style={{
                    fontFamily: "var(--font-playfair), serif",
                    background: "rgba(196,66,106,0.1)",
                    color: "#c4426a",
                  }}
                >
                  {n}
                </div>
                <h3 className="text-base font-bold mb-2" style={{ color: "var(--foreground)" }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature checklist ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "#c4426a" }}>
              What you get
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold mb-4"
              style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
            >
              A complete author toolkit
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
              Every feature you need to publish, grow, and earn — included from the moment you sign up.
              No tiers, no paywalls for author tools.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: "#c4426a" }}
            >
              <Zap size={15} />
              Create your account
            </Link>
          </div>
          <div
            className="rounded-2xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <CheckCircle size={16} style={{ color: "#22c55e", flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Earnings callout ─────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg, color-mix(in srgb, #c4426a 8%, var(--background)) 0%, var(--background) 100%)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: "rgba(196,66,106,0.12)" }}
          >
            <Star size={26} style={{ color: "#c4426a" }} />
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Your writing is worth paying for
          </h2>
          <p className="text-base leading-relaxed mb-8 max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
            LustPages readers use coins to tip stories they love and unlock premium chapters.
            You set the price on every story. Every coin spent on your work goes toward your author earnings —
            there is no algorithm deciding whether you get paid.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Tip earnings", desc: "Readers tip any published story with coins" },
              { label: "Premium gates", desc: "Lock chapters behind a coin price you choose" },
              { label: "Series unlocks", desc: "Readers pay once to unlock a full series" },
            ].map(({ label, desc }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-left"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--foreground)" }}>{label}</p>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{desc}</p>
              </div>
            ))}
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#c4426a" }}
          >
            <PenSquare size={18} />
            Start writing free today
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: "#c4426a" }}>FAQ</p>
          <h2
            className="text-3xl sm:text-4xl font-bold"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Common author questions
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map(({ q, a }) => (
            <div
              key={q}
              className="rounded-2xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>{q}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────── */}
      <section
        className="text-center"
        style={{ background: "var(--card)", borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <BookOpen size={36} className="mx-auto mb-5" style={{ color: "#c4426a" }} />
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ fontFamily: "var(--font-playfair), serif", color: "var(--foreground)" }}
          >
            Ready to publish?
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: "var(--muted-foreground)" }}>
            Join thousands of authors already publishing on LustPages. Your account is free, your
            stories are yours, and your first reader is waiting.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl text-base font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "#c4426a" }}
          >
            <PenSquare size={18} />
            Create your free account
          </Link>
          <p className="mt-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#c4426a" }}>Sign in</Link>
          </p>
        </div>
      </section>

    </div>
  );
}
