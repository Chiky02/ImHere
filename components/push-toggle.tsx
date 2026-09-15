"use client";

import { useState } from "react";
import { enableWebPush } from "./enable-web-push";

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
      const ok = await enableWebPush();
      setStatus(ok ? "on" : "err");
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
