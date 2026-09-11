"use client";

import { useState } from "react";
import { savePushSubscriptionAction } from "@/lib/actions";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export function PushToggle() {
  const [status, setStatus] = useState<"off" | "on" | "err">("off");
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!key) {
    return (
      <p className="text-xs text-muted">
        Las notificaciones push se activan al configurar VAPID.
      </p>
    );
  }

  async function enable() {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("err");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key!),
      });
      const json = sub.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        setStatus("err");
        return;
      }
      await savePushSubscriptionAction({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      });
      setStatus("on");
    } catch {
      setStatus("err");
    }
  }

  return (
    <button type="button" className="btn btn-ghost text-sm" onClick={enable}>
      {status === "on"
        ? "Avisos en el celular activos"
        : status === "err"
          ? "No se pudieron activar los avisos"
          : "Activar avisos en el celular"}
    </button>
  );
}
