import Link from "next/link";
import { buildHref } from "@/lib/pagination";

export function PaginationNav({
  path,
  page,
  totalPages,
  total,
  params = {},
  label = "resultados",
}: {
  path: string;
  page: number;
  totalPages: number;
  total: number;
  params?: Record<string, string | number | undefined | null>;
  label?: string;
}) {
  if (total === 0) {
    return <p className="mt-3 text-sm text-muted">Sin {label}.</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {total} {label}
        {totalPages > 1 ? ` · página ${page} de ${totalPages}` : null}
      </p>
      {totalPages > 1 ? (
        <nav className="flex items-center gap-2" aria-label="Paginación">
          {page > 1 ? (
            <Link
              className="btn btn-ghost"
              href={buildHref(path, { ...params, page: page - 1 })}
            >
              Anterior
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none opacity-40">
              Anterior
            </span>
          )}
          <span className="min-w-16 text-center text-sm text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              className="btn btn-ghost"
              href={buildHref(path, { ...params, page: page + 1 })}
            >
              Siguiente
            </Link>
          ) : (
            <span className="btn btn-ghost pointer-events-none opacity-40">
              Siguiente
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}

/** Paginación controlada en cliente (paneles en vivo). */
export function ClientPagination({
  page,
  totalPages,
  total,
  onPageChange,
  label = "resultados",
}: {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}) {
  if (total === 0) {
    return <p className="mt-3 text-sm text-muted">Sin {label}.</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        {total} {label}
        {totalPages > 1 ? ` · página ${page} de ${totalPages}` : null}
      </p>
      {totalPages > 1 ? (
        <nav className="flex items-center gap-2" aria-label="Paginación">
          <button
            type="button"
            className="btn btn-ghost disabled:pointer-events-none disabled:opacity-40"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Anterior
          </button>
          <span className="min-w-16 text-center text-sm text-muted">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-ghost disabled:pointer-events-none disabled:opacity-40"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Siguiente
          </button>
        </nav>
      ) : null}
    </div>
  );
}
