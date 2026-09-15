import { isTodayBogota } from "./time";
import type { Alerta, RecorridoPunto } from "./types";

export type RouteStepProgress = RecorridoPunto & {
  /** Operator already registered arrival at this stop */
  arrived: boolean;
  /** Driver sent proximity alert; waiting for operator */
  pendingAlerta: boolean;
  /** Stop is fully done (arrival registered) — unlocks the next stop */
  done: boolean;
  alertaId?: string;
};

/**
 * One alert per step. Next stop unlocks only when current is `arrived`
 * (operator marked llegada). A `pending` alert keeps the driver on this stop.
 */
export function annotateRouteProgress(
  steps: RecorridoPunto[],
  alertas: Alerta[],
  conductorId: string,
): RouteStepProgress[] {
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
    const arrived = alert?.status === "arrived";
    const pendingAlerta = alert?.status === "pending";
    return {
      ...step,
      arrived,
      pendingAlerta,
      done: arrived,
      alertaId: alert?.id,
    };
  });
}

/** First stop that still needs operator arrival confirmation. */
export function currentRouteStepIndex(
  steps: { done: boolean }[],
): number {
  return steps.findIndex((s) => !s.done);
}
