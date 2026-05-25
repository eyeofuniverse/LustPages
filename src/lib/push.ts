import webpush from "web-push";
import { prisma } from "./prisma";

webpush.setVapidDetails(
  "mailto:hello@mail.lustpages.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string; tag?: string },
) {
  if (userIds.length === 0) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  const stale: string[] = [];

  await Promise.allSettled(
    subs.map((sub) =>
      webpush
        .sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        )
        .catch((err: { statusCode?: number }) => {
          if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.id);
        }),
    ),
  );

  if (stale.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }
}
