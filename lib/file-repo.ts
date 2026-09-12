import { readDb, updateDb } from "./file-db";
import { ensureRoles } from "./role-seed";
import type {
  Alerta,
  AppRole,
  AppSettings,
  Buseta,
  Horario,
  Notificacion,
  Punto,
  PushSubscriptionRecord,
  Recorrido,
  RegistroCruce,
  User,
} from "./types";

export async function listUsers() {
  return (await readDb()).users.filter((u) => !u.deletedAt);
}

export async function getUserById(id: string) {
  const u = (await readDb()).users.find((u) => u.id === id);
  return u && !u.deletedAt ? u : undefined;
}

export async function getUserByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  const u = (await readDb()).users.find((u) => u.phone === normalized);
  return u && !u.deletedAt ? u : undefined;
}

export async function upsertUser(user: User) {
  return updateDb((db) => {
    const i = db.users.findIndex((u) => u.id === user.id);
    if (i >= 0) db.users[i] = user;
    else db.users.push(user);
    return user;
  });
}

export async function listPuntos() {
  return (await readDb()).puntos.filter((p) => !p.deletedAt);
}

export async function getPunto(id: string) {
  const p = (await readDb()).puntos.find((p) => p.id === id);
  return p && !p.deletedAt ? p : undefined;
}

export async function upsertPunto(punto: Punto) {
  return updateDb((db) => {
    const i = db.puntos.findIndex((p) => p.id === punto.id);
    if (i >= 0) db.puntos[i] = punto;
    else db.puntos.push(punto);
    return punto;
  });
}

export async function deletePunto(id: string) {
  return updateDb((db) => {
    const i = db.puntos.findIndex((p) => p.id === id);
    if (i >= 0) db.puntos[i] = { ...db.puntos[i], deletedAt: new Date().toISOString(), active: false };
  });
}

export async function listBusetas() {
  return (await readDb()).busetas.filter((b) => !b.deletedAt);
}

export async function getBuseta(id: string) {
  const b = (await readDb()).busetas.find((b) => b.id === id);
  return b && !b.deletedAt ? b : undefined;
}

export async function upsertBuseta(buseta: Buseta) {
  return updateDb((db) => {
    const i = db.busetas.findIndex((b) => b.id === buseta.id);
    if (i >= 0) db.busetas[i] = buseta;
    else db.busetas.push(buseta);
    return buseta;
  });
}

export async function deleteBuseta(id: string) {
  return updateDb((db) => {
    const i = db.busetas.findIndex((b) => b.id === id);
    if (i >= 0) {
      db.busetas[i] = {
        ...db.busetas[i],
        deletedAt: new Date().toISOString(),
        active: false,
      };
    }
    for (const u of db.users) {
      if (u.busetaId === id) u.busetaId = undefined;
    }
  });
}

export async function listRecorridos() {
  return (await readDb()).recorridos.filter((r) => !r.deletedAt);
}

export async function getRecorrido(id: string) {
  const r = (await readDb()).recorridos.find((r) => r.id === id);
  return r && !r.deletedAt ? r : undefined;
}

export async function upsertRecorrido(recorrido: Recorrido) {
  return updateDb((db) => {
    const i = db.recorridos.findIndex((r) => r.id === recorrido.id);
    if (i >= 0) db.recorridos[i] = recorrido;
    else db.recorridos.push(recorrido);
    return recorrido;
  });
}

export async function deleteRecorrido(id: string) {
  return updateDb((db) => {
    const i = db.recorridos.findIndex((r) => r.id === id);
    if (i >= 0) {
      db.recorridos[i] = {
        ...db.recorridos[i],
        deletedAt: new Date().toISOString(),
        active: false,
      };
    }
    const now = new Date().toISOString();
    db.horarios = db.horarios.map((h) =>
      h.recorridoId === id ? { ...h, deletedAt: now, active: false } : h,
    );
  });
}

export async function listHorarios() {
  return (await readDb()).horarios.filter((h) => !h.deletedAt);
}

export async function upsertHorario(horario: Horario) {
  return updateDb((db) => {
    const i = db.horarios.findIndex((h) => h.id === horario.id);
    if (i >= 0) db.horarios[i] = horario;
    else db.horarios.push(horario);
    return horario;
  });
}

export async function deleteHorario(id: string) {
  return updateDb((db) => {
    const i = db.horarios.findIndex((h) => h.id === id);
    if (i >= 0) {
      db.horarios[i] = {
        ...db.horarios[i],
        deletedAt: new Date().toISOString(),
        active: false,
      };
    }
  });
}

export async function listAlertas() {
  return (await readDb()).alertas;
}

export async function insertAlerta(alerta: Alerta) {
  return updateDb((db) => {
    db.alertas.unshift(alerta);
    return alerta;
  });
}

export async function updateAlerta(id: string, patch: Partial<Alerta>) {
  return updateDb((db) => {
    const i = db.alertas.findIndex((a) => a.id === id);
    if (i < 0) return undefined;
    db.alertas[i] = { ...db.alertas[i], ...patch };
    return db.alertas[i];
  });
}

export async function listRegistros() {
  return (await readDb()).registros;
}

export async function insertRegistro(registro: RegistroCruce) {
  return updateDb((db) => {
    db.registros.unshift(registro);
    return registro;
  });
}

export async function updateRegistro(id: string, patch: Partial<RegistroCruce>) {
  return updateDb((db) => {
    const i = db.registros.findIndex((r) => r.id === id);
    if (i < 0) return undefined;
    db.registros[i] = { ...db.registros[i], ...patch };
    return db.registros[i];
  });
}

export async function lastRegistroBefore(
  puntoId: string,
  excludeId: string,
  beforeIso: string,
) {
  const db = await readDb();
  return db.registros
    .filter(
      (r) =>
        r.puntoId === puntoId &&
        r.id !== excludeId &&
        r.horaLlegadaReal <= beforeIso,
    )
    .sort((a, b) => b.horaLlegadaReal.localeCompare(a.horaLlegadaReal))[0];
}

export async function listNotificaciones() {
  return (await readDb()).notificaciones;
}

export async function insertNotificacion(n: Notificacion) {
  return updateDb((db) => {
    db.notificaciones.unshift(n);
    return n;
  });
}

export async function markNotificacionRead(id: string, userId: string) {
  return updateDb((db) => {
    const n = db.notificaciones.find((x) => x.id === id && x.userId === userId);
    if (n) n.read = true;
    return n;
  });
}

export async function listPush() {
  return (await readDb()).pushSubscriptions;
}

export async function upsertPush(sub: PushSubscriptionRecord) {
  return updateDb((db) => {
    db.pushSubscriptions = db.pushSubscriptions.filter(
      (s) => s.endpoint !== sub.endpoint,
    );
    db.pushSubscriptions.push(sub);
    return sub;
  });
}

export async function deletePush(endpoint: string) {
  return updateDb((db) => {
    db.pushSubscriptions = db.pushSubscriptions.filter(
      (s) => s.endpoint !== endpoint,
    );
  });
}

export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

export async function getSettings() {
  const db = await readDb();
  return db.settings ?? { alertSoundUrl: "/sounds/alerta.wav" };
}

export async function saveSettings(patch: Partial<AppSettings>) {
  return updateDb((db) => {
    if (!db.settings) db.settings = { alertSoundUrl: "/sounds/alerta.wav" };
    db.settings = {
      ...db.settings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return db.settings;
  });
}

export async function getOperatorAlertSettings(userId: string) {
  const db = await readDb();
  return db.operatorAlertSettings?.[userId] ?? null;
}

export async function saveOperatorAlertSettings(
  userId: string,
  patch: Partial<AppSettings>,
) {
  return updateDb((db) => {
    if (!db.operatorAlertSettings) db.operatorAlertSettings = {};
    const current = db.operatorAlertSettings[userId] ?? {
      alertSoundUrl: "/sounds/alerta.wav",
    };
    const next = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    db.operatorAlertSettings[userId] = next;
    return next;
  });
}

export async function softDeleteUser(id: string) {
  return updateDb((db) => {
    const i = db.users.findIndex((u) => u.id === id);
    if (i >= 0) {
      const u = db.users[i];
      db.users[i] = {
        ...u,
        deletedAt: new Date().toISOString(),
        phone: `deleted_${id.slice(0, 8)}_${u.phone}`,
        busetaId: undefined,
        active: false,
      };
    }
  });
}

export async function listRoles() {
  const db = await readDb();
  ensureRoles(db);
  return db.roles.filter((r) => r.active || r.isSystem);
}

export async function getRole(id: string) {
  const db = await readDb();
  ensureRoles(db);
  return db.roles.find((r) => r.id === id);
}

export async function upsertRole(role: AppRole) {
  return updateDb((db) => {
    ensureRoles(db);
    const i = db.roles.findIndex((r) => r.id === role.id);
    if (i >= 0) db.roles[i] = role;
    else db.roles.push(role);
    return role;
  });
}

export async function softDeleteRole(id: string) {
  return updateDb((db) => {
    ensureRoles(db);
    const role = db.roles.find((r) => r.id === id);
    if (!role || role.isSystem) return;
    role.active = false;
  });
}


