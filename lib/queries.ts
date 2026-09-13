import * as repo from "./repo";
import { horarioHoy, expectedAtPunto } from "./schedule";
import {
  dateInBogota,
  formatDiffMinutes,
  formatTime,
  minutesDiff,
  punctuality,
  todayDate,
} from "./time";
import type { SessionUser } from "./types";

function isToday(iso: string) {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return d === todayDate();
}

export async function operatorSnapshot(user: SessionUser, puntoId?: string) {
  const [puntos, users, busetas, alertas, registros, horarios, recorridos] =
    await Promise.all([
      repo.listPuntos(),
      repo.listUsers(),
      repo.listBusetas(),
      repo.listAlertas(),
      repo.listRegistros(),
      repo.listHorarios(),
      repo.listRecorridos(),
    ]);
  const myPuntos =
    user.role === "admin"
      ? puntos.filter((p) => p.active)
      : puntos.filter((p) => p.active && p.operatorIds.includes(user.id));
  const selected = myPuntos.find((p) => p.id === puntoId) ?? myPuntos[0];
  if (!selected) {
    return { myPuntos, selected: null, incoming: [], waitingSalida: [], bitacora: [] };
  }
  const incoming = alertas
    .filter((a) => a.puntoId === selected.id && a.status === "pending")
    .map((a) => {
      const conductor = users.find((u) => u.id === a.conductorId);
      const buseta = busetas.find((b) => b.id === a.busetaId);
      const horario = horarios.find((h) => h.id === a.horarioId);
      const recorrido = horario
        ? recorridos.find((r) => r.id === horario.recorridoId)
        : undefined;
      const esperado =
        horario && recorrido
          ? expectedAtPunto(horario, recorrido, selected.id)
          : undefined;
      return {
        ...a,
        conductorName: conductor?.name ?? "Conductor",
        conductorPhone: conductor?.phone ?? "",
        busetaCodigo: buseta?.codigo ?? "—",
        esperado,
      };
    });
  const todays = registros.filter(
    (r) => r.puntoId === selected.id && isToday(r.horaLlegadaReal),
  );
  const waitingSalida = todays
    .filter((r) => !r.horaSalidaReal)
    .map((r) => ({
      ...r,
      conductorName: users.find((u) => u.id === r.conductorId)?.name ?? "—",
      busetaCodigo: busetas.find((b) => b.id === r.busetaId)?.codigo ?? "—",
      llegadaHora: formatTime(r.horaLlegadaReal),
    }));
  const bitacora = todays.map((r) => {
    const horario = horarios.find((h) => h.id === r.horarioId);
    const recorrido = horario
      ? recorridos.find((x) => x.id === horario.recorridoId)
      : undefined;
    const esperado =
      horario && recorrido
        ? expectedAtPunto(horario, recorrido, selected.id)
        : undefined;
    return {
      ...r,
      conductorName: users.find((u) => u.id === r.conductorId)?.name ?? "—",
      busetaCodigo: busetas.find((b) => b.id === r.busetaId)?.codigo ?? "—",
      llegadaHora: formatTime(r.horaLlegadaReal),
      salidaHora: r.horaSalidaReal ? formatTime(r.horaSalidaReal) : null,
      esperado,
      puntualidad: esperado
        ? punctuality(esperado, r.horaLlegadaReal)
        : null,
    };
  });
  return { myPuntos, selected, incoming, waitingSalida, bitacora };
}

export async function driverSnapshot(user: SessionUser) {
  const [
    dbUser,
    puntos,
    busetas,
    horarios,
    recorridos,
    alertas,
    notificaciones,
  ] = await Promise.all([
    repo.getUserById(user.id),
    repo.listPuntos(),
    repo.listBusetas(),
    repo.listHorarios(),
    repo.listRecorridos(),
    repo.listAlertas(),
    repo.listNotificaciones(),
  ]);
  // Prefer DB over JWT so approval/buseta changes apply without re-login
  // (iPhone often keeps a long-lived session cookie).
  const approved = dbUser?.approved ?? user.approved;
  const busetaId = dbUser?.busetaId ?? user.busetaId;
  const buseta = busetaId ? busetas.find((b) => b.id === busetaId) : undefined;
  const horario = horarioHoy(horarios, user.id, busetaId);
  const recorrido = horario
    ? recorridos.find((r) => r.id === horario.recorridoId)
    : recorridos.find((r) => r.active);
  const steps = (recorrido?.puntos ?? [])
    .slice()
    .sort((a, b) => a.orden - b.orden)
    .map((step) => {
      const punto = puntos.find((p) => p.id === step.puntoId);
      const pending = alertas.find(
        (a) =>
          a.conductorId === user.id &&
          a.puntoId === step.puntoId &&
          a.status === "pending",
      );
      return {
        ...step,
        puntoName: punto?.name ?? "Punto",
        puntoAddress: punto?.address ?? "",
        esperado:
          horario && recorrido
            ? expectedAtPunto(horario, recorrido, step.puntoId)
            : undefined,
        pendingAlerta: Boolean(pending),
      };
    });
  const inbox = notificaciones.filter((n) => n.userId === user.id);
  return {
    dbUser,
    approved,
    busetaId,
    buseta,
    horario,
    recorrido,
    steps,
    inbox,
    busetas,
    puntos,
  };
}

export async function adminDashboard() {
  const [users, puntos, registros, alertas, busetas] = await Promise.all([
    repo.listUsers(),
    repo.listPuntos(),
    repo.listRegistros(),
    repo.listAlertas(),
    repo.listBusetas(),
  ]);
  const todayRegs = registros.filter((r) => isToday(r.horaLlegadaReal));
  return {
    conductores: users.filter((u) => u.role === "driver").length,
    pendientes: users.filter((u) => u.role === "driver" && !u.approved).length,
    puntos: puntos.length,
    crucesHoy: todayRegs.length,
    alertasPendientes: alertas.filter((a) => a.status === "pending").length,
    busetas: busetas.length,
    recientes: todayRegs.slice(0, 8).map((r) => ({
      ...r,
      conductorName: users.find((u) => u.id === r.conductorId)?.name ?? "—",
      busetaCodigo: busetas.find((b) => b.id === r.busetaId)?.codigo ?? "—",
      puntoName: puntos.find((p) => p.id === r.puntoId)?.name ?? "—",
      llegadaHora: formatTime(r.horaLlegadaReal),
    })),
  };
}

export async function historialData(opts: {
  puntoId?: string;
  day?: string;
  page?: number;
  pageSize?: number;
}) {
  const pageSize = Math.min(Math.max(opts.pageSize ?? 15, 5), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const day = opts.day || todayDate();

  const [registros, users, busetas, puntos, horarios, recorridos] =
    await Promise.all([
      repo.listRegistros(),
      repo.listUsers(),
      repo.listBusetas(),
      repo.listPuntos(),
      repo.listHorarios(),
      repo.listRecorridos(),
    ]);

  const filtered = registros.filter((r) => {
    if (opts.puntoId && r.puntoId !== opts.puntoId) return false;
    return dateInBogota(r.horaLlegadaReal) === day;
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;

  const rows = filtered.slice(start, start + pageSize).map((r) => {
    const horario = horarios.find((h) => h.id === r.horarioId);
    const recorrido = horario
      ? recorridos.find((x) => x.id === horario.recorridoId)
      : undefined;
    const esperado =
      horario && recorrido
        ? expectedAtPunto(horario, recorrido, r.puntoId)
        : undefined;
    const diff =
      esperado != null ? minutesDiff(esperado, r.horaLlegadaReal) : null;
    return {
      ...r,
      conductorName: users.find((u) => u.id === r.conductorId)?.name ?? "—",
      busetaCodigo: busetas.find((b) => b.id === r.busetaId)?.codigo ?? "—",
      puntoName: puntos.find((p) => p.id === r.puntoId)?.name ?? "—",
      horaSalidaProg: horario?.horaSalida ?? "—",
      llegadaHora: formatTime(r.horaLlegadaReal),
      salidaHora: r.horaSalidaReal ? formatTime(r.horaSalidaReal) : "—",
      esperado: esperado ?? "—",
      diffMinutes: diff,
      diffLabel: diff != null ? formatDiffMinutes(diff) : "—",
      puntualidad: esperado
        ? punctuality(esperado, r.horaLlegadaReal)
        : null,
    };
  });

  return {
    puntos,
    day,
    page: safePage,
    pageSize,
    total,
    totalPages,
    rows,
  };
}

