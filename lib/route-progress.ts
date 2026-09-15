import { isTodayBogota } from "./time";
import type { Alerta, RecorridoPunto } from "./types";

/** One alert can only complete one step (supports duplicate puntos in a route). */
export function annotateRouteProgress(
  steps: RecorridoPunto[],
  alertas: Alerta[],
  conductorId: string,
) {
  const used = new Set<string>();
  return steps.map((step) => {
    const alert = alertas.find(
      (a) =>
        a.conductorId === conductorId &&
        a.puntoId === step.puntoId &&
        (a.status === "pending" || a.status === "arrived") &&
        isTodayBogota(a.createdAt) &&
        !used.has(a.id),
    );
    if (alert) used.add(alert.id);
    return {
      ...step,
      done: Boolean(alert),
      pendingAlerta: alert?.status === "pending",
      alertaId: alert?.id,
    };
  });
}

export function currentRouteStepIndex(
  steps: { done: boolean }[],
): number {
  return steps.findIndex((s) => !s.done);
}
