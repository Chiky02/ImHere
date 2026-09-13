import { supabaseAdmin } from "./supabase";
import type {
  Alerta,
  AppSettings,
  Buseta,
  Horario,
  Notificacion,
  Punto,
  PushSubscriptionRecord,
  Recorrido,
  RecorridoPunto,
  RegistroCruce,
  Role,
  User,
} from "./types";
import { normalizePhone } from "./file-repo";

type UserRow = {
  id: string;
  name: string;
  phone: string;
  password_hash: string;
  role: Role;
  role_id?: string | null;
  buseta_id: string | null;
  approved: boolean;
  active?: boolean | null;
  salida_hoy?: string | null;
  salida_hoy_fecha?: string | null;
  created_at: string;
  deleted_at?: string | null;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    roleId: row.role_id ?? undefined,
    busetaId: row.buseta_id ?? undefined,
    approved: row.approved,
    active: row.active !== false,
    salidaHoy: row.salida_hoy ?? undefined,
    salidaHoyFecha: row.salida_hoy_fecha ?? undefined,
    createdAt: row.created_at,
    deletedAt: row.deleted_at ?? undefined,
  };
}

function userRow(user: User) {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    password_hash: user.passwordHash,
    role: user.role,
    role_id: user.roleId ?? null,
    buseta_id: user.busetaId ?? null,
    approved: user.approved,
    active: user.active !== false,
    salida_hoy: user.salidaHoy ?? null,
    salida_hoy_fecha: user.salidaHoyFecha ?? null,
    created_at: user.createdAt,
  };
}

export async function listUsers() {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .is("deleted_at", null)
    .order("created_at");
  if (error) throw error;
  return (data as UserRow[]).map(mapUser);
}

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUser(data as UserRow) : undefined;
}

export async function getUserByPhone(phone: string) {
  const { data, error } = await supabaseAdmin()
    .from("users")
    .select("*")
    .eq("phone", normalizePhone(phone))
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? mapUser(data as UserRow) : undefined;
}

export async function upsertUser(user: User) {
  const { error } = await supabaseAdmin()
    .from("users")
    .upsert(userRow(user));
  if (error) throw error;
  return user;
}

export async function listPuntos() {
  const sb = supabaseAdmin();
  const { data: puntos, error } = await sb
    .from("puntos")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  const { data: ops, error: opErr } = await sb.from("punto_operadores").select("*");
  if (opErr) throw opErr;
  const byPunto = new Map<string, string[]>();
  for (const row of ops ?? []) {
    const list = byPunto.get(row.punto_id) ?? [];
    list.push(row.user_id);
    byPunto.set(row.punto_id, list);
  }
  return (puntos ?? []).map(
    (p): Punto => ({
      id: p.id,
      name: p.name,
      address: p.address ?? "",
      active: p.active,
      operatorIds: byPunto.get(p.id) ?? [],
      deletedAt: p.deleted_at ?? undefined,
    }),
  );
}

export async function getPunto(id: string) {
  return (await listPuntos()).find((p) => p.id === id);
}

export async function upsertPunto(punto: Punto) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("puntos").upsert({
    id: punto.id,
    name: punto.name,
    address: punto.address,
    active: punto.active,
  });
  if (error) throw error;
  await sb.from("punto_operadores").delete().eq("punto_id", punto.id);
  if (punto.operatorIds.length) {
    const { error: insErr } = await sb.from("punto_operadores").insert(
      punto.operatorIds.map((user_id) => ({ punto_id: punto.id, user_id })),
    );
    if (insErr) throw insErr;
  }
  return punto;
}

export async function deletePunto(id: string) {
  const { error } = await supabaseAdmin()
    .from("puntos")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (error) throw error;
}

export async function listBusetas() {
  const { data, error } = await supabaseAdmin()
    .from("busetas")
    .select("*")
    .is("deleted_at", null)
    .order("codigo");
  if (error) throw error;
  return (data ?? []).map(
    (b): Buseta => ({
      id: b.id,
      codigo: b.codigo,
      placa: b.placa ?? "",
      active: b.active,
      deletedAt: b.deleted_at ?? undefined,
    }),
  );
}

export async function listBusetasAny() {
  const { data, error } = await supabaseAdmin()
    .from("busetas")
    .select("*")
    .order("codigo");
  if (error) throw error;
  return (data ?? []).map(
    (b): Buseta => ({
      id: b.id,
      codigo: b.codigo,
      placa: b.placa ?? "",
      active: b.active,
      deletedAt: b.deleted_at ?? undefined,
    }),
  );
}

export async function getBuseta(id: string) {
  const { data, error } = await supabaseAdmin()
    .from("busetas")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    codigo: data.codigo,
    placa: data.placa ?? "",
    active: data.active,
    deletedAt: data.deleted_at ?? undefined,
  } satisfies Buseta;
}

/** Includes soft-deleted busetas (for historial / labels). */
export async function getBusetaAny(id: string) {
  const { data, error } = await supabaseAdmin()
    .from("busetas")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    codigo: data.codigo,
    placa: data.placa ?? "",
    active: data.active,
    deletedAt: data.deleted_at ?? undefined,
  } satisfies Buseta;
}

export async function upsertBuseta(buseta: Buseta) {
  const { error } = await supabaseAdmin().from("busetas").upsert(buseta);
  if (error) throw error;
  return buseta;
}

export async function deleteBuseta(id: string) {
  const sb = supabaseAdmin();
  const { error } = await sb
    .from("busetas")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (error) throw error;
  await sb.from("users").update({ buseta_id: null }).eq("buseta_id", id);
}

export async function listRecorridos() {
  const sb = supabaseAdmin();
  const { data: recs, error } = await sb
    .from("recorridos")
    .select("*")
    .is("deleted_at", null)
    .order("name");
  if (error) throw error;
  const { data: pts, error: pErr } = await sb
    .from("recorrido_puntos")
    .select("*")
    .order("orden");
  if (pErr) throw pErr;
  const byRec = new Map<string, RecorridoPunto[]>();
  for (const row of pts ?? []) {
    const list = byRec.get(row.recorrido_id) ?? [];
    list.push({
      puntoId: row.punto_id,
      orden: row.orden,
      tiempoEsperadoMin: row.tiempo_esperado_min,
    });
    byRec.set(row.recorrido_id, list);
  }
  return (recs ?? []).map(
    (r): Recorrido => ({
      id: r.id,
      name: r.name,
      active: r.active,
      puntos: byRec.get(r.id) ?? [],
      deletedAt: r.deleted_at ?? undefined,
    }),
  );
}

export async function getRecorrido(id: string) {
  return (await listRecorridos()).find((r) => r.id === id);
}

export async function upsertRecorrido(recorrido: Recorrido) {
  const sb = supabaseAdmin();
  const { error } = await sb.from("recorridos").upsert({
    id: recorrido.id,
    name: recorrido.name,
    active: recorrido.active,
  });
  if (error) throw error;
  await sb.from("recorrido_puntos").delete().eq("recorrido_id", recorrido.id);
  if (recorrido.puntos.length) {
    const { error: insErr } = await sb.from("recorrido_puntos").insert(
      recorrido.puntos.map((p) => ({
        recorrido_id: recorrido.id,
        punto_id: p.puntoId,
        orden: p.orden,
        tiempo_esperado_min: p.tiempoEsperadoMin,
      })),
    );
    if (insErr) throw insErr;
  }
  return recorrido;
}

export async function deleteRecorrido(id: string) {
  const sb = supabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb
    .from("recorridos")
    .update({ deleted_at: now, active: false })
    .eq("id", id);
  if (error) throw error;
  await sb
    .from("horarios")
    .update({ deleted_at: now, active: false })
    .eq("recorrido_id", id);
}

export async function listHorarios() {
  const { data, error } = await supabaseAdmin()
    .from("horarios")
    .select("*")
    .is("deleted_at", null);
  if (error) throw error;
  return (data ?? []).map(
    (h): Horario => ({
      id: h.id,
      recorridoId: h.recorrido_id,
      busetaId: h.buseta_id ?? undefined,
      conductorId: h.conductor_id ?? undefined,
      horaSalida: h.hora_salida ?? "00:00",
      horaLlegada: h.hora_llegada ?? "00:00",
      tiempoViajeMin: h.tiempo_viaje_min,
      dias: h.dias ?? [],
      active: h.active,
      deletedAt: h.deleted_at ?? undefined,
    }),
  );
}

export async function upsertHorario(horario: Horario) {
  const { error } = await supabaseAdmin().from("horarios").upsert({
    id: horario.id,
    recorrido_id: horario.recorridoId,
    buseta_id: horario.busetaId ?? null,
    conductor_id: horario.conductorId ?? null,
    hora_salida: horario.horaSalida || "00:00",
    hora_llegada: horario.horaLlegada || "00:00",
    tiempo_viaje_min: horario.tiempoViajeMin,
    dias: horario.dias,
    active: horario.active,
  });
  if (error) throw error;
  return horario;
}

export async function deleteHorario(id: string) {
  const { error } = await supabaseAdmin()
    .from("horarios")
    .update({ deleted_at: new Date().toISOString(), active: false })
    .eq("id", id);
  if (error) throw error;
}

function mapAlerta(row: Record<string, unknown>): Alerta {
  return {
    id: row.id as string,
    puntoId: row.punto_id as string,
    conductorId: row.conductor_id as string,
    busetaId: row.buseta_id as string,
    horarioId: (row.horario_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    status: row.status as Alerta["status"],
  };
}

export async function listAlertas() {
  const { data, error } = await supabaseAdmin()
    .from("alertas_proximidad")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapAlerta);
}

export async function insertAlerta(alerta: Alerta) {
  const { error } = await supabaseAdmin().from("alertas_proximidad").insert({
    id: alerta.id,
    punto_id: alerta.puntoId,
    conductor_id: alerta.conductorId,
    buseta_id: alerta.busetaId,
    horario_id: alerta.horarioId ?? null,
    created_at: alerta.createdAt,
    status: alerta.status,
  });
  if (error) throw error;
  return alerta;
}

export async function updateAlerta(id: string, patch: Partial<Alerta>) {
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if (patch.puntoId) row.punto_id = patch.puntoId;
  const { data, error } = await supabaseAdmin()
    .from("alertas_proximidad")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? mapAlerta(data) : undefined;
}

function mapRegistro(row: Record<string, unknown>): RegistroCruce {
  return {
    id: row.id as string,
    puntoId: row.punto_id as string,
    conductorId: row.conductor_id as string,
    busetaId: row.buseta_id as string,
    horarioId: (row.horario_id as string | null) ?? undefined,
    alertaId: (row.alerta_id as string | null) ?? undefined,
    horaLlegadaReal: row.hora_llegada_real as string,
    horaSalidaReal: (row.hora_salida_real as string | null) ?? undefined,
    registradoPor: row.registrado_por as string,
    evidenciaUrl: (row.evidencia_url as string | null) ?? undefined,
    descripcion: (row.descripcion as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export async function listRegistros() {
  const { data, error } = await supabaseAdmin()
    .from("registros_cruce")
    .select("*")
    .order("hora_llegada_real", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapRegistro);
}

export async function insertRegistro(registro: RegistroCruce) {
  const { error } = await supabaseAdmin().from("registros_cruce").insert({
    id: registro.id,
    punto_id: registro.puntoId,
    conductor_id: registro.conductorId,
    buseta_id: registro.busetaId,
    horario_id: registro.horarioId ?? null,
    alerta_id: registro.alertaId ?? null,
    hora_llegada_real: registro.horaLlegadaReal,
    hora_salida_real: registro.horaSalidaReal ?? null,
    registrado_por: registro.registradoPor,
    evidencia_url: registro.evidenciaUrl ?? null,
    descripcion: registro.descripcion ?? null,
    created_at: registro.createdAt,
  });
  if (error) throw error;
  return registro;
}

export async function updateRegistro(id: string, patch: Partial<RegistroCruce>) {
  const row: Record<string, unknown> = {};
  if (patch.horaSalidaReal !== undefined) row.hora_salida_real = patch.horaSalidaReal;
  if (patch.horaLlegadaReal !== undefined) row.hora_llegada_real = patch.horaLlegadaReal;
  if (patch.descripcion !== undefined) row.descripcion = patch.descripcion || null;
  if (patch.evidenciaUrl !== undefined) row.evidencia_url = patch.evidenciaUrl || null;
  const { data, error } = await supabaseAdmin()
    .from("registros_cruce")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  return data ? mapRegistro(data) : undefined;
}

export async function lastRegistroBefore(
  puntoId: string,
  excludeId: string,
  beforeIso: string,
) {
  const { data, error } = await supabaseAdmin()
    .from("registros_cruce")
    .select("*")
    .eq("punto_id", puntoId)
    .neq("id", excludeId)
    .lte("hora_llegada_real", beforeIso)
    .order("hora_llegada_real", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRegistro(data) : undefined;
}

export async function listNotificaciones() {
  const { data, error } = await supabaseAdmin()
    .from("notificaciones")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(
    (n): Notificacion => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      body: n.body,
      read: n.read,
      createdAt: n.created_at,
      registroId: n.registro_id ?? undefined,
      puntoId: n.punto_id ?? undefined,
    }),
  );
}

export async function insertNotificacion(n: Notificacion) {
  const { error } = await supabaseAdmin().from("notificaciones").insert({
    id: n.id,
    user_id: n.userId,
    title: n.title,
    body: n.body,
    read: n.read,
    created_at: n.createdAt,
    registro_id: n.registroId ?? null,
    punto_id: n.puntoId ?? null,
  });
  if (error) throw error;
  return n;
}

export async function markNotificacionRead(id: string, userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("notificaciones")
    .update({ read: true })
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    body: data.body,
    read: data.read,
    createdAt: data.created_at,
    registroId: data.registro_id ?? undefined,
    puntoId: data.punto_id ?? undefined,
  } satisfies Notificacion;
}

export async function listPush() {
  const { data, error } = await supabaseAdmin()
    .from("push_subscriptions")
    .select("*");
  if (error) throw error;
  return (data ?? []).map(
    (s): PushSubscriptionRecord => ({
      id: s.id,
      userId: s.user_id,
      endpoint: s.endpoint,
      p256dh: s.p256dh,
      auth: s.auth,
    }),
  );
}

export async function upsertPush(sub: PushSubscriptionRecord) {
  const { error } = await supabaseAdmin().from("push_subscriptions").upsert(
    {
      id: sub.id,
      user_id: sub.userId,
      endpoint: sub.endpoint,
      p256dh: sub.p256dh,
      auth: sub.auth,
    },
    { onConflict: "endpoint" },
  );
  if (error) throw error;
  return sub;
}

export async function deletePush(endpoint: string) {
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}

export async function getSettings() {
  const { data, error } = await supabaseAdmin()
    .from("app_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    return { alertSoundUrl: "/sounds/alerta.wav" } satisfies AppSettings;
  }
  return {
    alertSoundUrl: data.alert_sound_url || "/sounds/alerta.wav",
    alertSoundData: data.alert_sound_data ?? undefined,
    alertSoundMime: data.alert_sound_mime ?? undefined,
    alertSoundName: data.alert_sound_name ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  } satisfies AppSettings;
}

export async function saveSettings(patch: Partial<AppSettings>) {
  const current = await getSettings();
  const next: AppSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin().from("app_settings").upsert({
    id: 1,
    alert_sound_url: next.alertSoundUrl,
    alert_sound_data: next.alertSoundData ?? null,
    alert_sound_mime: next.alertSoundMime ?? null,
    alert_sound_name: next.alertSoundName ?? null,
    updated_at: next.updatedAt,
  });
  if (error) throw error;
  return next;
}

export async function getOperatorAlertSettings(userId: string) {
  const { data, error } = await supabaseAdmin()
    .from("operator_alert_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    alertSoundUrl: data.alert_sound_url || "/sounds/alerta.wav",
    alertSoundData: data.alert_sound_data ?? undefined,
    alertSoundMime: data.alert_sound_mime ?? undefined,
    alertSoundName: data.alert_sound_name ?? undefined,
    updatedAt: data.updated_at ?? undefined,
  } satisfies AppSettings;
}

export async function saveOperatorAlertSettings(
  userId: string,
  patch: Partial<AppSettings>,
) {
  const current = (await getOperatorAlertSettings(userId)) ?? {
    alertSoundUrl: "/sounds/alerta.wav",
  };
  const next: AppSettings = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  const { error } = await supabaseAdmin().from("operator_alert_settings").upsert({
    user_id: userId,
    alert_sound_url: next.alertSoundUrl,
    alert_sound_data: next.alertSoundData ?? null,
    alert_sound_mime: next.alertSoundMime ?? null,
    alert_sound_name: next.alertSoundName ?? null,
    updated_at: next.updatedAt,
  });
  if (error) throw error;
  return next;
}

export async function softDeleteUser(id: string) {
  const user = await getUserById(id);
  if (!user) return;
  const { error } = await supabaseAdmin()
    .from("users")
    .update({
      deleted_at: new Date().toISOString(),
      phone: `deleted_${id.slice(0, 8)}_${user.phone}`,
      buseta_id: null,
      active: false,
    })
    .eq("id", id);
  if (error) throw error;
}

function mapRole(row: Record<string, unknown>): import("./types").AppRole {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    home: row.home as Role,
    permissions: (row.permissions as string[]) ?? [],
    isSystem: Boolean(row.is_system),
    active: row.active !== false,
    createdAt: row.created_at as string,
  };
}

export async function listRoles() {
  const { data, error } = await supabaseAdmin()
    .from("app_roles")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? [])
    .map(mapRole)
    .filter((r) => r.active || r.isSystem);
}

export async function getRole(id: string) {
  const { data, error } = await supabaseAdmin()
    .from("app_roles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRole(data) : undefined;
}

export async function upsertRole(role: import("./types").AppRole) {
  const { error } = await supabaseAdmin().from("app_roles").upsert({
    id: role.id,
    name: role.name,
    slug: role.slug,
    home: role.home,
    permissions: role.permissions,
    is_system: role.isSystem,
    active: role.active,
    created_at: role.createdAt,
  });
  if (error) throw error;
  return role;
}

export async function softDeleteRole(id: string) {
  const role = await getRole(id);
  if (!role || role.isSystem) return;
  const { error } = await supabaseAdmin()
    .from("app_roles")
    .update({ active: false })
    .eq("id", id);
  if (error) throw error;
}

export { normalizePhone };
