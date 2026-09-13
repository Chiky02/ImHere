import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IconSave, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import { deletePuntoAction, savePuntoAction } from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function PuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [puntos, users] = await Promise.all([repo.listPuntos(), repo.listUsers()]);
  const operators = users.filter((u) => u.role === "operator" && u.approved);
  const rows = puntos.map((p) => ({
    ...p,
    operatorNames: operators
      .filter((op) => p.operatorIds.includes(op.id))
      .map((op) => op.name)
      .join(", "),
  }));
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 10,
    fields: (p) => [p.name, p.address, p.operatorNames],
    sortKey: (p) => p.name,
  });

  return (
    <AppShell user={user}>
      <PageTitle
        title="Puntos"
        subtitle="Controles del recorrido. Crea arriba y gestiona en la tabla."
      />

      <form action={savePuntoAction} className="card mb-6 space-y-3 p-4 sm:p-5">
        <h2 className="display text-xl">Nuevo punto</h2>
        <div className="form-grid-compact">
          <div>
            <label>Nombre</label>
            <input
              name="name"
              required
              placeholder="El Recreo"
              className="input-compact w-full max-w-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <label>Dirección o referencia</label>
            <input
              name="address"
              placeholder="Cruce del negocio"
              className="input-compact w-full max-w-md"
            />
          </div>
        </div>
        <div>
          <label>Operadores</label>
          <div className="flex flex-wrap gap-3">
            {operators.map((op) => (
              <label key={op.id} className="m-0 flex items-center gap-2 normal-case tracking-normal">
                <input type="checkbox" name="operatorIds" value={op.id} className="w-auto" />
                {op.name}
              </label>
            ))}
            {operators.length === 0 ? (
              <span className="text-sm text-muted">Crea un operador en Personas.</span>
            ) : null}
          </div>
        </div>
        <button className="btn btn-primary" type="submit">
          Crear punto
        </button>
      </form>

      <div className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">Listado</h2>
        <ListToolbar path="/admin/puntos" q={list.q} sort={list.sort} placeholder="Buscar punto…" />
        <div className="overflow-x-auto">
          <table className="w-full max-w-4xl">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Operadores</th>
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id}>
                  <td>
                    <form action={savePuntoAction} id={`punto-${p.id}`} className="contents">
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        name="name"
                        defaultValue={p.name}
                        required
                        className="input-compact w-full max-w-[10rem]"
                      />
                    </form>
                  </td>
                  <td>
                    <input
                      form={`punto-${p.id}`}
                      name="address"
                      defaultValue={p.address}
                      className="input-compact w-full max-w-[14rem]"
                    />
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      {operators.map((op) => (
                        <label
                          key={op.id}
                          className="m-0 flex items-center gap-1 text-xs normal-case tracking-normal"
                        >
                          <input
                            form={`punto-${p.id}`}
                            type="checkbox"
                            name="operatorIds"
                            value={op.id}
                            defaultChecked={p.operatorIds.includes(op.id)}
                            className="w-auto"
                          />
                          {op.name}
                        </label>
                      ))}
                      {operators.length === 0 ? (
                        <span className="text-sm text-muted">—</span>
                      ) : null}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button
                        form={`punto-${p.id}`}
                        type="submit"
                        className="icon-btn"
                        title="Guardar"
                      >
                        <IconSave />
                      </button>
                      <ConfirmForm
                        action={deletePuntoAction}
                        title={`¿Archivar ${p.name}?`}
                        message="El punto quedará archivado (borrado lógico)."
                        confirmLabel="Archivar"
                      >
                        <input type="hidden" name="id" value={p.id} />
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
          path="/admin/puntos"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{ q: list.q || undefined, sort: list.sort === "desc" ? "desc" : undefined }}
          label="puntos"
        />
      </div>
    </AppShell>
  );
}
