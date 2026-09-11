export const TZ = "America/Bogota";

export function nowIso() {
  return new Date().toISOString();
}

export function todayDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function weekdayBogota() {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(new Date());
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[day] ?? new Date().getDay();
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function hhmmNow() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function addMinutesToHhmm(hhmm: string, minutes: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  const nh = Math.floor(total / 60);
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

export function punctuality(
  expectedHhmm: string,
  actualIso: string,
  toleranceMin = 3,
): "temprano" | "a_tiempo" | "tarde" {
  const diff = minutesDiff(expectedHhmm, actualIso);
  if (diff < -toleranceMin) return "temprano";
  if (diff > toleranceMin) return "tarde";
  return "a_tiempo";
}

/** Minutos reales − esperados. Negativo = temprano, positivo = tarde. */
export function minutesDiff(expectedHhmm: string, actualIso: string) {
  const actual = formatTime(actualIso);
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(actual) - toMin(expectedHhmm);
}

export function formatDiffMinutes(diff: number) {
  if (diff === 0) return "A tiempo";
  if (diff < 0) {
    const m = Math.abs(diff);
    return `${m} min antes`;
  }
  return `${diff} min después`;
}

export function dateInBogota(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export const DIA_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
