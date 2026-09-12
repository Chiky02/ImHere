import * as repo from "./repo";
import { resolveAlertSoundUrl } from "./settings";
import type { AppSettings, SessionUser } from "./types";

/** Operator personal sound if set; otherwise global admin default. */
export async function alertSettingsForUser(
  user: SessionUser,
): Promise<AppSettings> {
  if (user.role === "operator") {
    const personal = await repo.getOperatorAlertSettings(user.id);
    if (personal && (personal.alertSoundData || personal.alertSoundUrl)) {
      return personal;
    }
  }
  return repo.getSettings();
}

export async function resolvedAlertSoundForUser(user: SessionUser) {
  const settings = await alertSettingsForUser(user);
  return {
    settings,
    url: resolveAlertSoundUrl(settings),
  };
}
