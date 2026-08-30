import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  let expiredSubs = 0;
  let expiredWelcome = 0;

  // 1. Expire subscription coins for periods that have ended
  const staleSubs = await prisma.subscription.findMany({
    where: {
      currentPeriodEnd: { lt: now },
      subscriptionCoins: { gt: 0 },
    },
    include: { user: { select: { id: true, coinBalance: true } } },
  });

  for (const sub of staleSubs) {
    const coinsToRemove = Math.min(sub.user.coinBalance, sub.subscriptionCoins);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: sub.userId },
        data: { coinBalance: { decrement: coinsToRemove } },
      }),
      prisma.subscription.update({
        where: { id: sub.id },
        data: {
          subscriptionCoins: 0,
          // Non-auto-renew subscriptions become expired; auto-renew stays active awaiting Atlos renewal postback
          status: sub.autoRenew ? "active" : "expired",
        },
      }),
      ...(coinsToRemove > 0
        ? [
            prisma.coinTransaction.create({
              data: {
                userId: sub.userId,
                amount: -coinsToRemove,
                type: "expired",
                description: `${sub.autoRenew ? "Renewal pending" : "Subscription ended"} — ${coinsToRemove} unused coins expired`,
              },
            }),
          ]
        : []),
    ]);
    expiredSubs++;
  }

  // 2. Expire welcome coins for users whose trial has ended and have no active subscription
  const staleWelcome = await prisma.user.findMany({
    where: {
      welcomeCoinsExpireAt: { lt: now },
      coinBalance: { gt: 0 },
      subscription: { is: null },
    },
    select: { id: true, coinBalance: true },
  });

  for (const user of staleWelcome) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { coinBalance: 0, welcomeCoinsExpireAt: null },
      }),
      prisma.coinTransaction.create({
        data: {
          userId: user.id,
          amount: -user.coinBalance,
          type: "expired",
          description: "Welcome coins expired — subscribe to keep earning coins",
        },
      }),
    ]);
    expiredWelcome++;
  }

  // 3. Batch-sync Story.views from StoryView counts (only for stories viewed in last 2 days).
  // This runs entirely on the DB server — minimal egress, replaces per-request Story.update.
  await prisma.$executeRaw`
    UPDATE "Story"
    SET views = (
      SELECT COUNT(*)::int FROM "StoryView" WHERE "StoryView"."storyId" = "Story"."id"
    )
    WHERE "Story"."id" IN (
      SELECT DISTINCT "storyId" FROM "StoryView"
      WHERE "viewedAt" >= NOW() - INTERVAL '2 days'
    )
  `;

  // 4. Publish any scheduled stories whose scheduledAt has passed.
  const published = await prisma.story.updateMany({
    where: { status: "approved", published: false, scheduledAt: { lte: new Date() } },
    data: { published: true, scheduledAt: null },
  });

  // 5. Expire featured promotions whose window has ended, then promote queued ones.
  const FEATURED_MAX = 10;
  const FEATURED_DURATION = 7 * 24 * 60 * 60 * 1000;
  const now2 = new Date();
  await prisma.featuredPromotion.updateMany({
    where: { status: "active", expiresAt: { lt: now2 } },
    data: { status: "expired" },
  });
  for (const type of ["story", "series"] as const) {
    const activeCount = await prisma.featuredPromotion.count({ where: { type, status: "active" } });
    if (activeCount < FEATURED_MAX) {
      const queued = await prisma.featuredPromotion.findMany({
        where: { type, status: "queued" },
        orderBy: { createdAt: "asc" },
        take: FEATURED_MAX - activeCount,
      });
      if (queued.length > 0) {
        await Promise.all(queued.map((p) =>
          prisma.featuredPromotion.update({
            where: { id: p.id },
            data: { status: "active", startedAt: now2, expiresAt: new Date(now2.getTime() + FEATURED_DURATION) },
          })
        ));
      }
    }
  }

  return NextResponse.json({ ok: true, expiredSubs, expiredWelcome, publishedStories: published.count });
}
