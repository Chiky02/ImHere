import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminListHeader } from "@/components/admin-list-header";
import { AppShell } from "@/components/app-shell";
import { AssignBusetaDriverForm } from "@/components/assign-buseta-driver-form";
import { IconEdit, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { deleteBusetaAction } from "@/lib/actions";
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
  const rows = busetas.map((b) => {
    const driver = drivers.find((u) => u.busetaId === b.id);
    return { ...b, driverName: driver?.name ?? "", driverId: driver?.id };
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
      <AdminListHeader
        title="Busetas"
        subtitle="Un conductor activo por buseta. Elige conductor y pulsa ✓ para guardar."
        createHref="/admin/busetas/nuevo"
        createLabel="Nueva buseta"
      />
      <div className="card p-4 sm:p-5">
        <ListToolbar
          path="/admin/busetas"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar número o conductor…"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-28">Número</th>
                <th>Conductor</th>
                <th className="w-28">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((b) => (
                <tr key={b.id}>
                  <td className="font-semibold">{b.codigo}</td>
                  <td>
                    <AssignBusetaDriverForm
                      busetaId={b.id}
                      currentDriverId={b.driverId}
                      drivers={drivers.map((d) => ({
                        id: d.id,
                        name: d.name,
                        busetaId: d.busetaId,
                      }))}
                    />
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/admin/busetas/${b.id}`} className="icon-btn" title="Editar">
                        <IconEdit />
                      </Link>
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
                    </div>
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
