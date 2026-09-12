import type { AppSettings } from "./types";

export const DEFAULT_ALERT_SOUND_URL = "/sounds/alerta.wav";

export function defaultSettings(): AppSettings {
  return { alertSoundUrl: DEFAULT_ALERT_SOUND_URL };
}

export function resolveAlertSoundUrl(settings: AppSettings) {
  if (settings.alertSoundData) return "/api/config/alert-audio";
  return settings.alertSoundUrl || DEFAULT_ALERT_SOUND_URL;
}
