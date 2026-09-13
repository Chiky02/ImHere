import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { IconSave, IconTrash, IconUser } from "@/components/action-icons";
import { CreateUserForm } from "@/components/create-user-form";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { Badge, PageTitle } from "@/components/ui";
import {
  approveDriverAction,
  assignBusetaAction,
  deleteUserAction,
  toggleUserActiveAction,
  updateUserRoleAction,
} from "@/lib/actions";
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
  const [users, busetas, roles] = await Promise.all([
    repo.listUsers(),
    repo.listBusetas(),
    repo.listRoles(),
  ]);
  const roleName = (roleId?: string, fallback?: string) =>
    roles.find((r) => r.id === roleId)?.name ?? fallback ?? "—";
  const drivers = users.filter((u) => u.role === "driver");
  const pending = drivers.filter((d) => !d.approved);
  const roleOpts = roles.map((r) => ({ id: r.id, name: r.name, home: r.home }));

  const rows = users.map((u) => ({
    ...u,
    roleLabel: roleName(u.roleId, u.role),
    busetaCodigo: busetas.find((b) => b.id === u.busetaId)?.codigo ?? "",
  }));
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 12,
    fields: (u) => [u.name, u.phone, u.roleLabel, u.busetaCodigo],
    sortKey: (u) => u.name,
  });

  return (
    <AppShell user={user}>
      <PageTitle
        title="Personas"
        subtitle="Crea arriba; busca y gestiona el equipo en la tabla."
      />

      {pending.length > 0 ? (
        <section className="mb-6 space-y-3">
          <h2 className="display text-2xl">Por aprobar</h2>
          {pending.map((d) => (
            <ConfirmForm
              key={d.id}
              action={approveDriverAction}
              title={`¿Aprobar a ${d.name}?`}
              message="El conductor podrá avisar proximidad. Al asignar buseta se libera al conductor anterior."
              confirmLabel="Aprobar"
              tone="default"
              className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <input type="hidden" name="id" value={d.id} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{d.name}</p>
                <p className="text-sm text-muted">{d.phone}</p>
              </div>
              <div className="w-full sm:w-auto">
                <label>Buseta</label>
                <select name="busetaId" defaultValue={d.busetaId ?? ""} className="input-compact">
                  <option value="">Sin asignar aún</option>
                  {busetas.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.codigo}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary w-full sm:w-auto" type="submit">
                Aprobar
              </button>
            </ConfirmForm>
          ))}
        </section>
      ) : null}

      <div className="mb-6">
        <CreateUserForm
          busetas={busetas.map((b) => ({ id: b.id, codigo: b.codigo }))}
          roles={roleOpts}
        />
      </div>

      <div className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl">Equipo</h2>
        <ListToolbar
          path="/admin/conductores"
          q={list.q}
          sort={list.sort}
          placeholder="Buscar nombre, celular, rol…"
        />
        <div className="overflow-x-auto">
          <table className="w-full max-w-5xl">
            <thead>
              <tr>
                <th>Persona</th>
                <th>Rol</th>
                <th>Buseta</th>
                <th>Estado</th>
                <th className="w-32">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted">{u.phone}</p>
                  </td>
                  <td>
                    <form
                      action={updateUserRoleAction as never}
                      className="table-actions"
                    >
                      <input type="hidden" name="id" value={u.id} />
                      <select
                        name="roleId"
                        defaultValue={u.roleId ?? ""}
                        required
                        className="input-compact max-w-[10rem]"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="icon-btn" title="Aplicar rol">
                        <IconSave />
                      </button>
                    </form>
                  </td>
                  <td>
                    {u.role === "driver" ? (
                      <form action={assignBusetaAction} className="table-actions">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="busetaId"
                          defaultValue={u.busetaId ?? ""}
                          className="input-compact max-w-[8rem]"
                        >
                          <option value="">Sin asignar</option>
                          {busetas.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.codigo}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="icon-btn" title="Asignar buseta">
                          <IconUser />
                        </button>
                      </form>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
                      <ConfirmForm
                        action={toggleUserActiveAction}
                        title={
                          u.active !== false
                            ? `¿Desactivar a ${u.name}?`
                            : `¿Activar a ${u.name}?`
                        }
                        message={
                          u.active !== false
                            ? "No podrá iniciar sesión hasta que lo reactives."
                            : "Recuperará el acceso al sistema."
                        }
                        confirmLabel={u.active !== false ? "Desactivar" : "Activar"}
                        tone={u.active !== false ? "danger" : "default"}
                      >
                        <input type="hidden" name="id" value={u.id} />
                        <input
                          type="hidden"
                          name="active"
                          value={u.active !== false ? "off" : "on"}
                        />
                        <button
                          type="submit"
                          className="icon-btn"
                          title={u.active !== false ? "Desactivar" : "Activar"}
                        >
                          {u.active !== false ? "⏸" : "▶"}
                        </button>
                      </ConfirmForm>
                      <ConfirmForm
                        action={deleteUserAction}
                        title={`¿Eliminar a ${u.name}?`}
                        message="Se desactivará el usuario (borrado lógico)."
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
