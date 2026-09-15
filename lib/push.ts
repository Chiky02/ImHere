import webpush from "web-push";
import * as repo from "./repo";
import type { Notificacion } from "./types";

export type PushPayload = {
  type?: "alerta" | "cruce" | "inbox";
  title: string;
  body: string;
  url?: string;
  puntoId?: string;
};

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

export async function sendPushToUser(userId: string, payload: PushPayload) {
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
          JSON.stringify({
            type: payload.type ?? "inbox",
            title: payload.title,
            body: payload.body,
            url: payload.url,
            puntoId: payload.puntoId,
          }),
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
  await sendPushToUser(n.userId, {
    type: "inbox",
    title: n.title,
    body: n.body,
    url,
    puntoId: n.puntoId,
  });
}

export async function notifyPuntoOperators(opts: {
  puntoId: string;
  title: string;
  body: string;
  exceptUserId?: string;
}) {
  const [punto, users] = await Promise.all([
    repo.getPunto(opts.puntoId),
    repo.listUsers(),
  ]);
  const ids = new Set<string>(punto?.operatorIds ?? []);
  for (const u of users) {
    if (u.active === false) continue;
    if (
      u.puntoId === opts.puntoId &&
      (u.role === "operator" || u.role === "admin")
    ) {
      ids.add(u.id);
    }
  }
  if (opts.exceptUserId) ids.delete(opts.exceptUserId);
  await Promise.all(
    [...ids].map((id) =>
      sendPushToUser(id, {
        type: "alerta",
        title: opts.title,
        body: opts.body,
        url: "/operador",
        puntoId: opts.puntoId,
      }),
    ),
  );
}

export async function notifyDriverCruce(opts: {
  conductorId: string;
  puntoId: string;
  title: string;
  body: string;
}) {
  await sendPushToUser(opts.conductorId, {
    type: "cruce",
    title: opts.title,
    body: opts.body,
    url: "/conductor",
    puntoId: opts.puntoId,
  });
}
