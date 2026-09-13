import Link from "next/link";
import { buildHref } from "@/lib/pagination";
import type { SortDir } from "@/lib/list-query";

export function ListToolbar({
  path,
  q,
  sort,
  params = {},
  placeholder = "Buscar…",
}: {
  path: string;
  q: string;
  sort: SortDir;
  params?: Record<string, string | number | undefined | null>;
  placeholder?: string;
}) {
  return (
    <form
      method="get"
      action={path}
      className="mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
    >
      {Object.entries(params).map(([key, value]) =>
        value != null && value !== "" && key !== "q" && key !== "sort" && key !== "page" ? (
          <input key={key} type="hidden" name={key} value={String(value)} />
        ) : null,
      )}
      <div className="min-w-0 flex-1 sm:max-w-xs">
        <label htmlFor="q">Buscar</label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          placeholder={placeholder}
          className="input-compact"
        />
      </div>
      <div className="w-full sm:w-40">
        <label htmlFor="sort">Orden</label>
        <select id="sort" name="sort" defaultValue={sort} className="input-compact">
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
      </div>
      <button className="btn btn-ghost" type="submit">
        Filtrar
      </button>
      {q || sort === "desc" ? (
        <Link className="btn btn-ghost" href={buildHref(path, { ...params })}>
          Limpiar
        </Link>
      ) : null}
    </form>
  );
}
