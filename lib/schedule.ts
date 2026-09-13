import { addMinutesToHhmm, weekdayBogota } from "./time";
import type { Horario, Recorrido } from "./types";

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
) {
  const day = weekdayBogota();
  const activeToday = horarios.filter(
    (h) => h.active && (h.dias.length === 0 || h.dias.includes(day)),
  );
  return (
    activeToday.find((h) => h.conductorId === conductorId) ||
    activeToday.find((h) => busetaId && h.busetaId === busetaId) ||
    activeToday[0]
  );
}
