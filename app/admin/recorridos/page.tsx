import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IconEdit, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { RecorridoForm } from "@/components/recorrido-form";
import { PageTitle } from "@/components/ui";
import { deleteRecorridoAction } from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function RecorridosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string; edit?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [recorridos, puntos] = await Promise.all([
    repo.listRecorridos(),
    repo.listPuntos(),
  ]);
  const activePuntos = puntos.filter((p) => p.active);
  const nameOf = (id: string) => puntos.find((p) => p.id === id)?.name ?? id;
  const rows = recorridos.map((r) => ({
    ...r,
    resumen: r.puntos
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((p) => `${nameOf(p.puntoId)} (${p.tiempoEsperadoMin}m)`)
      .join(" → "),
  }));
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 8,
    fields: (r) => [r.name, r.resumen],
    sortKey: (r) => r.name,
  });
  const editing = sp.edit ? recorridos.find((r) => r.id === sp.edit) : undefined;

  return (
    <AppShell user={user}>
      <PageTitle
        title="Recorridos"
        subtitle="Secuencia de puntos y minutos entre ellos. Crea arriba; edita desde la tabla."
      />

      <div className="card mb-6 p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">
          {editing ? `Editar: ${editing.name}` : "Nuevo recorrido"}
        </h2>
        <RecorridoForm puntos={activePuntos} recorrido={editing} />
      </div>

      <div className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">Listado</h2>
        <ListToolbar
          path="/admin/recorridos"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar recorrido…"
        />
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Ruta</th>
                <th className="w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((r) => (
                <tr key={r.id}>
                  <td className="font-semibold">{r.name}</td>
                  <td className="max-w-md text-sm text-muted">{r.resumen || "Sin puntos"}</td>
                  <td>
                    <div className="table-actions">
                      <a
                        className="icon-btn"
                        href={`/admin/recorridos?edit=${r.id}`}
                        title="Editar"
                      >
                        <IconEdit />
                      </a>
                      <ConfirmForm
                        action={deleteRecorridoAction}
                        title={`¿Archivar ${r.name}?`}
                        message="El recorrido y horarios ligados quedarán archivados."
                        confirmLabel="Archivar"
                      >
                        <input type="hidden" name="id" value={r.id} />
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
          path="/admin/recorridos"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{ q: list.q || undefined, sort: list.sort === "desc" ? "desc" : undefined }}
          label="recorridos"
        />
      </div>
    </AppShell>
  );
}
