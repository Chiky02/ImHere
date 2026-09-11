export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function parsePage(raw: string | undefined, fallback = 1) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : fallback;
}

export function paginate<T>(
  items: T[],
  page: number,
  pageSize = 15,
): PageResult<T> {
  const size = Math.min(Math.max(pageSize, 5), 50);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size) || 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: safePage,
    pageSize: size,
    total,
    totalPages,
  };
}

export function buildHref(
  path: string,
  params: Record<string, string | number | undefined | null>,
) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "page" && Number(value) <= 1) continue;
    q.set(key, String(value));
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}
