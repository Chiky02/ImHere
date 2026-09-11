import { readDb, updateDb } from "./file-db";
import type {
  Alerta,
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
  return (await readDb()).users;
}

export async function getUserById(id: string) {
  return (await readDb()).users.find((u) => u.id === id);
}

export async function getUserByPhone(phone: string) {
  const normalized = normalizePhone(phone);
  return (await readDb()).users.find((u) => u.phone === normalized);
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
  return (await readDb()).puntos;
}

export async function getPunto(id: string) {
  return (await readDb()).puntos.find((p) => p.id === id);
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
    db.puntos = db.puntos.filter((p) => p.id !== id);
    db.recorridos = db.recorridos.map((r) => ({
      ...r,
      puntos: r.puntos.filter((p) => p.puntoId !== id),
    }));
  });
}

export async function listBusetas() {
  return (await readDb()).busetas;
}

export async function getBuseta(id: string) {
  return (await readDb()).busetas.find((b) => b.id === id);
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
    db.busetas = db.busetas.filter((b) => b.id !== id);
  });
}

export async function listRecorridos() {
  return (await readDb()).recorridos;
}

export async function getRecorrido(id: string) {
  return (await readDb()).recorridos.find((r) => r.id === id);
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
    db.recorridos = db.recorridos.filter((r) => r.id !== id);
    db.horarios = db.horarios.filter((h) => h.recorridoId !== id);
  });
}

export async function listHorarios() {
  return (await readDb()).horarios;
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
    db.horarios = db.horarios.filter((h) => h.id !== id);
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
