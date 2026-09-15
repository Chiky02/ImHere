import { PLANNED_LAPS_PER_DAY } from "./schedule";
import { isTodayBogota } from "./time";
import type { Alerta, RecorridoPunto, RegistroCruce } from "./types";

export type RouteStepProgress = RecorridoPunto & {
  lap: number;
  stopIndex: number;
  arrived: boolean;
  pendingAlerta: boolean;
  done: boolean;
  alertaId?: string;
};

type RouteEvent = {
  puntoId: string;
  at: string;
  pending: boolean;
  alertaId?: string;
};

function todayAlerts(alertas: Alerta[], conductorId: string) {
  return alertas
    .filter(
      (a) =>
        a.conductorId === conductorId &&
        (a.status === "pending" || a.status === "arrived") &&
        isTodayBogota(a.createdAt),
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function todayEvents(
  alertas: Alerta[],
  conductorId: string,
  registros: Pick<
    RegistroCruce,
    "puntoId" | "conductorId" | "horaLlegadaReal" | "alertaId"
  >[],
): RouteEvent[] {
  const alerts = todayAlerts(alertas, conductorId);
  const usedAlertIds = new Set(alerts.map((a) => a.id));
  const events: RouteEvent[] = alerts.map((a) => ({
    puntoId: a.puntoId,
    at: a.createdAt,
    pending: a.status === "pending",
    alertaId: a.id,
  }));
  for (const r of registros) {
    if (r.conductorId !== conductorId || !isTodayBogota(r.horaLlegadaReal)) continue;
    if (r.alertaId && usedAlertIds.has(r.alertaId)) continue;
    events.push({
      puntoId: r.puntoId,
      at: r.horaLlegadaReal,
      pending: false,
    });
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}

/**
 * Supports several full loops of the same route in one day.
 * Each alert/arrival consumes the next matching stop; leftover stops stay open.
 */
export function annotateRouteProgress(
  steps: RecorridoPunto[],
  alertas: Alerta[],
  conductorId: string,
  registros: Pick<
    RegistroCruce,
    "puntoId" | "conductorId" | "horaLlegadaReal" | "alertaId"
  >[] = [],
  plannedLaps = PLANNED_LAPS_PER_DAY,
): RouteStepProgress[] {
  const ordered = [...steps].sort((a, b) => a.orden - b.orden);
  if (!ordered.length) return [];
  const events = todayEvents(alertas, conductorId, registros);
  const laps = Math.max(
    plannedLaps,
    Math.ceil(events.length / ordered.length) + 1,
  );
  const expanded: RouteStepProgress[] = [];
  for (let lap = 1; lap <= laps; lap++) {
    for (let i = 0; i < ordered.length; i++) {
      const step = ordered[i];
      expanded.push({
        ...step,
        lap,
        stopIndex: i,
        arrived: false,
        pendingAlerta: false,
        done: false,
      });
    }
  }
  let cursor = 0;
  for (const event of events) {
    while (cursor < expanded.length && expanded[cursor].puntoId !== event.puntoId) {
      cursor += 1;
    }
    if (cursor >= expanded.length) break;
    expanded[cursor] = {
      ...expanded[cursor],
      arrived: !event.pending,
      pendingAlerta: event.pending,
      done: !event.pending,
      alertaId: event.alertaId,
    };
    cursor += 1;
  }
  return expanded;
}

export function currentRouteStepIndex(steps: { done: boolean }[]): number {
  return steps.findIndex((s) => !s.done);
}
