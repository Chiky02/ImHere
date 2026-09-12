import { isSupabaseConfigured } from "./supabase";
import * as fileRepo from "./file-repo";
import * as supabaseRepo from "./supabase-repo";

function impl() {
  return isSupabaseConfigured() ? supabaseRepo : fileRepo;
}

export const listUsers = (...a: Parameters<typeof fileRepo.listUsers>) =>
  impl().listUsers(...a);
export const getUserById = (...a: Parameters<typeof fileRepo.getUserById>) =>
  impl().getUserById(...a);
export const getUserByPhone = (...a: Parameters<typeof fileRepo.getUserByPhone>) =>
  impl().getUserByPhone(...a);
export const upsertUser = (...a: Parameters<typeof fileRepo.upsertUser>) =>
  impl().upsertUser(...a);
export const listPuntos = (...a: Parameters<typeof fileRepo.listPuntos>) =>
  impl().listPuntos(...a);
export const getPunto = (...a: Parameters<typeof fileRepo.getPunto>) =>
  impl().getPunto(...a);
export const upsertPunto = (...a: Parameters<typeof fileRepo.upsertPunto>) =>
  impl().upsertPunto(...a);
export const deletePunto = (...a: Parameters<typeof fileRepo.deletePunto>) =>
  impl().deletePunto(...a);
export const listBusetas = (...a: Parameters<typeof fileRepo.listBusetas>) =>
  impl().listBusetas(...a);
export const getBuseta = (...a: Parameters<typeof fileRepo.getBuseta>) =>
  impl().getBuseta(...a);
export const upsertBuseta = (...a: Parameters<typeof fileRepo.upsertBuseta>) =>
  impl().upsertBuseta(...a);
export const deleteBuseta = (...a: Parameters<typeof fileRepo.deleteBuseta>) =>
  impl().deleteBuseta(...a);
export const listRecorridos = (...a: Parameters<typeof fileRepo.listRecorridos>) =>
  impl().listRecorridos(...a);
export const getRecorrido = (...a: Parameters<typeof fileRepo.getRecorrido>) =>
  impl().getRecorrido(...a);
export const upsertRecorrido = (...a: Parameters<typeof fileRepo.upsertRecorrido>) =>
  impl().upsertRecorrido(...a);
export const deleteRecorrido = (...a: Parameters<typeof fileRepo.deleteRecorrido>) =>
  impl().deleteRecorrido(...a);
export const listHorarios = (...a: Parameters<typeof fileRepo.listHorarios>) =>
  impl().listHorarios(...a);
export const upsertHorario = (...a: Parameters<typeof fileRepo.upsertHorario>) =>
  impl().upsertHorario(...a);
export const deleteHorario = (...a: Parameters<typeof fileRepo.deleteHorario>) =>
  impl().deleteHorario(...a);
export const listAlertas = (...a: Parameters<typeof fileRepo.listAlertas>) =>
  impl().listAlertas(...a);
export const insertAlerta = (...a: Parameters<typeof fileRepo.insertAlerta>) =>
  impl().insertAlerta(...a);
export const updateAlerta = (...a: Parameters<typeof fileRepo.updateAlerta>) =>
  impl().updateAlerta(...a);
export const listRegistros = (...a: Parameters<typeof fileRepo.listRegistros>) =>
  impl().listRegistros(...a);
export const insertRegistro = (...a: Parameters<typeof fileRepo.insertRegistro>) =>
  impl().insertRegistro(...a);
export const updateRegistro = (...a: Parameters<typeof fileRepo.updateRegistro>) =>
  impl().updateRegistro(...a);
export const lastRegistroBefore = (
  ...a: Parameters<typeof fileRepo.lastRegistroBefore>
) => impl().lastRegistroBefore(...a);
export const listNotificaciones = (
  ...a: Parameters<typeof fileRepo.listNotificaciones>
) => impl().listNotificaciones(...a);
export const insertNotificacion = (
  ...a: Parameters<typeof fileRepo.insertNotificacion>
) => impl().insertNotificacion(...a);
export const markNotificacionRead = (
  ...a: Parameters<typeof fileRepo.markNotificacionRead>
) => impl().markNotificacionRead(...a);
export const listPush = (...a: Parameters<typeof fileRepo.listPush>) =>
  impl().listPush(...a);
export const upsertPush = (...a: Parameters<typeof fileRepo.upsertPush>) =>
  impl().upsertPush(...a);
export const deletePush = (...a: Parameters<typeof fileRepo.deletePush>) =>
  impl().deletePush(...a);
export const getSettings = (...a: Parameters<typeof fileRepo.getSettings>) =>
  impl().getSettings(...a);
export const saveSettings = (...a: Parameters<typeof fileRepo.saveSettings>) =>
  impl().saveSettings(...a);

export { normalizePhone } from "./file-repo";
