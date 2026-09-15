import type { AppSettings } from "./types";
import { DEFAULT_AVISO_COOLDOWN_SECONDS } from "./aviso-cooldown";

export const DEFAULT_ALERT_SOUND_URL = "/sounds/alerta.wav";

export function defaultSettings(): AppSettings {
  return {
    alertSoundUrl: DEFAULT_ALERT_SOUND_URL,
    avisoCooldownSeconds: DEFAULT_AVISO_COOLDOWN_SECONDS,
    updatedAt: new Date(0).toISOString(),
  };
}

export function resolveAlertSoundUrl(settings: AppSettings) {
  const base = settings.alertSoundData
    ? "/api/config/alert-audio"
    : settings.alertSoundUrl || DEFAULT_ALERT_SOUND_URL;
  const v = settings.updatedAt
    ? encodeURIComponent(settings.updatedAt)
    : String(Date.now());
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}v=${v}`;
}
