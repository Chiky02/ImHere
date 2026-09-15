export const DEFAULT_AVISO_COOLDOWN_SECONDS = 180;
export const MIN_AVISO_COOLDOWN_SECONDS = 0;
export const MAX_AVISO_COOLDOWN_SECONDS = 7200;

export function clampAvisoCooldownSeconds(raw: unknown) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_AVISO_COOLDOWN_SECONDS;
  return Math.min(
    MAX_AVISO_COOLDOWN_SECONDS,
    Math.max(MIN_AVISO_COOLDOWN_SECONDS, Math.round(n)),
  );
}

export function cooldownRemainingMs(
  lastAlertAt: string | undefined,
  cooldownSeconds: number,
  now = Date.now(),
) {
  if (!lastAlertAt || cooldownSeconds <= 0) return 0;
  const until = Date.parse(lastAlertAt) + cooldownSeconds * 1000;
  if (Number.isNaN(until)) return 0;
  return Math.max(0, until - now);
}

export function formatCooldown(ms: number) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m <= 0) return `${s}s`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
