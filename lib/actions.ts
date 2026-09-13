"use server";

import { hash, compare } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildSessionUser } from "./auth-user";
import {
  hasPermission,
  sanitizePermissions,
  SYSTEM_ROLE_IDS,
} from "./permissions";
import * as repo from "./repo";
import { horarioHoy } from "./schedule";
import { clearSessionCookie, homeForRole, readSession, setSessionCookie } from "./session";
import { nowIso, todayDate } from "./time";
import { notifyDriver } from "./push";
import type {
  AppRole,
  Buseta,
  Horario,
  Punto,
  Recorrido,
  RecorridoPunto,
  Role,
  User,
} from "./types";

export async function loginAction(formData: FormData) {
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  let role: Role;
  try {
    const user = await repo.getUserByPhone(phone);
    if (!user || !(await compare(password, user.passwordHash))) {
      return { error: "Celular o contraseña incorrectos." };
    }
    if (user.active === false) {
      return { error: "Esta cuenta está inactiva. Contacta al administrador." };
    }
    const session = await buildSessionUser(user);
    await setSessionCookie(session);
    role = session.role;
  } catch (err) {
    console.error("loginAction failed", err);
    return {
      error:
        "No se pudo conectar con la base de datos. Revisa Supabase y las variables de entorno.",
    };
  }
  redirect(homeForRole(role));
}

export async function registerAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  if (!name) return { error: "El nombre es obligatorio." };
  if (phone.length < 10) {
    return { error: "El celular debe tener al menos 10 dígitos." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password !== passwordConfirm) {
    return { error: "La confirmación de contraseña no coincide." };
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
    roleId: SYSTEM_ROLE_IDS.driver,
    approved: false,
    active: true,
    createdAt: nowIso(),
  };
  await repo.upsertUser(user);
  await setSessionCookie(await buildSessionUser(user));
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
  const existing = id ? await repo.getPunto(id) : undefined;
  const operatorIds = formData.getAll("operatorIds").map(String).filter(Boolean);
  const numeroRaw = String(formData.get("numero") ?? "").trim();
  const numero = numeroRaw ? Number(numeroRaw) : existing?.numero;
  const punto: Punto = {
    id,
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    numero: Number.isFinite(numero) ? Number(numero) : undefined,
    operatorIds,
    active: formData.get("active") !== "off",
  };
  if (!punto.name) return { error: "El nombre es obligatorio." };
  await repo.upsertPunto(punto);
  // Sync assigned users' puntoId when listed as operators
  const users = await repo.listUsers();
  for (const uid of operatorIds) {
    const u = users.find((x) => x.id === uid);
    if (u && (u.role === "operator" || u.role === "admin") && !u.puntoId) {
      u.puntoId = punto.id;
      await repo.upsertUser(u);
    }
  }
  revalidatePath("/admin/puntos");
  revalidatePath("/operador");
  redirect("/admin/puntos");
}

export async function deletePuntoAction(formData: FormData) {
  await admin();
  try {
    await repo.deletePunto(String(formData.get("id")));
  } catch (err) {
    console.error("deletePuntoAction", err);
    return { error: "No se pudo eliminar el punto." };
  }
  revalidatePath("/admin/puntos");
  return { ok: true };
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
  if (!buseta.codigo) return { error: "Indica el número de buseta." };
  await repo.upsertBuseta(buseta);
  revalidatePath("/admin/busetas");
  redirect("/admin/busetas");
}

export async function deleteBusetaAction(formData: FormData) {
  await admin();
  try {
    await repo.deleteBuseta(String(formData.get("id")));
  } catch (err) {
    console.error("deleteBusetaAction", err);
    return { error: "No se pudo eliminar la buseta." };
  }
  revalidatePath("/admin/busetas");
  revalidatePath("/admin/conductores");
  return { ok: true };
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
  if (!recorrido.name) return { error: "El nombre es obligatorio." };
  await repo.upsertRecorrido(recorrido);
  revalidatePath("/admin/recorridos");
  redirect("/admin/recorridos");
}

export async function deleteRecorridoAction(formData: FormData) {
  await admin();
  try {
    await repo.deleteRecorrido(String(formData.get("id")));
  } catch (err) {
    console.error("deleteRecorridoAction", err);
    return { error: "No se pudo eliminar el recorrido." };
  }
  revalidatePath("/admin/recorridos");
  revalidatePath("/admin/horarios");
  return { ok: true };
}

export async function saveHorarioAction(formData: FormData) {
  await admin();
  const dias = formData.getAll("dias").map((d) => Number(d));
  const busetaId = String(formData.get("busetaId") ?? "") || undefined;
  const conductorId = String(formData.get("conductorId") ?? "") || undefined;
  const horaSalida = String(formData.get("horaSalida") ?? "").trim() || "00:00";
  const horaLlegada = String(formData.get("horaLlegada") ?? "").trim() || "00:00";
  const horario: Horario = {
    id: String(formData.get("id") ?? "") || crypto.randomUUID(),
    recorridoId: String(formData.get("recorridoId") ?? ""),
    busetaId,
    conductorId,
    horaSalida,
    horaLlegada,
    tiempoViajeMin: Number(formData.get("tiempoViajeMin") || 0),
    dias: dias.length ? dias : [1, 2, 3, 4, 5, 6],
    active: formData.get("active") !== "off",
  };
  if (!horario.recorridoId) {
    return { error: "Selecciona un recorrido." };
  }
  await repo.upsertHorario(horario);
  revalidatePath("/admin/horarios");
  redirect("/admin/horarios");
}

export async function deleteHorarioAction(formData: FormData) {
  await admin();
  try {
    await repo.deleteHorario(String(formData.get("id")));
  } catch (err) {
    console.error("deleteHorarioAction", err);
    return { error: "No se pudo eliminar el horario." };
  }
  revalidatePath("/admin/horarios");
  return { ok: true };
}

export async function saveUserAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "") || crypto.randomUUID();
  const existing = await repo.getUserById(id);
  const isNew = !existing;
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const appRole = roleId ? await repo.getRole(roleId) : undefined;
  if (!appRole || !appRole.active) {
    return { error: "Selecciona un rol válido." };
  }
  const role = appRole.home;
  const phone = repo.normalizePhone(String(formData.get("phone") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const active = formData.get("active") !== "off";

  if (!name) return { error: "El nombre es obligatorio." };
  if (phone.length < 10) {
    return { error: "El celular debe tener al menos 10 dígitos." };
  }
  if (isNew && password.length < 6) {
    return { error: "La contraseña inicial debe tener al menos 6 caracteres." };
  }
  if (password && password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (password && password !== passwordConfirm) {
    return { error: "La confirmación de contraseña no coincide." };
  }
  const other = await repo.getUserByPhone(phone);
  if (other && other.id !== id) {
    return { error: "Ese celular ya está registrado." };
  }
  if (isNew && !password) {
    return { error: "Indica una contraseña inicial." };
  }

  const busetaId = String(formData.get("busetaId") ?? "") || undefined;
  const puntoId = String(formData.get("puntoId") ?? "") || undefined;
  const user: User = {
    id,
    name,
    phone,
    passwordHash: password
      ? await hash(password, 10)
      : existing!.passwordHash,
    role,
    roleId: appRole.id,
    busetaId: role === "driver" ? busetaId : undefined,
    puntoId: role === "operator" || role === "admin" ? puntoId : undefined,
    approved: formData.get("approved") !== "off",
    active,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  try {
    await repo.upsertUser(user);
    if (role === "driver" && busetaId) {
      await claimBusetaExclusive(user.id, busetaId);
    }
    if (user.puntoId) {
      await linkUserToPunto(user.id, user.puntoId);
    }
  } catch (err) {
    console.error("saveUserAction", err);
    return { error: "No se pudo guardar el usuario. Revisa los datos." };
  }
  revalidatePath("/admin/conductores");
  revalidatePath("/admin/puntos");
  revalidatePath("/operador");
  redirect("/admin/conductores");
}

export async function assignPuntoAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "");
  const puntoId = String(formData.get("puntoId") ?? "") || undefined;
  const user = await repo.getUserById(id);
  if (!user) return { error: "Usuario no encontrado." };
  if (user.role !== "operator" && user.role !== "admin") {
    return { error: "Solo operadores o admin gestionan un punto." };
  }
  user.puntoId = puntoId;
  await repo.upsertUser(user);
  if (puntoId) await linkUserToPunto(user.id, puntoId);
  revalidatePath("/admin/conductores");
  revalidatePath("/admin/puntos");
  revalidatePath("/operador");
  return { ok: true };
}

export async function updateUserRoleAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "");
  const roleId = String(formData.get("roleId") ?? "");
  const user = await repo.getUserById(id);
  const appRole = await repo.getRole(roleId);
  if (!user || !appRole || !appRole.active) {
    return { error: "Usuario o rol no válido." };
  }
  user.roleId = appRole.id;
  user.role = appRole.home;
  await repo.upsertUser(user);
  revalidatePath("/admin/conductores");
  return { ok: true };
}

export async function toggleUserActiveAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "");
  const session = await readSession();
  if (session?.id === id) {
    return { error: "No puedes desactivar tu propia cuenta." };
  }
  const user = await repo.getUserById(id);
  if (!user) return { error: "Usuario no encontrado." };
  user.active = formData.get("active") === "on";
  await repo.upsertUser(user);
  revalidatePath("/admin/conductores");
  return { ok: true };
}

export async function saveRoleAction(formData: FormData) {
  await admin();
  const session = await readSession();
  if (!session || !hasPermission(session, "manage.roles")) {
    return { error: "No tienes permiso para gestionar roles." };
  }
  const id = String(formData.get("id") ?? "") || crypto.randomUUID();
  const existing = await repo.getRole(id);
  const name = String(formData.get("name") ?? "").trim();
  const homeRaw = String(formData.get("home") ?? "driver");
  if (homeRaw !== "admin" && homeRaw !== "operator" && homeRaw !== "driver") {
    return { error: "Área de trabajo no válida." };
  }
  const home = homeRaw as Role;
  if (!name) return { error: "El nombre del rol es obligatorio." };
  if (existing?.isSystem) {
    // System roles: only permissions can be adjusted carefully
    const permissions = sanitizePermissions(
      existing.home,
      formData.getAll("permissions").map(String),
    );
    if (permissions.length === 0) {
      return { error: "El rol debe tener al menos un permiso." };
    }
    await repo.upsertRole({
      ...existing,
      permissions,
    });
    revalidatePath("/admin/roles");
    return { ok: true, message: "Permisos del rol de sistema actualizados." };
  }
  const slug =
    String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-") ||
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  const permissions = sanitizePermissions(
    home,
    formData.getAll("permissions").map(String),
  );
  if (permissions.length === 0) {
    return { error: "Selecciona al menos un permiso válido para esa área." };
  }
  const roles = await repo.listRoles();
  if (roles.some((r) => r.slug === slug && r.id !== id)) {
    return { error: "Ya existe un rol con ese identificador." };
  }
  const role: AppRole = {
    id,
    name,
    slug,
    home,
    permissions,
    isSystem: false,
    active: true,
    createdAt: existing?.createdAt ?? nowIso(),
  };
  await repo.upsertRole(role);
  revalidatePath("/admin/roles");
  return { ok: true, message: "Rol guardado." };
}

export async function deleteRoleAction(formData: FormData) {
  await admin();
  const session = await readSession();
  if (!session || !hasPermission(session, "manage.roles")) {
    return { error: "No tienes permiso para gestionar roles." };
  }
  const id = String(formData.get("id") ?? "");
  const role = await repo.getRole(id);
  if (!role) return { error: "Rol no encontrado." };
  if (role.isSystem) return { error: "No se pueden eliminar roles de sistema." };
  const users = await repo.listUsers();
  if (users.some((u) => u.roleId === id)) {
    return { error: "Hay usuarios con este rol. Asígnalles otro rol antes de eliminarlo." };
  }
  await repo.softDeleteRole(id);
  revalidatePath("/admin/roles");
  return { ok: true };
}

export async function setOwnBusetaAction(formData: FormData) {
  const session = await readSession();
  if (!session || session.role !== "driver") {
    return { error: "No autorizado." };
  }
  if (!hasPermission(session, "conductor.buseta_self")) {
    return { error: "Tu rol no permite cambiar la buseta." };
  }
  const user = await repo.getUserById(session.id);
  if (!user) return { error: "Usuario no encontrado." };
  const busetaId = String(formData.get("busetaId") ?? "");
  if (busetaId) {
    const buseta = await repo.getBuseta(busetaId);
    if (!buseta || !buseta.active) {
      return { error: "Buseta no válida." };
    }
  }
  await claimBusetaExclusive(user.id, busetaId || undefined);
  const refreshed = await repo.getUserById(session.id);
  if (refreshed) await setSessionCookie(await buildSessionUser(refreshed));
  revalidatePath("/cuenta");
  revalidatePath("/conductor");
  revalidatePath("/admin/busetas");
  return { ok: true, message: "Buseta actualizada. Si otro conductor la tenía, quedó liberada." };
}

export async function setSalidaHoyAction(formData: FormData) {
  const session = await readSession();
  if (!session || session.role !== "driver") {
    return { error: "No autorizado." };
  }
  const user = await repo.getUserById(session.id);
  if (!user) return { error: "Usuario no encontrado." };
  const { todayDate } = await import("./time");
  const clear = formData.get("clear") === "1";
  const raw = clear ? "" : String(formData.get("salidaHoy") ?? "").trim();
  if (!raw) {
    user.salidaHoy = undefined;
    user.salidaHoyFecha = undefined;
  } else {
    user.salidaHoy = raw;
    user.salidaHoyFecha = todayDate();
  }
  await repo.upsertUser(user);
  await setSessionCookie(await buildSessionUser(user));
  revalidatePath("/conductor");
  revalidatePath("/cuenta");
  return { ok: true, message: raw ? `Salida registrada: ${raw}` : "Salida borrada." };
}

export async function deleteUserAction(formData: FormData) {
  await admin();
  const id = String(formData.get("id") ?? "");
  const session = await readSession();
  if (!id) return { error: "Usuario no válido." };
  if (session?.id === id) {
    return { error: "No puedes eliminar tu propia cuenta." };
  }
  try {
    await repo.softDeleteUser(id);
  } catch (err) {
    console.error("deleteUserAction", err);
    return { error: "No se pudo eliminar el usuario." };
  }
  revalidatePath("/admin/conductores");
  return { ok: true };
}

export async function approveDriverAction(formData: FormData) {
  await admin();
  const user = await repo.getUserById(String(formData.get("id")));
  if (!user) return;
  user.approved = true;
  const busetaId = String(formData.get("busetaId") ?? "");
  await repo.upsertUser(user);
  if (busetaId) await claimBusetaExclusive(user.id, busetaId);
  revalidatePath("/admin/conductores");
  revalidatePath("/admin/busetas");
}

export async function assignBusetaAction(formData: FormData) {
  await admin();
  const user = await repo.getUserById(String(formData.get("id")));
  if (!user || user.role !== "driver") return;
  const busetaId = String(formData.get("busetaId") ?? "");
  await claimBusetaExclusive(user.id, busetaId || undefined);
  revalidatePath("/admin/conductores");
  revalidatePath("/admin/busetas");
  revalidatePath("/conductor");
  revalidatePath("/conductor/perfil");
}

/** Assign/clear driver from the busetas table (driverId + busetaId). */
export async function assignDriverToBusetaAction(formData: FormData) {
  await admin();
  const driverId = String(formData.get("driverId") ?? "");
  const busetaId = String(formData.get("busetaId") ?? "");
  if (!busetaId) return { error: "Buseta no válida." };
  if (!driverId) {
    const users = await repo.listUsers();
    for (const u of users) {
      if (u.busetaId === busetaId) {
        u.busetaId = undefined;
        await repo.upsertUser(u);
      }
    }
  } else {
    await claimBusetaExclusive(driverId, busetaId);
  }
  revalidatePath("/admin/busetas");
  revalidatePath("/admin/conductores");
  revalidatePath("/conductor");
  return { ok: true };
}

/** One active driver per buseta: clears previous owners. */
async function claimBusetaExclusive(userId: string, busetaId?: string) {
  const users = await repo.listUsers();
  if (busetaId) {
    for (const u of users) {
      if (u.busetaId === busetaId && u.id !== userId) {
        u.busetaId = undefined;
        await repo.upsertUser(u);
      }
    }
  }
  const user = users.find((u) => u.id === userId) ?? (await repo.getUserById(userId));
  if (!user) return;
  user.busetaId = busetaId;
  await repo.upsertUser(user);
}

/** Ensure operator/admin is linked on punto_operadores for their assigned point. */
async function linkUserToPunto(userId: string, puntoId: string) {
  const punto = await repo.getPunto(puntoId);
  if (!punto) return;
  if (!punto.operatorIds.includes(userId)) {
    punto.operatorIds = [...punto.operatorIds, userId];
    await repo.upsertPunto(punto);
  }
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
  await setSessionCookie(await buildSessionUser(user));
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
  await setSessionCookie(await buildSessionUser(user));
  revalidatePath("/cuenta");
  revalidatePath("/conductor/perfil");
  return { ok: true };
}

export async function avisoProximidadAction(formData: FormData) {
  try {
    const session = await readSession();
    if (!session || session.role !== "driver") {
      return { error: "Sesión vencida. Cierra la app y vuelve a entrar." };
    }
    const user = await repo.getUserById(session.id);
    if (!user || user.active === false) {
      return { error: "Tu cuenta no está activa. Habla con el admin." };
    }
    // Always trust DB approval (JWT can be stale after admin approval).
    if (!user.approved) {
      return { error: "Tu perfil aún no está aprobado por el admin." };
    }
    if (!user.busetaId) {
      return { error: "El admin aún no te asignó una buseta." };
    }
    const puntoId = String(formData.get("puntoId") ?? "");
    if (!puntoId) return { error: "Elige el punto al que te acercas." };

    const [horarios, recorridos, alertas] = await Promise.all([
      repo.listHorarios(),
      repo.listRecorridos(),
      repo.listAlertas(),
    ]);
    const horario = horarioHoy(horarios, user.id, user.busetaId);
    const recorrido = horario
      ? recorridos.find((r) => r.id === horario.recorridoId)
      : recorridos.find((r) => r.active);
    const ordered = [...(recorrido?.puntos ?? [])].sort(
      (a, b) => a.orden - b.orden,
    );
    if (ordered.length) {
      const current = ordered.find((step) => {
        const done = alertas.some(
          (a) =>
            a.conductorId === user.id &&
            a.puntoId === step.puntoId &&
            (a.status === "pending" || a.status === "arrived") &&
            isTodayIso(a.createdAt),
        );
        return !done;
      });
      if (!current) {
        return { error: "Ya avisaste todos los puntos de tu recorrido de hoy." };
      }
      if (current.puntoId !== puntoId) {
        return {
          error:
            "Solo puedes avisar el siguiente punto del recorrido. Completa el actual primero.",
        };
      }
    }

    const pending = alertas.find(
      (a) =>
        a.conductorId === user.id &&
        a.puntoId === puntoId &&
        a.status === "pending",
    );
    if (pending) return { error: "Ya avisaste que vas hacia ese punto." };
    await repo.insertAlerta({
      id: crypto.randomUUID(),
      puntoId,
      conductorId: user.id,
      busetaId: user.busetaId,
      horarioId: horario?.id,
      createdAt: nowIso(),
      status: "pending",
    });
    // Refresh cookie so next loads see approved + buseta immediately.
    if (
      session.approved !== user.approved ||
      session.busetaId !== user.busetaId
    ) {
      await setSessionCookie(await buildSessionUser(user));
    }
    revalidatePath("/conductor");
    revalidatePath("/operador");
    return { ok: true as const };
  } catch {
    return {
      error:
        "No se pudo enviar el aviso. Revisa la conexión e inténtalo de nuevo.",
    };
  }
}

function isTodayIso(iso: string) {
  const d = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
  return d === todayDate();
}

export async function registrarLlegadaAction(formData: FormData) {
  const session = await operator();
  const alertaId = String(formData.get("alertaId") ?? "") || undefined;
  const conductorId = String(formData.get("conductorId") ?? "");
  const puntoId = String(formData.get("puntoId") ?? "");
  const busetaId = String(formData.get("busetaId") ?? "");
  const horarioId = String(formData.get("horarioId") ?? "") || undefined;
  const horaLlegadaInput = String(formData.get("horaLlegada") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 500);
  if (!conductorId || !puntoId || !busetaId) {
    return { error: "Faltan datos del cruce." };
  }
  if (alertaId) {
    const alerta = (await repo.listAlertas()).find((a) => a.id === alertaId);
    if (alerta?.status === "arrived") {
      return { error: "Ese aviso ya fue registrado." };
    }
  }
  const { bogotaHhmmToIso, hhmmNow, nowIso, todayDate } = await import("./time");
  const hhmm = horaLlegadaInput || hhmmNow();
  const hora = bogotaHhmmToIso(hhmm, todayDate()) ?? nowIso();
  const registro = await repo.insertRegistro({
    id: crypto.randomUUID(),
    puntoId,
    conductorId,
    busetaId,
    horarioId,
    alertaId,
    horaLlegadaReal: hora,
    registradoPor: session.id,
    descripcion: descripcion || undefined,
    createdAt: nowIso(),
  });
  if (alertaId) await repo.updateAlerta(alertaId, { status: "arrived" });
  await notifyPreviousBus(registro.id, puntoId, hora, false);
  revalidatePath("/operador");
  revalidatePath("/admin/historial");
  revalidatePath("/conductor");
  return { ok: true };
}

export async function registrarSalidaAction(formData: FormData) {
  await operator();
  const id = String(formData.get("registroId") ?? "");
  const horaSalidaInput = String(formData.get("horaSalida") ?? "").trim();
  const current = (await repo.listRegistros()).find((r) => r.id === id);
  if (!current) return { error: "No se encontró el registro." };
  const { bogotaHhmmToIso, dateInBogota, hhmmNow, nowIso } = await import("./time");
  const day = dateInBogota(current.horaLlegadaReal);
  const hhmm = horaSalidaInput || hhmmNow();
  const horaSalida = bogotaHhmmToIso(hhmm, day) ?? nowIso();
  const updated = await repo.updateRegistro(id, { horaSalidaReal: horaSalida });
  if (!updated) return { error: "No se encontró el registro." };
  await notifyPreviousBus(updated.id, updated.puntoId, updated.horaLlegadaReal, true);
  revalidatePath("/operador");
  revalidatePath("/admin/historial");
  revalidatePath("/conductor");
  return { ok: true };
}

export async function updateRegistroCruceAction(formData: FormData) {
  await operator();
  const id = String(formData.get("registroId") ?? "");
  const current = (await repo.listRegistros()).find((r) => r.id === id);
  if (!current) return { error: "No se encontró el registro." };

  const horaLlegadaInput = String(formData.get("horaLlegada") ?? "").trim();
  const horaSalidaInput = String(formData.get("horaSalida") ?? "").trim();
  const descripcion = String(formData.get("descripcion") ?? "").trim().slice(0, 500);
  const clearDescripcion = formData.get("clearDescripcion") === "on";

  const { bogotaHhmmToIso, dateInBogota } = await import("./time");
  const day = dateInBogota(current.horaLlegadaReal);
  const patch: Partial<import("./types").RegistroCruce> = {};

  if (horaLlegadaInput) {
    const iso = bogotaHhmmToIso(horaLlegadaInput, day);
    if (!iso) return { error: "Hora de llegada no válida." };
    patch.horaLlegadaReal = iso;
  }
  if (horaSalidaInput) {
    const iso = bogotaHhmmToIso(horaSalidaInput, day);
    if (!iso) return { error: "Hora de salida no válida." };
    patch.horaSalidaReal = iso;
  }
  if (clearDescripcion) {
    patch.descripcion = "";
  } else if (formData.has("descripcion")) {
    patch.descripcion = descripcion;
  }

  const updated = await repo.updateRegistro(id, patch);
  if (!updated) return { error: "No se pudo actualizar." };
  revalidatePath("/operador");
  revalidatePath("/admin/historial");
  revalidatePath("/conductor");
  return { ok: true };
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

async function requireAlertEditor() {
  const user = await readSession();
  if (!user || (user.role !== "admin" && user.role !== "operator")) {
    throw new Error("No autorizado");
  }
  return user;
}

export async function saveAlertSoundUrlAction(formData: FormData) {
  const user = await requireAlertEditor();
  const url = String(formData.get("alertSoundUrl") ?? "").trim();
  if (!url) return { error: "Indica una URL o ruta de audio." };
  if (!(url.startsWith("/") || url.startsWith("https://") || url.startsWith("http://"))) {
    return { error: "La URL debe ser una ruta /... o un enlace http(s)." };
  }
  const patch = {
    alertSoundUrl: url,
    alertSoundData: undefined,
    alertSoundMime: undefined,
    alertSoundName: undefined,
  };
  if (user.role === "operator") {
    await repo.saveOperatorAlertSettings(user.id, patch);
  } else {
    await repo.saveSettings(patch);
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
  revalidatePath("/operador/sonido");
  return { ok: true };
}

export async function uploadAlertSoundAction(formData: FormData) {
  const user = await requireAlertEditor();
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
  const patch = {
    alertSoundUrl: "/api/config/alert-audio",
    alertSoundData: base64,
    alertSoundMime: mime,
    alertSoundName: file.name,
  };
  if (user.role === "operator") {
    await repo.saveOperatorAlertSettings(user.id, patch);
  } else {
    await repo.saveSettings(patch);
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
  revalidatePath("/operador/sonido");
  return { ok: true };
}

export async function resetAlertSoundAction() {
  const user = await requireAlertEditor();
  const patch = {
    alertSoundUrl: "/sounds/alerta.wav",
    alertSoundData: undefined,
    alertSoundMime: undefined,
    alertSoundName: undefined,
  };
  if (user.role === "operator") {
    await repo.saveOperatorAlertSettings(user.id, patch);
  } else {
    await repo.saveSettings(patch);
  }
  revalidatePath("/admin/configuracion");
  revalidatePath("/operador");
  revalidatePath("/operador/sonido");
}

