import { pushToUsers } from "./onesignal";

// Thin wrapper kept for call-site compatibility with the approve/reject routes.
// Delegates entirely to OneSignal; userIds must match OneSignal external_id values
// (set on the client via OneSignal.login(userId)).
export async function sendPushToUsers(
  userIds: string[],
  payload: { title: string; body: string; url: string; tag?: string },
) {
  if (userIds.length === 0) return;
  await pushToUsers(userIds, payload);
}
