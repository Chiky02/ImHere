import webpush from "web-push";
import * as repo from "./repo";
import type { Notificacion } from "./types";

function configured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY,
  );
}

function setup() {
  if (!configured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@control-puntos.local",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  if (!setup()) return;
  const subs = (await repo.listPush()).filter((s) => s.userId === userId);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await repo.deletePush(sub.endpoint);
        }
      }
    }),
  );
}

export async function notifyDriver(n: Notificacion, url = "/conductor") {
  await repo.insertNotificacion(n);
  await sendPushToUser(n.userId, { title: n.title, body: n.body, url });
}
