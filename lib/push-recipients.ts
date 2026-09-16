import type { Punto, User } from "./types";

/** Who should get a live "bus coming" push for a checkpoint. */
export function resolvePuntoAlertRecipients(opts: {
  puntoId: string;
  punto?: Pick<Punto, "operatorIds"> | null;
  users: Pick<User, "id" | "role" | "active" | "puntoId">[];
  exceptUserId?: string;
}): string[] {
  const ids = new Set<string>(opts.punto?.operatorIds ?? []);
  for (const u of opts.users) {
    if (u.active === false) continue;
    // Every active admin can open /operador and must hear alerts.
    if (u.role === "admin") {
      ids.add(u.id);
      continue;
    }
    if (u.role === "operator" && u.puntoId === opts.puntoId) {
      ids.add(u.id);
    }
  }
  if (opts.exceptUserId) ids.delete(opts.exceptUserId);
  return [...ids];
}

export function buildAlertaPushPayload(opts: {
  title: string;
  body: string;
  puntoId: string;
}) {
  return {
    type: "alerta" as const,
    title: opts.title,
    body: opts.body,
    url: "/operador",
    puntoId: opts.puntoId,
  };
}

export function buildCrucePushPayload(opts: {
  title: string;
  body: string;
  puntoId: string;
}) {
  return {
    type: "cruce" as const,
    title: opts.title,
    body: opts.body,
    url: "/conductor",
    puntoId: opts.puntoId,
  };
}

/** Paths that must never go through app auth redirects (PWA / static). */
export function isPublicStaticPath(pathname: string) {
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname === "/sw.js" || pathname === "/manifest.webmanifest") return true;
  if (pathname === "/favicon.ico" || pathname === "/icon.svg") return true;
  if (pathname.includes(".")) return true;
  return false;
}

/** Detect Vercel Deployment Protection SSO redirect target. */
export function isVercelSsoUrl(url: string) {
  try {
    const u = new URL(url);
    return (
      u.hostname === "vercel.com" &&
      (u.pathname.startsWith("/sso-api") || u.pathname.startsWith("/login"))
    );
  } catch {
    return false;
  }
}
