import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaginationNav } from "@/components/pagination";
import { Badge, PageTitle } from "@/components/ui";
import { historialData } from "@/lib/queries";
import { parsePage } from "@/lib/pagination";
import { readSession } from "@/lib/session";
import { todayDate } from "@/lib/time";

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ punto?: string; dia?: string; page?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const dia = sp.dia || todayDate();
  const page = parsePage(sp.page);
  const data = await historialData({
    puntoId: sp.punto || undefined,
    day: dia,
    page,
    pageSize: 15,
  });

  return (
    <AppShell user={user}>
      <PageTitle
        title="Historial del día"
        subtitle="Cruces por día: salida, llegada, hora esperada y minutos de diferencia."
      />

      <form className="card mb-4 grid gap-3 p-4 sm:grid-cols-3 sm:items-end">
        <div>
          <label htmlFor="dia">Día</label>
          <input id="dia" name="dia" type="date" defaultValue={dia} required />
        </div>
        <div>
          <label htmlFor="punto">Punto</label>
          <select id="punto" name="punto" defaultValue={sp.punto ?? ""}>
            <option value="">Todos</option>
            {data.puntos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary w-full sm:w-auto" type="submit">
          Filtrar
        </button>
      </form>

      <div className="space-y-3 sm:hidden">
        {data.rows.map((r) => (
          <article key={r.id} className="card space-y-2 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  Buseta {r.busetaCodigo} · {r.conductorName}
                </p>
                <p className="text-sm text-muted">{r.puntoName}</p>
              </div>
              {r.puntualidad ? (
                <Badge
                  tone={
                    r.puntualidad === "a_tiempo"
                      ? "ok"
                      : r.puntualidad === "tarde"
                        ? "late"
                        : "warn"
                  }
                >
                  {r.diffLabel}
                </Badge>
              ) : null}
            </div>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs uppercase text-muted">Salida prog.</dt>
                <dd>{r.horaSalidaProg}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Esperada</dt>
                <dd>{r.esperado}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Llegada</dt>
                <dd>{r.llegadaHora}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-muted">Salida punto</dt>
                <dd>{r.salidaHora}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="card hidden overflow-x-auto p-2 sm:block">
        <table>
          <thead>
            <tr>
              <th>Punto</th>
              <th>Buseta</th>
              <th>Conductor</th>
              <th>Salida prog.</th>
              <th>Llegada</th>
              <th>Salida punto</th>
              <th>Esperada</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.puntoName}</td>
                <td>{r.busetaCodigo}</td>
                <td>{r.conductorName}</td>
                <td>{r.horaSalidaProg}</td>
                <td>{r.llegadaHora}</td>
                <td>{r.salidaHora}</td>
                <td>{r.esperado}</td>
                <td>
                  {r.puntualidad ? (
                    <Badge
                      tone={
                        r.puntualidad === "a_tiempo"
                          ? "ok"
                          : r.puntualidad === "tarde"
                            ? "late"
                            : "warn"
                      }
                    >
                      {r.diffLabel}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.rows.length === 0 ? (
          <p className="p-4 text-muted">Sin registros para este filtro.</p>
        ) : null}
      </div>

      <PaginationNav
        path="/admin/historial"
        page={data.page}
        totalPages={data.totalPages}
        total={data.total}
        params={{ punto: sp.punto, dia }}
        label="cruces"
      />
    </AppShell>
  );
}
