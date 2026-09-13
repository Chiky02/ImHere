import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IconSave, IconTrash, IconUser } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import {
  assignDriverToBusetaAction,
  deleteBusetaAction,
  saveBusetaAction,
} from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function BusetasPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [busetas, users] = await Promise.all([repo.listBusetas(), repo.listUsers()]);
  const drivers = users.filter((u) => u.role === "driver" && u.approved);
  const driverOf = (busetaId: string) =>
    drivers.find((u) => u.busetaId === busetaId);

  const rows = busetas.map((b) => {
    const driver = driverOf(b.id);
    return {
      ...b,
      driverName: driver?.name ?? "",
      driverId: driver?.id,
    };
  });
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 12,
    fields: (b) => [b.codigo, b.driverName],
    sortKey: (b) => b.codigo,
  });

  return (
    <AppShell user={user}>
      <PageTitle
        title="Busetas"
        subtitle="Un solo conductor activo por buseta. Al asignar, se libera al anterior."
      />

      <ConfirmForm
        action={saveBusetaAction}
        title="¿Agregar buseta?"
        message="Se creará una nueva buseta con ese número."
        confirmLabel="Agregar"
        tone="default"
        className="card mb-6 p-4 sm:p-5"
      >
        <h2 className="display mb-3 text-xl">Nueva buseta</h2>
        <div className="form-grid-compact">
          <div>
            <label htmlFor="codigo">Número</label>
            <input
              id="codigo"
              name="codigo"
              required
              placeholder="5012"
              inputMode="numeric"
              className="input-compact w-full max-w-[10rem]"
            />
          </div>
          <button className="btn btn-primary" type="submit">
            Agregar
          </button>
        </div>
      </ConfirmForm>

      <div className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">Listado</h2>
        <ListToolbar
          path="/admin/busetas"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar número o conductor…"
        />
        <div className="overflow-x-auto">
          <table className="w-full max-w-3xl">
            <thead>
              <tr>
                <th>Número</th>
                <th>Conductor</th>
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((b) => (
                <tr key={b.id}>
                  <td>
                    <form action={saveBusetaAction} className="table-actions">
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        name="codigo"
                        defaultValue={b.codigo}
                        required
                        inputMode="numeric"
                        className="input-compact w-24"
                      />
                      <button type="submit" className="icon-btn" title="Guardar número">
                        <IconSave />
                      </button>
                    </form>
                  </td>
                  <td>
                    <form
                      action={assignDriverToBusetaAction as never}
                      className="table-actions"
                    >
                      <input type="hidden" name="busetaId" value={b.id} />
                      <select
                        name="driverId"
                        defaultValue={b.driverId ?? ""}
                        className="input-compact max-w-[14rem]"
                      >
                        <option value="">Sin conductor</option>
                        {drivers.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                            {d.busetaId && d.busetaId !== b.id
                              ? " · otra buseta"
                              : ""}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="icon-btn"
                        title="Asignar / liberar conductor"
                      >
                        <IconUser />
                      </button>
                    </form>
                  </td>
                  <td>
                    <ConfirmForm
                      action={deleteBusetaAction}
                      title={`¿Archivar buseta ${b.codigo}?`}
                      message="Queda archivada. El número sigue en el historial."
                      confirmLabel="Archivar"
                    >
                      <input type="hidden" name="id" value={b.id} />
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
          path="/admin/busetas"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{
            q: list.q || undefined,
            sort: list.sort === "desc" ? "desc" : undefined,
          }}
          label="busetas"
        />
      </div>
    </AppShell>
  );
}
