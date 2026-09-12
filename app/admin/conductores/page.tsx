import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CreateUserForm } from "@/components/create-user-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PaginationNav } from "@/components/pagination";
import { Badge, PageTitle } from "@/components/ui";
import {
  approveDriverAction,
  assignBusetaAction,
  deleteUserAction,
  toggleUserActiveAction,
  updateUserRoleAction,
} from "@/lib/actions";
import { paginate, parsePage } from "@/lib/pagination";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function ConductoresPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
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
  const team = [...users].sort((a, b) => a.name.localeCompare(b.name));
  const list = paginate(team, parsePage(sp.page), 15);
  const roleOpts = roles.map((r) => ({ id: r.id, name: r.name, home: r.home }));

  return (
    <AppShell user={user}>
      <PageTitle
        title="Personas"
        subtitle="Aprueba conductores, cambia roles, activa o desactiva el acceso."
      />

      {pending.length > 0 ? (
        <section className="mb-6 space-y-3">
          <h2 className="display text-2xl">Por aprobar</h2>
          {pending.map((d) => (
            <ConfirmForm
              key={d.id}
              action={approveDriverAction}
              title={`¿Aprobar a ${d.name}?`}
              message="El conductor podrá avisar proximidad. Asigna buseta si ya la conoces."
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
                <select name="busetaId" defaultValue={d.busetaId ?? ""}>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateUserForm
          busetas={busetas.map((b) => ({ id: b.id, codigo: b.codigo }))}
          roles={roleOpts}
        />

        <div className="card overflow-x-auto p-4 sm:p-5">
          <h2 className="display mb-3 text-xl">Equipo</h2>
          <div className="space-y-4">
            {list.items.map((u) => (
              <div key={u.id} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="text-sm text-muted">{u.phone}</p>
                    <p className="mt-1 text-sm">
                      {roleName(u.roleId, u.role)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={u.approved ? "ok" : "warn"}>
                      {u.approved ? "Aprobado" : "Pendiente"}
                    </Badge>
                    <Badge tone={u.active !== false ? "ok" : "late"}>
                      {u.active !== false ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <form
                  action={updateUserRoleAction as never}
                  className="mt-3 flex flex-wrap items-end gap-2"
                >
                  <input type="hidden" name="id" value={u.id} />
                  <div className="min-w-[10rem] flex-1">
                    <label>Cambiar rol</label>
                    <select name="roleId" defaultValue={u.roleId ?? ""} required>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn btn-ghost text-sm" type="submit">
                    Aplicar rol
                  </button>
                </form>

                {u.role === "driver" ? (
                  <form action={assignBusetaAction} className="mt-3 space-y-2">
                    <input type="hidden" name="id" value={u.id} />
                    <label>Buseta</label>
                    <select name="busetaId" defaultValue={u.busetaId ?? ""}>
                      <option value="">Sin asignar</option>
                      {busetas.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.codigo}
                        </option>
                      ))}
                    </select>
                    <button className="btn btn-ghost w-full text-sm" type="submit">
                      Cambiar buseta
                    </button>
                  </form>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-3">
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
                    <button type="submit" className="text-sm text-signal">
                      {u.active !== false ? "Marcar inactivo" : "Marcar activo"}
                    </button>
                  </ConfirmForm>
                  <ConfirmForm
                    action={deleteUserAction}
                    title={`¿Eliminar a ${u.name}?`}
                    message="Se desactivará el usuario (borrado lógico)."
                    confirmLabel="Eliminar"
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <button className="text-sm text-signal" type="submit">
                      Eliminar
                    </button>
                  </ConfirmForm>
                </div>
              </div>
            ))}
          </div>
          <PaginationNav
            path="/admin/conductores"
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            label="personas"
          />
        </div>
      </div>
    </AppShell>
  );
}
