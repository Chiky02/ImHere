import { paginate, parsePage, type PageResult } from "./pagination";

export type SortDir = "asc" | "desc";

export function parseSort(raw: string | undefined, fallback: SortDir = "asc"): SortDir {
  return raw === "desc" ? "desc" : raw === "asc" ? "asc" : fallback;
}

export function parseQuery(raw: string | undefined) {
  return (raw ?? "").trim().toLowerCase();
}

export function filterByQuery<T>(
  items: T[],
  q: string,
  fields: (item: T) => Array<string | number | null | undefined>,
) {
  if (!q) return items;
  return items.filter((item) =>
    fields(item).some((f) => String(f ?? "").toLowerCase().includes(q)),
  );
}

export function sortByText<T>(
  items: T[],
  dir: SortDir,
  getKey: (item: T) => string,
) {
  const sorted = [...items].sort((a, b) =>
    getKey(a).localeCompare(getKey(b), "es", { sensitivity: "base", numeric: true }),
  );
  return dir === "desc" ? sorted.reverse() : sorted;
}

export function listQuery<T>(
  items: T[],
  opts: {
    q?: string;
    sort?: SortDir;
    page?: string;
    pageSize?: number;
    fields: (item: T) => Array<string | number | null | undefined>;
    sortKey: (item: T) => string;
  },
): PageResult<T> & { q: string; sort: SortDir } {
  const q = parseQuery(opts.q);
  const sort = parseSort(opts.sort);
  const filtered = filterByQuery(items, q, opts.fields);
  const sorted = sortByText(filtered, sort, opts.sortKey);
  const page = paginate(sorted, parsePage(opts.page), opts.pageSize ?? 15);
  return { ...page, q, sort };
}
