import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import path from "node:path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const STORY_CONTENT = `<p>The office was quiet at this hour, long past when the last junior analyst had packed up and fled for the weekend. But Sarah Whitmore stayed, as she always did, hunched over the quarterly projections on her screen.</p>

<p>She didn't hear him come in. Marcus Cole had that way about him—silent, purposeful, like a storm gathering on the horizon before anyone thought to check the sky.</p>

<p>"Still here?"</p>

<p>His voice carried easily across the polished floors. Sarah straightened, her pulse spiking before she had time to compose herself.</p>

<p>"The Henderson account doesn't close itself," she said, not turning around.</p>

<p>She heard his footsteps. Steady. Unhurried. The kind of confidence that came from knowing exactly what you wanted and exactly how to get it.</p>

<p>He set two glasses of whiskey on the desk beside her laptop.</p>

<p>"You've been avoiding me," Marcus said. Not accusatory. Just a fact, offered plainly.</p>

<p>Sarah finally looked up at him. He was still in his suit jacket, tie loosened just enough to be dangerous. She'd worked for Cole & Associates for three years. Three years of careful professional distance. Three years of pretending she didn't notice the way his eyes tracked her when he thought she wasn't watching.</p>

<p>"I've been busy," she said.</p>

<p>"Sarah." Just her name. But the way he said it made the room feel smaller, the air heavier.</p>

<p>She stood. A mistake—it put her too close to him. She could smell his cologne, something dark and woody. She'd noticed it before. She'd noticed everything, which was precisely the problem.</p>

<p>"This isn't professional," she managed.</p>

<p>"No," he agreed. "It isn't." His hand came up slowly, giving her every chance to step away. His fingers brushed her jaw, tilting her face up toward his. "But I think we stopped pretending a long time ago."</p>

<p>She should have argued. She had a hundred rational, professional reasons to step back. But his thumb traced the line of her cheek and every one of those reasons scattered like papers in a wind.</p>

<p>"Marcus—"</p>

<p>"Tell me to stop," he said quietly, "and I will."</p>

<p>The city lights glittered fifty floors below. Sarah Whitmore, who had negotiated mergers and outmaneuvered boards of directors, did the one thing she'd never allowed herself before.</p>

<p>She closed the distance between them.</p>`;

async function main() {
  console.log("Seeding database…");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin1234!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@lustpages.com" },
    update: {},
    create: {
      email: "admin@lustpages.com",
      name: "Admin",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("✓ Admin user:", admin.email);

  // Categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "romance" },
      update: {},
      create: { name: "Romance", slug: "romance", description: "Passionate love stories and romantic encounters", color: "#c4426a" },
    }),
    prisma.category.upsert({
      where: { slug: "fantasy" },
      update: {},
      create: { name: "Fantasy", slug: "fantasy", description: "Magical and otherworldly adult tales", color: "#7c3aed" },
    }),
    prisma.category.upsert({
      where: { slug: "thriller" },
      update: {},
      create: { name: "Thriller", slug: "thriller", description: "Suspenseful stories with erotic undertones", color: "#1d4ed8" },
    }),
    prisma.category.upsert({
      where: { slug: "contemporary" },
      update: {},
      create: { name: "Contemporary", slug: "contemporary", description: "Modern-day adult fiction", color: "#0d9488" },
    }),
  ]);
  console.log("✓ Categories:", categories.map((c) => c.name).join(", "));

  // Authors
  const authors = await Promise.all([
    prisma.author.upsert({
      where: { slug: "vivienne-hart" },
      update: {},
      create: {
        name: "Vivienne Hart",
        slug: "vivienne-hart",
        bio: "Bestselling author of sensual romance fiction. Known for her richly drawn characters and slow-burn tension that ignites on every page.",
      },
    }),
    prisma.author.upsert({
      where: { slug: "marcus-stone" },
      update: {},
      create: {
        name: "Marcus Stone",
        slug: "marcus-stone",
        bio: "A master of dark fantasy and psychological tension. Marcus weaves desire and danger into unforgettable tales.",
      },
    }),
    prisma.author.upsert({
      where: { slug: "elara-quinn" },
      update: {},
      create: {
        name: "Elara Quinn",
        slug: "elara-quinn",
        bio: "Contemporary fiction writer with a sharp eye for modern desire. Elara's stories are witty, hot, and deeply human.",
      },
    }),
  ]);
  console.log("✓ Authors:", authors.map((a) => a.name).join(", "));

  const [romance, fantasy, thriller, contemporary] = categories;
  const [vivienne, marcus, elara] = authors;

  // Stories
  const storyData = [
    {
      title: "Midnight in the Executive Suite",
      slug: "midnight-executive-suite",
      excerpt: "Sarah Whitmore never planned to fall for her boss. But when Marcus Cole works late on a Friday night, professional distance becomes impossible to maintain.",
      content: STORY_CONTENT,
      categoryId: romance.id,
      authorId: vivienne.id,
      featured: true,
      tags: JSON.stringify(["office-romance", "boss", "forbidden", "slow-burn"]),
      readingTime: 8,
    },
    {
      title: "The Witch's Bargain",
      slug: "the-witchs-bargain",
      excerpt: "When Seraphina strikes a dangerous deal with the Lord of Shadows to save her village, she never imagined the price would be her heart—or her body.",
      content: STORY_CONTENT,
      categoryId: fantasy.id,
      authorId: marcus.id,
      featured: true,
      tags: JSON.stringify(["fantasy", "magic", "dark-romance", "bargain"]),
      readingTime: 12,
    },
    {
      title: "Beneath the Surface",
      slug: "beneath-the-surface",
      excerpt: "Marine biologist Dr. Lyra Voss discovers that the reclusive billionaire funding her research has secrets deeper than the ocean floor.",
      content: STORY_CONTENT,
      categoryId: contemporary.id,
      authorId: elara.id,
      featured: true,
      tags: JSON.stringify(["billionaire", "forbidden", "research", "contemporary"]),
      readingTime: 10,
    },
    {
      title: "The Last Train to Nowhere",
      slug: "last-train-to-nowhere",
      excerpt: "A storm. A delayed train. Two strangers who have every reason to hate each other—and one long night to change everything.",
      content: STORY_CONTENT,
      categoryId: thriller.id,
      authorId: vivienne.id,
      tags: JSON.stringify(["strangers", "thriller", "one-night", "tension"]),
      readingTime: 9,
    },
    {
      title: "The Dragon Lord's Claim",
      slug: "dragon-lords-claim",
      excerpt: "Captured by the fearsome Dragon Lord of the northern mountains, Princess Isadora must navigate desire, duty, and a bond she never asked for.",
      content: STORY_CONTENT,
      categoryId: fantasy.id,
      authorId: marcus.id,
      tags: JSON.stringify(["fantasy", "dragons", "royalty", "captive"]),
      readingTime: 15,
    },
    {
      title: "Coffee and Complications",
      slug: "coffee-and-complications",
      excerpt: "Barista Zoe makes the same latte for the mysterious suit every morning. When he finally speaks, two words turn her world upside down.",
      content: STORY_CONTENT,
      categoryId: contemporary.id,
      authorId: elara.id,
      tags: JSON.stringify(["contemporary", "cafe", "quick-read", "flirty"]),
      readingTime: 6,
    },
    {
      title: "The Arrangement",
      slug: "the-arrangement",
      excerpt: "A marriage of convenience between rival heirs was supposed to be strictly business. Neither Cassandra nor Adrian planned on actually falling.",
      content: STORY_CONTENT,
      categoryId: romance.id,
      authorId: vivienne.id,
      tags: JSON.stringify(["arranged-marriage", "enemies-to-lovers", "romance"]),
      readingTime: 11,
    },
    {
      title: "Shadow Protocol",
      slug: "shadow-protocol",
      excerpt: "Intelligence analyst Mira never expected her target to be devastatingly attractive—or that he'd figure out exactly who she was before she could complete her mission.",
      content: STORY_CONTENT,
      categoryId: thriller.id,
      authorId: marcus.id,
      tags: JSON.stringify(["spy", "thriller", "action", "forbidden"]),
      readingTime: 13,
    },
  ];

  let createdCount = 0;
  for (const story of storyData) {
    await prisma.story.upsert({
      where: { slug: story.slug },
      update: {},
      create: {
        ...story,
        published: true,
        views: Math.floor(Math.random() * 2000) + 100,
      },
    });
    createdCount++;
  }
  console.log(`✓ ${createdCount} stories seeded`);

  console.log("\n✅ Database seeded successfully!");
  console.log("   Admin: admin@lustpages.com / Admin1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
