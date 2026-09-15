import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminListHeader } from "@/components/admin-list-header";
import { AppShell } from "@/components/app-shell";
import { ApproveDriverCard } from "@/components/approve-driver-card";
import { IconEdit, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { Badge } from "@/components/ui";
import { deleteUserAction } from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function ConductoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [users, busetas, puntos, roles] = await Promise.all([
    repo.listUsers(),
    repo.listBusetas(),
    repo.listPuntos(),
    repo.listRoles(),
  ]);
  const roleName = (roleId?: string, fallback?: string) =>
    roles.find((r) => r.id === roleId)?.name ?? fallback ?? "—";
  const pending = users.filter((u) => u.role === "driver" && !u.approved);

  const rows = users.map((u) => ({
    ...u,
    roleLabel: roleName(u.roleId, u.role),
    busetaCodigo: busetas.find((b) => b.id === u.busetaId)?.codigo ?? "",
    puntoLabel: (() => {
      const p = puntos.find((x) => x.id === u.puntoId);
      if (!p) return "";
      return p.numero != null ? `#${p.numero} ${p.name}` : p.name;
    })(),
  }));
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 12,
    fields: (u) => [u.name, u.phone, u.roleLabel, u.busetaCodigo, u.puntoLabel],
    sortKey: (u) => u.name,
  });

  return (
    <AppShell user={user}>
      <AdminListHeader
        title="Personas"
        subtitle="Crear y editar en pantalla aparte. Asigna punto a operadores/admin."
        createHref="/admin/conductores/nuevo"
        createLabel="Nueva persona"
      />

      {pending.length > 0 ? (
        <section className="mb-6 space-y-3">
          <h2 className="display text-xl">Por aprobar</h2>
          {pending.map((d) => (
            <ApproveDriverCard
              key={d.id}
              id={d.id}
              name={d.name}
              phone={d.phone}
              defaultBusetaId={d.busetaId}
              busetas={busetas.map((b) => ({ id: b.id, codigo: b.codigo }))}
            />
          ))}
        </section>
      ) : null}

      <div className="card p-4 sm:p-5">
        <ListToolbar
          path="/admin/conductores"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar…"
        />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Rol</th>
                <th>Buseta / Punto</th>
                <th>Estado</th>
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted">{u.phone}</p>
                  </td>
                  <td>{u.roleLabel}</td>
                  <td className="text-sm">
                    {u.role === "driver"
                      ? u.busetaCodigo || "Sin buseta"
                      : u.puntoLabel || "Sin punto"}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={u.approved ? "ok" : "warn"}>
                        {u.approved ? "Aprobado" : "Pendiente"}
                      </Badge>
                      <Badge tone={u.active !== false ? "ok" : "late"}>
                        {u.active !== false ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/admin/conductores/${u.id}`}
                        className="icon-btn"
                        title="Editar"
                      >
                        <IconEdit />
                      </Link>
                      <ConfirmForm
                        action={deleteUserAction}
                        title={`¿Eliminar a ${u.name}?`}
                        message="Borrado lógico."
                        confirmLabel="Eliminar"
                      >
                        <input type="hidden" name="id" value={u.id} />
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
          path="/admin/conductores"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{
            q: list.q || undefined,
            sort: list.sort === "desc" ? "desc" : undefined,
          }}
          label="personas"
        />
      </div>
    </AppShell>
  );
}
