"use server";

import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import * as repo from "./repo";
import { clearSessionCookie, homeForRole, readSession, setSessionCookie } from "./session";
import { nowIso } from "./time";
import { notifyDriver } from "./push";
import type {
  Buseta,
  Horario,
  Punto,
  Recorrido,
  RecorridoPunto,
  Role,
  SessionUser,
  User,
} from "./types";

function toSession(user: User): SessionUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    busetaId: user.busetaId,
    approved: user.approved,
  };
}

export async function loginAction(formData: FormData) {
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const user = await repo.getUserByPhone(phone);
  if (!user || !(await compare(password, user.passwordHash))) {
    return { error: "Celular o contraseña incorrectos." };
  }
  await setSessionCookie(toSession(user));
  redirect(homeForRole(user.role));
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!name || phone.length < 10 || password.length < 6) {
    return { error: "Completa nombre, celular (10 dígitos) y una clave de 6+ caracteres." };
  }
  if (await repo.getUserByPhone(phone)) {
    return { error: "Ese celular ya está registrado." };
  }
  const user: User = {
    id: crypto.randomUUID(),
    name,
    phone,
    passwordHash: await hash(password, 10),
    role: "driver",
    approved: false,
    createdAt: nowIso(),
  };
  await repo.upsertUser(user);
  await setSessionCookie(toSession(user));
  redirect("/conductor");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

async function admin() {
  const user = await readSession();
  if (!user || user.role !== "admin") throw new Error("No autorizado");
  return user;
}

async function operator() {
  const user = await readSession();
  if (!user || (user.role !== "operator" && user.role !== "admin")) {
    throw new Error("No autorizado");
  }
  return user;
}

async function driver() {
  const user = await readSession();
  if (!user || user.role !== "driver") throw new Error("No autorizado");
  return user;
}

export async function savePuntoAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "") || crypto.randomUUID();
  const operatorIds = formData.getAll("operatorIds").map(String).filter(Boolean);
  const punto: Punto = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    operatorIds,
    active: formData.get("active") !== "off",
  };
  if (!punto.name) return;
  await repo.upsertPunto(punto);
  revalidatePath("/admin/puntos");
}

export async function deletePuntoAction(formData: FormData) {
  await admin();
  await repo.deletePunto(String(formData.get("id")));
  revalidatePath("/admin/puntos");
}

export async function saveBusetaAction(formData: FormData) {
  await admin();
  const existingId = String(formData.get("id") ?? "");
  const existing = existingId ? await repo.getBuseta(existingId) : undefined;
  const buseta: Buseta = {
    id: existingId || crypto.randomUUID(),
    codigo: String(formData.get("codigo") ?? "").trim(),
    placa: existing?.placa ?? "",
    active: formData.get("active") === "off" ? false : true,
  };
  if (!buseta.codigo) return;
  await repo.upsertBuseta(buseta);
  revalidatePath("/admin/busetas");
}

export async function deleteBusetaAction(formData: FormData) {
  await admin();
  await repo.deleteBuseta(String(formData.get("id")));
  revalidatePath("/admin/busetas");
}

export async function saveRecorridoAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "") || crypto.randomUUID();
  const puntoIds = formData.getAll("puntoId").map(String);
  const tiempos = formData.getAll("tiempoEsperadoMin").map(String);
  const puntos: RecorridoPunto[] = puntoIds
    .map((puntoId, i) => ({
      puntoId,
      orden: i + 1,
      tiempoEsperadoMin: Number(tiempos[i] || 0) || 0,
    }))
    .filter((p) => p.puntoId);
  const recorrido: Recorrido = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    active: formData.get("active") !== "off",
    puntos,
  };
  if (!recorrido.name) return;
  await repo.upsertRecorrido(recorrido);
  revalidatePath("/admin/recorridos");
}

export async function deleteRecorridoAction(formData: FormData) {
  await admin();
  await repo.deleteRecorrido(String(formData.get("id")));
  revalidatePath("/admin/recorridos");
}

export async function saveHorarioAction(formData: FormData) {
  await admin();
  const dias = formData.getAll("dias").map((d) => Number(d));
  const horario: Horario = {
    id: String(formData.get("id") ?? "") || crypto.randomUUID(),
    recorridoId: String(formData.get("recorridoId") ?? ""),
    busetaId: String(formData.get("busetaId") ?? ""),
    conductorId: String(formData.get("conductorId") ?? ""),
    horaSalida: String(formData.get("horaSalida") ?? ""),
    horaLlegada: String(formData.get("horaLlegada") ?? ""),
    tiempoViajeMin: Number(formData.get("tiempoViajeMin") || 0),
    dias: dias.length ? dias : [1, 2, 3, 4, 5, 6],
    active: formData.get("active") !== "off",
  };
  if (!horario.recorridoId || !horario.busetaId || !horario.conductorId) {
    return;
  }
  await repo.upsertHorario(horario);
  revalidatePath("/admin/horarios");
}

export async function deleteHorarioAction(formData: FormData) {
  await admin();
  await repo.deleteHorario(String(formData.get("id")));
  revalidatePath("/admin/horarios");
}

export async function saveUserAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "") || crypto.randomUUID();
  const existing = await repo.getUserById(id);
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "driver") as Role;
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const user: User = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    phone,
    passwordHash: password
      ? await hash(password, 10)
      : existing?.passwordHash || (await hash("demo1234", 10)),
    role,
    busetaId: String(formData.get("busetaId") ?? "") || undefined,
    approved: formData.get("approved") !== "off",
    createdAt: existing?.createdAt ?? nowIso(),
  };
  if (!user.name || phone.length < 10) {
    return;
  }
  await repo.upsertUser(user);
  revalidatePath("/admin/conductores");
}

export async function approveDriverAction(formData: FormData) {
  await admin();
  const user = await repo.getUserById(String(formData.get("id")));
  if (!user) return;
  user.approved = true;
  const busetaId = String(formData.get("busetaId") ?? "");
  if (busetaId) user.busetaId = busetaId;
  await repo.upsertUser(user);
  revalidatePath("/admin/conductores");
}

export async function assignBusetaAction(formData: FormData) {
  await admin();
  const user = await repo.getUserById(String(formData.get("id")));
  if (!user || user.role !== "driver") return;
  const busetaId = String(formData.get("busetaId") ?? "");
  user.busetaId = busetaId || undefined;
  await repo.upsertUser(user);
  revalidatePath("/admin/conductores");
  revalidatePath("/conductor");
  revalidatePath("/conductor/perfil");
}

export async function updateProfileAction(formData: FormData) {
  const session = await readSession();
  if (!session) throw new Error("No autorizado");
  const user = await repo.getUserById(session.id);
  if (!user) return;
  user.name = String(formData.get("name") ?? "").trim() || user.name;
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  if (phone.length >= 10) {
    const other = await repo.getUserByPhone(phone);
    if (!other || other.id === user.id) user.phone = phone;
  }
  await repo.upsertUser(user);
  await setSessionCookie(toSession(user));
  revalidatePath("/cuenta");
}

export async function changePasswordAction(formData: FormData) {
  const session = await readSession();
  if (!session) throw new Error("No autorizado");
  const user = await repo.getUserById(session.id);
  if (!user) return { error: "Usuario no encontrado." };
  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("password") ?? "");
  const confirm = String(formData.get("passwordConfirm") ?? "");
  if (!(await compare(current, user.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }
  if (next.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres." };
  }
  if (next !== confirm) {
    return { error: "La confirmación no coincide." };
  }
  user.passwordHash = await hash(next, 10);
  await repo.upsertUser(user);
  await setSessionCookie(toSession(user));
  revalidatePath("/cuenta");
  revalidatePath("/conductor/perfil");
  return { ok: true };
}

export async function avisoProximidadAction(formData: FormData) {
  const session = await driver();
  if (!session.approved) return { error: "Tu perfil aún no está aprobado por el admin." };
  const user = await repo.getUserById(session.id);
  if (!user?.busetaId) return { error: "El admin aún no te asignó una buseta." };
  const puntoId = String(formData.get("puntoId") ?? "");
  if (!puntoId) return { error: "Elige el punto al que te acercas." };
  const pending = (await repo.listAlertas()).find(
    (a) =>
      a.conductorId === user.id &&
      a.puntoId === puntoId &&
      a.status === "pending",
  );
  if (pending) return { error: "Ya avisaste que vas hacia ese punto." };
  const horarios = await repo.listHorarios();
  const horario = horarios.find(
    (h) => h.conductorId === user.id && h.busetaId === user.busetaId && h.active,
  );
  await repo.insertAlerta({
    id: crypto.randomUUID(),
    puntoId,
    conductorId: user.id,
    busetaId: user.busetaId,
    horarioId: horario?.id,
    createdAt: nowIso(),
    status: "pending",
  });
  revalidatePath("/conductor");
  revalidatePath("/operador");
}

export async function registrarLlegadaAction(formData: FormData) {
  const session = await operator();
  const alertaId = String(formData.get("alertaId") ?? "") || undefined;
  const conductorId = String(formData.get("conductorId") ?? "");
  const puntoId = String(formData.get("puntoId") ?? "");
  const busetaId = String(formData.get("busetaId") ?? "");
  const horarioId = String(formData.get("horarioId") ?? "") || undefined;
  if (!conductorId || !puntoId || !busetaId) {
    return { error: "Faltan datos del cruce." };
  }
  if (alertaId) {
    const alerta = (await repo.listAlertas()).find((a) => a.id === alertaId);
    if (alerta?.status === "arrived") {
      return { error: "Ese aviso ya fue registrado." };
    }
  }
  const hora = nowIso();
  const registro = await repo.insertRegistro({
    id: crypto.randomUUID(),
    puntoId,
    conductorId,
    busetaId,
    horarioId,
    alertaId,
    horaLlegadaReal: hora,
    registradoPor: session.id,
    createdAt: hora,
  });
  if (alertaId) await repo.updateAlerta(alertaId, { status: "arrived" });
  await notifyPreviousBus(registro.id, puntoId, hora, false);
  revalidatePath("/operador");
  revalidatePath("/admin/historial");
  revalidatePath("/conductor");
}

export async function registrarSalidaAction(formData: FormData) {
  await operator();
  const id = String(formData.get("registroId") ?? "");
  const updated = await repo.updateRegistro(id, { horaSalidaReal: nowIso() });
  if (!updated) return { error: "No se encontró el registro." };
  await notifyPreviousBus(updated.id, updated.puntoId, updated.horaLlegadaReal, true);
  revalidatePath("/operador");
  revalidatePath("/admin/historial");
  revalidatePath("/conductor");
}

async function notifyPreviousBus(
  registroId: string,
  puntoId: string,
  llegadaIso: string,
  withSalida: boolean,
) {
  const current = (await repo.listRegistros()).find((r) => r.id === registroId);
  if (!current) return;
  const prev = await repo.lastRegistroBefore(puntoId, registroId, llegadaIso);
  if (!prev) return;
  const [buseta, punto, conductor] = await Promise.all([
    repo.getBuseta(current.busetaId),
    repo.getPunto(puntoId),
    repo.getUserById(current.conductorId),
  ]);
  const { formatTime } = await import("./time");
  const llegada = formatTime(current.horaLlegadaReal);
  const salida = current.horaSalidaReal ? formatTime(current.horaSalidaReal) : null;
  const body = withSalida && salida
    ? `El bus ${buseta?.codigo ?? ""} (${conductor?.name ?? "siguiente"}) llegó a ${punto?.name ?? "el punto"} a las ${llegada} y salió a las ${salida}.`
    : `El bus ${buseta?.codigo ?? ""} (${conductor?.name ?? "siguiente"}) llegó a ${punto?.name ?? "el punto"} a las ${llegada}.`;
  await notifyDriver({
    id: crypto.randomUUID(),
    userId: prev.conductorId,
    title: "El siguiente bus ya cruzó",
    body,
    read: false,
    createdAt: nowIso(),
    registroId,
    puntoId,
  });
}

export async function markReadAction(formData: FormData) {
  const session = await driver();
  await repo.markNotificacionRead(String(formData.get("id")), session.id);
  revalidatePath("/conductor");
}

export async function savePushSubscriptionAction(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const session = await readSession();
  if (!session) return;
  await repo.upsertPush({
    id: crypto.randomUUID(),
    userId: session.id,
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth,
  });
}

const MAX_ALERT_BYTES = 3 * 1024 * 1024;

export async function saveAlertSoundUrlAction(formData: FormData) {
  await admin();
  const url = String(formData.get("alertSoundUrl") ?? "").trim();
  if (!url) return { error: "Indica una URL o ruta de audio." };
  if (!(url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://"))) {
    return { error: "La URL debe ser una ruta /... o un enlace http(s)." };
  }
  await repo.saveSettings({
    alertSoundUrl: url,
    alertSoundData: undefined,
    alertSoundMime: undefined,
    alertSoundName: undefined,
  });
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
  return { ok: true };
}

export async function uploadAlertSoundAction(formData: FormData) {
  await admin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecciona un archivo de audio." };
  }
  if (file.size > MAX_ALERT_BYTES) {
    return { error: "El archivo no puede superar 3 MB." };
  }
  const mime = file.type || "audio/mpeg";
  if (!mime.startsWith("audio/")) {
    return { error: "Solo se permiten archivos de audio." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  await repo.saveSettings({
    alertSoundUrl: "/api/config/alert-audio",
    alertSoundData: base64,
    alertSoundMime: mime,
    alertSoundName: file.name,
  });
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
  return { ok: true };
}

export async function resetAlertSoundAction() {
  await admin();
  await repo.saveSettings({
    alertSoundUrl: "/sounds/alerta.wav",
    alertSoundData: undefined,
    alertSoundMime: undefined,
    alertSoundName: undefined,
  });
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
}

