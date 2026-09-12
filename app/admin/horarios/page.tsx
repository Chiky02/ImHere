import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ConfirmForm } from "@/components/confirm-form";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import { deleteHorarioAction, saveHorarioAction } from "@/lib/actions";
import { paginate, parsePage } from "@/lib/pagination";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";
import { DIA_LABELS } from "@/lib/time";

export default async function HorariosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
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
  const sorted = [...horarios].sort((a, b) =>
    a.horaSalida.localeCompare(b.horaSalida),
  );
  const list = paginate(sorted, parsePage(sp.page), 15);
  return (
    <AppShell user={user}>
      <PageTitle
        title="Horarios"
        subtitle="Salida, llegada y tiempo de viaje por conductor y buseta."
      />
      <form action={saveHorarioAction} className="card mb-6 grid gap-3 p-5 md:grid-cols-3">
        <div className="md:col-span-3">
          <h2 className="display text-xl">Nuevo horario</h2>
        </div>
        <div>
          <label>Recorrido</label>
          <select name="recorridoId" required>
            {recorridos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Buseta</label>
          <select name="busetaId" required>
            {busetas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.codigo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Conductor</label>
          <select name="conductorId" required>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Hora de salida</label>
          <input name="horaSalida" type="time" required defaultValue="05:30" />
        </div>
        <div>
          <label>Hora de llegada</label>
          <input name="horaLlegada" type="time" required defaultValue="07:10" />
        </div>
        <div>
          <label>Tiempo de viaje (min)</label>
          <input name="tiempoViajeMin" type="number" min={1} defaultValue={100} />
        </div>
        <div className="md:col-span-3">
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
        <div>
          <button className="btn btn-primary" type="submit">
            Guardar horario
          </button>
        </div>
      </form>
      <div className="card overflow-x-auto p-2">
        <table>
          <thead>
            <tr>
              <th>Conductor</th>
              <th>Buseta</th>
              <th>Recorrido</th>
              <th>Sale / Llega</th>
              <th>Días</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.items.map((h) => (
              <tr key={h.id}>
                <td>{users.find((u) => u.id === h.conductorId)?.name}</td>
                <td>{busetas.find((b) => b.id === h.busetaId)?.codigo}</td>
                <td>{recorridos.find((r) => r.id === h.recorridoId)?.name}</td>
                <td>
                  {h.horaSalida} → {h.horaLlegada} ({h.tiempoViajeMin} min)
                </td>
                <td>{h.dias.map((d) => DIA_LABELS[d]).join(" ")}</td>
                <td>
                  <ConfirmForm
                    action={deleteHorarioAction}
                    title="¿Quitar este horario?"
                    message="El horario quedará archivado (borrado lógico)."
                    confirmLabel="Quitar"
                  >
                    <input type="hidden" name="id" value={h.id} />
                    <button className="text-sm text-signal" type="submit">
                      Quitar
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
        label="horarios"
      />
    </AppShell>
  );
}
