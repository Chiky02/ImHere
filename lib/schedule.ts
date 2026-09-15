import { addMinutesToHhmm, weekdayBogota } from "./time";
import type { Horario, Punto, Recorrido, RecorridoPunto } from "./types";

/** Un conductor recorre la ruta completa dos veces en el día. */
export const PLANNED_LAPS_PER_DAY = 2;

export function expectedAtPunto(
  horario: Horario,
  recorrido: Recorrido,
  puntoId: string,
  salidaOverride?: string,
) {
  const base =
    (salidaOverride && salidaOverride !== "00:00" ? salidaOverride : null) ||
    (horario.horaSalida && horario.horaSalida !== "00:00" ? horario.horaSalida : null);
  if (!base) return undefined;
  const ordered = [...recorrido.puntos].sort((a, b) => a.orden - b.orden);
  let acc = 0;
  for (const step of ordered) {
    acc += step.tiempoEsperadoMin;
    if (step.puntoId === puntoId) {
      return addMinutesToHhmm(base, acc);
    }
  }
  if (horario.horaLlegada && horario.horaLlegada !== "00:00") {
    return horario.horaLlegada;
  }
  return addMinutesToHhmm(base, acc);
}

export function horarioHoy(
  horarios: Horario[],
  conductorId: string,
  busetaId?: string,
  recorridos: Recorrido[] = [],
) {
  const day = weekdayBogota();
  const activeToday = horarios.filter(
    (h) => h.active && (h.dias.length === 0 || h.dias.includes(day)),
  );
  const stopCount = (h: Horario) =>
    recorridos.find((r) => r.id === h.recorridoId)?.puntos.length ?? 0;
  const longest = (list: Horario[]) =>
    [...list].sort((a, b) => stopCount(b) - stopCount(a) || a.id.localeCompare(b.id))[0];

  return (
    activeToday.find((h) => h.conductorId === conductorId) ||
    activeToday.find((h) => Boolean(busetaId) && h.busetaId === busetaId) ||
    longest(activeToday.filter((h) => !h.conductorId && !h.busetaId)) ||
    longest(activeToday.filter((h) => !h.conductorId))
  );
}

/**
 * If the saved route is missing numbered checkpoints (e.g. only stop 1 of 3),
 * use the numbered active puntos so one arrival is not treated as a full day.
 */
export function resolveRouteStops(
  recorrido: Recorrido | undefined,
  puntos: Punto[],
): RecorridoPunto[] {
  const fromRoute = [...(recorrido?.puntos ?? [])].sort((a, b) => a.orden - b.orden);
  const numbered = puntos
    .filter((p) => p.active && p.numero != null)
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));
  if (numbered.length > fromRoute.length) {
    return numbered.map((p, i) => ({
      puntoId: p.id,
      orden: i + 1,
      tiempoEsperadoMin:
        fromRoute[i]?.tiempoEsperadoMin ?? fromRoute[0]?.tiempoEsperadoMin ?? 0,
    }));
  }
  return fromRoute;
}
