import { describe, expect, it } from "vitest";
import {
  clampAvisoCooldownSeconds,
  cooldownRemainingMs,
  DEFAULT_AVISO_COOLDOWN_SECONDS,
  formatCooldown,
} from "../aviso-cooldown";
import {
  buildAlertaPushPayload,
  buildCrucePushPayload,
  isPublicStaticPath,
  isVercelSsoUrl,
  resolvePuntoAlertRecipients,
} from "../push-recipients";
import { annotateRouteProgress, currentRouteStepIndex } from "../route-progress";
import { nowIso } from "../time";

describe("resolvePuntoAlertRecipients", () => {
  const punto = { operatorIds: ["op-linked"] };
  const users = [
    { id: "admin-1", role: "admin" as const, active: true },
    { id: "admin-off", role: "admin" as const, active: false },
    {
      id: "op-assigned",
      role: "operator" as const,
      active: true,
      puntoId: "punto-a",
    },
    {
      id: "op-other",
      role: "operator" as const,
      active: true,
      puntoId: "punto-b",
    },
    { id: "op-linked", role: "operator" as const, active: true },
    { id: "drv", role: "driver" as const, active: true, puntoId: "punto-a" },
  ];

  it("notifies linked operators, assigned operators, and all active admins", () => {
    const ids = resolvePuntoAlertRecipients({
      puntoId: "punto-a",
      punto,
      users,
    });
    expect(ids.sort()).toEqual(
      ["admin-1", "op-assigned", "op-linked"].sort(),
    );
  });

  it("excludes the driver who just alerted", () => {
    const ids = resolvePuntoAlertRecipients({
      puntoId: "punto-a",
      punto,
      users,
      exceptUserId: "admin-1",
    });
    expect(ids).not.toContain("admin-1");
    expect(ids).toContain("op-linked");
  });

  it("does not notify operators of another checkpoint", () => {
    const ids = resolvePuntoAlertRecipients({
      puntoId: "punto-a",
      punto: { operatorIds: [] },
      users,
    });
    expect(ids).not.toContain("op-other");
    expect(ids).toContain("op-assigned");
  });
});

describe("push payloads", () => {
  it("builds alerta payload for the operator panel", () => {
    expect(
      buildAlertaPushPayload({
        title: "¡Bus en camino!",
        body: "Buseta 12",
        puntoId: "p1",
      }),
    ).toEqual({
      type: "alerta",
      title: "¡Bus en camino!",
      body: "Buseta 12",
      url: "/operador",
      puntoId: "p1",
    });
  });

  it("builds cruce payload for the driver home", () => {
    expect(
      buildCrucePushPayload({
        title: "Cruce registrado",
        body: "ok",
        puntoId: "p1",
      }),
    ).toMatchObject({ type: "cruce", url: "/conductor" });
  });
});

describe("public static paths (PWA)", () => {
  it("bypasses auth for manifest, sw and icons", () => {
    expect(isPublicStaticPath("/manifest.webmanifest")).toBe(true);
    expect(isPublicStaticPath("/sw.js")).toBe(true);
    expect(isPublicStaticPath("/icon.svg")).toBe(true);
    expect(isPublicStaticPath("/favicon.ico")).toBe(true);
    expect(isPublicStaticPath("/sounds/alerta.wav")).toBe(true);
  });

  it("does not treat app pages as static", () => {
    expect(isPublicStaticPath("/operador")).toBe(false);
    expect(isPublicStaticPath("/conductor")).toBe(false);
    expect(isPublicStaticPath("/admin")).toBe(false);
  });
});

describe("Vercel SSO detection (Deployment Protection)", () => {
  it("flags vercel.com/sso-api redirects that break the manifest CORS", () => {
    const bad =
      "https://vercel.com/sso-api?url=https%3A%2F%2Fimhere-eight.vercel.app%2Fmanifest.webmanifest&nonce=abc";
    expect(isVercelSsoUrl(bad)).toBe(true);
  });

  it("allows the real app origin", () => {
    expect(isVercelSsoUrl("https://imhere-eight.vercel.app/manifest.webmanifest")).toBe(
      false,
    );
  });
});

describe("aviso cooldown", () => {
  it("defaults invalid values", () => {
    expect(clampAvisoCooldownSeconds("x")).toBe(DEFAULT_AVISO_COOLDOWN_SECONDS);
  });

  it("blocks re-alert within the window", () => {
    const now = Date.parse("2026-09-15T15:00:00.000Z");
    const last = "2026-09-15T14:58:00.000Z";
    expect(cooldownRemainingMs(last, 180, now)).toBe(60_000);
    expect(formatCooldown(60_000)).toBe("1:00");
  });

  it("allows alert when cooldown elapsed", () => {
    const now = Date.parse("2026-09-15T15:00:00.000Z");
    const last = "2026-09-15T14:56:00.000Z";
    expect(cooldownRemainingMs(last, 180, now)).toBe(0);
  });
});

describe("route progress (multi-lap)", () => {
  const steps = [
    { puntoId: "a", orden: 1, tiempoEsperadoMin: 10 },
    { puntoId: "b", orden: 2, tiempoEsperadoMin: 10 },
    { puntoId: "c", orden: 3, tiempoEsperadoMin: 10 },
  ];

  it("keeps later stops open after the first alert", () => {
    const alertas = [
      {
        id: "1",
        puntoId: "a",
        conductorId: "drv",
        busetaId: "b1",
        createdAt: nowIso(),
        status: "pending" as const,
      },
    ];
    const progress = annotateRouteProgress(steps, alertas, "drv", [], 2);
    const idx = currentRouteStepIndex(progress);
    expect(idx).toBe(0);
    expect(progress[0].pendingAlerta).toBe(true);
    expect(progress.filter((s) => s.lap === 1).length).toBe(3);
  });
});
