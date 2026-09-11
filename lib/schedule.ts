import { addMinutesToHhmm, weekdayBogota } from "./time";
import type { Horario, Recorrido } from "./types";

export function expectedAtPunto(
  horario: Horario,
  recorrido: Recorrido,
  puntoId: string,
) {
  const ordered = [...recorrido.puntos].sort((a, b) => a.orden - b.orden);
  let acc = 0;
  for (const step of ordered) {
    acc += step.tiempoEsperadoMin;
    if (step.puntoId === puntoId) {
      return addMinutesToHhmm(horario.horaSalida, acc);
    }
  }
  return horario.horaLlegada;
}

export function horarioHoy(
  horarios: Horario[],
  conductorId: string,
  busetaId?: string,
) {
  const day = weekdayBogota();
  return horarios.find(
    (h) =>
      h.active &&
      h.conductorId === conductorId &&
      (!busetaId || h.busetaId === busetaId) &&
      (h.dias.length === 0 || h.dias.includes(day)),
  );
}
