import * as repo from "./repo";
import { horarioHoy, expectedAtPunto, resolveRouteStops, PLANNED_LAPS_PER_DAY } from "./schedule";
import { annotateRouteProgress, currentRouteStepIndex } from "./route-progress";
import {
  dateInBogota,
  formatDiffMinutes,
  formatTime,
  minutesDiff,
  punctuality,
  todayDate,
  isTodayBogota,
} from "./time";
import { DEFAULT_AVISO_COOLDOWN_SECONDS } from "./aviso-cooldown";
import type { SessionUser } from "./types";

function isToday(iso: string) {
  return isTodayBogota(iso);
}

export async function operatorSnapshot(user: SessionUser, puntoId?: string) {
  const [dbUser, puntos, users, busetas, alertas, registros, horarios, recorridos] =
    await Promise.all([
      repo.getUserById(user.id),
      repo.listPuntos(),
      repo.listUsers(),
      repo.listBusetasAny(),
      repo.listAlertas(),
      repo.listRegistros(),
      repo.listHorarios(),
      repo.listRecorridos(),
    ]);
  const assignedId = dbUser?.puntoId ?? user.puntoId;
  const activePuntos = puntos.filter((p) => p.active);
  let myPuntos = activePuntos;
  if (assignedId) {
    const assigned = activePuntos.find((p) => p.id === assignedId);
    myPuntos = assigned
      ? [assigned]
      : user.role === "admin"
        ? activePuntos
        : activePuntos.filter((p) => p.operatorIds.includes(user.id));
  } else if (user.role !== "admin") {
    myPuntos = activePuntos.filter((p) => p.operatorIds.includes(user.id));
  }
  // Prefer assigned punto; ignore query switcher when assigned
  const selected = assignedId
    ? myPuntos.find((p) => p.id === assignedId) ?? myPuntos[0]
    : myPuntos.find((p) => p.id === puntoId) ?? myPuntos[0];
  const lockedToPunto = Boolean(assignedId && selected?.id === assignedId);
  if (!selected) {
    return {
      myPuntos,
      selected: null,
      incoming: [],
      waitingSalida: [],
      bitacora: [],
      lockedToPunto,
      needsPuntoAssignment: !assignedId,
      drivers: users.filter((u) => u.role === "driver" && u.approved),
      busetasActivas: busetas.filter((b) => b.active && !b.deletedAt),
    };
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
      const salida =
        conductor?.salidaHoyFecha === todayDate()
          ? conductor.salidaHoy
          : undefined;
      const esperado =
        horario && recorrido
          ? expectedAtPunto(horario, recorrido, selected.id, salida)
          : undefined;
      return {
        ...a,
        conductorName: conductor?.name ?? "Conductor",
        conductorPhone: conductor?.phone ?? "",
        busetaCodigo: buseta
          ? `${buseta.codigo}${buseta.deletedAt ? " (archivada)" : ""}`
          : "—",
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
    const conductor = users.find((u) => u.id === r.conductorId);
    const salida =
      conductor?.salidaHoyFecha === todayDate()
        ? conductor.salidaHoy
        : undefined;
    const esperado =
      horario && recorrido
        ? expectedAtPunto(horario, recorrido, selected.id, salida)
        : undefined;
    return {
      ...r,
      conductorName: conductor?.name ?? "—",
      busetaCodigo: busetas.find((b) => b.id === r.busetaId)?.codigo ?? "—",
      llegadaHora: formatTime(r.horaLlegadaReal),
      salidaHora: r.horaSalidaReal ? formatTime(r.horaSalidaReal) : null,
      esperado,
      puntualidad: esperado
        ? punctuality(esperado, r.horaLlegadaReal)
        : null,
    };
  });
  return {
    myPuntos,
    selected,
    incoming,
    waitingSalida,
    bitacora,
    lockedToPunto,
    needsPuntoAssignment: !assignedId,
    drivers: users.filter((u) => u.role === "driver" && u.approved),
    busetasActivas: busetas.filter((b) => b.active && !b.deletedAt),
  };
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
    registros,
    settings,
  ] = await Promise.all([
    repo.getUserById(user.id),
    repo.listPuntos(),
    repo.listBusetas(),
    repo.listHorarios(),
    repo.listRecorridos(),
    repo.listAlertas(),
    repo.listNotificaciones(),
    repo.listRegistros(),
    repo.getSettings(),
  ]);
  // Prefer DB over JWT so approval/buseta changes apply without re-login
  // (iPhone often keeps a long-lived session cookie).
  const approved = dbUser?.approved ?? user.approved;
  const busetaId = dbUser?.busetaId ?? user.busetaId;
  const buseta = busetaId ? busetas.find((b) => b.id === busetaId) : undefined;
  const horario = horarioHoy(horarios, user.id, busetaId, recorridos);
  const recorrido = horario
    ? recorridos.find((r) => r.id === horario.recorridoId)
    : recorridos.find((r) => r.active);
  const salidaHoy =
    dbUser?.salidaHoyFecha === todayDate() ? dbUser.salidaHoy : undefined;
  const declaredStops = (recorrido?.puntos ?? []).length;
  const ordered = resolveRouteStops(recorrido, puntos);
  const routeForEta = recorrido ? { ...recorrido, puntos: ordered } : undefined;
  const progress = annotateRouteProgress(
    ordered,
    alertas,
    user.id,
    registros,
    PLANNED_LAPS_PER_DAY,
  );
  const steps = progress.map((step) => {
    const punto = puntos.find((p) => p.id === step.puntoId);
    return {
      puntoId: step.puntoId,
      orden: step.orden,
      lap: step.lap,
      stopIndex: step.stopIndex,
      tiempoEsperadoMin: step.tiempoEsperadoMin,
      puntoName: punto?.name ?? "Punto",
      puntoAddress: punto?.address ?? "",
      puntoNumero: punto?.numero,
      esperado:
        horario && routeForEta
          ? expectedAtPunto(horario, routeForEta, step.puntoId, salidaHoy)
          : undefined,
      pendingAlerta: step.pendingAlerta,
      arrived: step.arrived,
      done: step.done,
    };
  });
  const activeIndex = currentRouteStepIndex(steps);
  const stopsInRoute = ordered.length;
  const plannedLaps = PLANNED_LAPS_PER_DAY;
  const routePatched = ordered.length > declaredStops;
  const avisoCooldownSeconds =
    settings.avisoCooldownSeconds ?? DEFAULT_AVISO_COOLDOWN_SECONDS;
  const routeStops = ordered.map((step, i) => {
    const punto = puntos.find((p) => p.id === step.puntoId);
    const last = alertas
      .filter(
        (a) =>
          a.conductorId === user.id &&
          a.puntoId === step.puntoId &&
          a.status !== "cancelled" &&
          isTodayBogota(a.createdAt),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return {
      puntoId: step.puntoId,
      orden: i + 1,
      tiempoEsperadoMin: step.tiempoEsperadoMin,
      puntoName: punto?.name ?? "Punto",
      puntoAddress: punto?.address ?? "",
      puntoNumero: punto?.numero,
      esperado:
        horario && routeForEta
          ? expectedAtPunto(horario, routeForEta, step.puntoId, salidaHoy)
          : undefined,
      lastAlertAt: last?.createdAt,
      pendingAlerta: last?.status === "pending",
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
    activeIndex,
    stopsInRoute,
    plannedLaps,
    routePatched,
    routeStops,
    avisoCooldownSeconds,
    inbox,
    busetas,
    puntos,
    salidaHoy,
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
      repo.listBusetasAny(),
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

