import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import { deleteHorarioAction, saveHorarioAction } from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";
import { DIA_LABELS } from "@/lib/time";

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [horarios, recorridos, busetas, users] = await Promise.all([
    repo.listHorarios(),
    repo.listRecorridos(),
    repo.listBusetas(),
    repo.listUsers(),
  ]);
  const drivers = users.filter((u) => u.role === "driver" && u.approved);
  const rows = horarios.map((h) => {
    const recorrido = recorridos.find((r) => r.id === h.recorridoId)?.name ?? "";
    const buseta = h.busetaId
      ? busetas.find((b) => b.id === h.busetaId)?.codigo ?? ""
      : "";
    const conductor = h.conductorId
      ? users.find((u) => u.id === h.conductorId)?.name ?? ""
      : "";
    return {
      ...h,
      recorridoName: recorrido,
      busetaCodigo: buseta,
      conductorName: conductor,
      diasLabel: h.dias.map((d) => DIA_LABELS[d]).join(" "),
    };
  });
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 12,
    fields: (h) => [
      h.recorridoName,
      h.busetaCodigo,
      h.conductorName,
      h.diasLabel,
      String(h.tiempoViajeMin),
    ],
    sortKey: (h) => h.recorridoName || h.id,
  });

  return (
    <AppShell user={user}>
      <PageTitle
        title="Horarios"
        subtitle="Plantilla por recorrido y días. La salida la puede indicar el conductor el día del viaje; buseta y conductor son opcionales (rotativos)."
      />

      <form action={saveHorarioAction as never} className="card mb-6 space-y-3 p-4 sm:p-5">
        <h2 className="display text-xl">Nueva plantilla</h2>
        <div className="form-grid-compact">
          <div className="sm:col-span-2">
            <label>Recorrido</label>
            <select name="recorridoId" required className="input-compact w-full max-w-xs">
              {recorridos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Tiempo de viaje (min)</label>
            <input
              name="tiempoViajeMin"
              type="number"
              min={1}
              defaultValue={100}
              className="input-compact w-24"
              required
            />
          </div>
          <div>
            <label>Buseta (opcional)</label>
            <select name="busetaId" defaultValue="" className="input-compact max-w-[8rem]">
              <option value="">Rotativa</option>
              {busetas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.codigo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Conductor (opcional)</label>
            <select name="conductorId" defaultValue="" className="input-compact max-w-[12rem]">
              <option value="">Rotativo</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Salida ref. (opcional)</label>
            <input name="horaSalida" type="time" className="input-compact" />
          </div>
          <div>
            <label>Llegada ref. (opcional)</label>
            <input name="horaLlegada" type="time" className="input-compact" />
          </div>
        </div>
        <div>
          <label>Días</label>
          <div className="flex flex-wrap gap-3">
            {DIA_LABELS.map((label, i) => (
              <label
                key={label}
                className="m-0 flex items-center gap-1 normal-case tracking-normal"
              >
                <input
                  type="checkbox"
                  name="dias"
                  value={i}
                  defaultChecked={i >= 1 && i <= 6}
                  className="w-auto"
                />
                {label}
              </label>
            ))}
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          Guardar plantilla
        </button>
      </form>

      <div className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">Listado</h2>
        <ListToolbar
          path="/admin/horarios"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar recorrido, buseta, conductor…"
        />
        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl">
            <thead>
              <tr>
                <th>Recorrido</th>
                <th>Viaje</th>
                <th>Buseta</th>
                <th>Conductor</th>
                <th>Días</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((h) => (
                <tr key={h.id}>
                  <td className="font-semibold">{h.recorridoName || "—"}</td>
                  <td>
                    {h.tiempoViajeMin} min
                    {h.horaSalida && h.horaSalida !== "00:00" ? (
                      <span className="block text-xs text-muted">
                        Ref. {h.horaSalida}
                        {h.horaLlegada && h.horaLlegada !== "00:00"
                          ? ` → ${h.horaLlegada}`
                          : ""}
                      </span>
                    ) : null}
                  </td>
                  <td>{h.busetaCodigo || "Rotativa"}</td>
                  <td>{h.conductorName || "Rotativo"}</td>
                  <td className="text-sm">{h.diasLabel}</td>
                  <td>
                    <ConfirmForm
                      action={deleteHorarioAction}
                      title="¿Quitar esta plantilla?"
                      message="Quedará archivada (borrado lógico)."
                      confirmLabel="Quitar"
                    >
                      <input type="hidden" name="id" value={h.id} />
                      <button type="submit" className="icon-btn danger" title="Eliminar">
                        <IconTrash />
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationNav
          path="/admin/horarios"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{
            q: list.q || undefined,
            sort: list.sort === "desc" ? "desc" : undefined,
          }}
          label="horarios"
        />
      </div>
    </AppShell>
  );
}
