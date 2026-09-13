import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminListHeader } from "@/components/admin-list-header";
import { AppShell } from "@/components/app-shell";
import { IconEdit, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { deleteHorarioAction } from "@/lib/actions";
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
      <AdminListHeader
        title="Horarios"
        subtitle="Plantillas por recorrido. Crear y editar aparte."
        createHref="/admin/horarios/nuevo"
        createLabel="Nueva plantilla"
      />
      <div className="card p-4 sm:p-5">
        <ListToolbar
          path="/admin/horarios"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar…"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Recorrido</th>
                <th>Viaje</th>
                <th>Buseta</th>
                <th>Conductor</th>
                <th>Días</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((h) => (
                <tr key={h.id}>
                  <td className="font-semibold">{h.recorridoName || "—"}</td>
                  <td>{h.tiempoViajeMin} min</td>
                  <td>{h.busetaCodigo || "Rotativa"}</td>
                  <td>{h.conductorName || "Rotativo"}</td>
                  <td className="text-sm">{h.diasLabel}</td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/admin/horarios/${h.id}`} className="icon-btn" title="Editar">
                        <IconEdit />
                      </Link>
                      <ConfirmForm
                        action={deleteHorarioAction}
                        title="¿Quitar esta plantilla?"
                        message="Quedará archivada."
                        confirmLabel="Quitar"
                      >
                        <input type="hidden" name="id" value={h.id} />
                        <button type="submit" className="icon-btn danger" title="Eliminar">
                          <IconTrash />
                        </button>
                      </ConfirmForm>
                    </div>
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
