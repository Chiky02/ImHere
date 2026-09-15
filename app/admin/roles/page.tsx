import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClientActionForm } from "@/components/client-action-form";
import { ConfirmForm } from "@/components/confirm-form";
import { PageTitle } from "@/components/ui";
import { deleteRoleAction, saveRoleAction } from "@/lib/actions";
import {
  PERMISSION_CATALOG,
  permissionsForHome,
  type Permission,
} from "@/lib/permissions";
import * as repo from "@/lib/repo";
import { hasPermission } from "@/lib/permissions";
import { readSession } from "@/lib/session";
import type { Role } from "@/lib/types";

export default async function RolesPage() {
  const user = await readSession();
  if (!user || user.role !== "admin" || !hasPermission(user, "manage.roles")) {
    redirect("/admin");
  }
  const roles = await repo.listRoles();
  const homes: { value: Role; label: string }[] = [
    { value: "admin", label: "Administración" },
    { value: "operator", label: "Operador de punto" },
    { value: "driver", label: "Conductor" },
  ];

  return (
    <AppShell user={user}>
      <PageTitle
        title="Roles y permisos"
        subtitle="Cada rol pertenece a un área (admin, operador o conductor). Solo puede tener permisos de esa área, para no mezclar pantallas."
      />

      <ClientActionForm action={saveRoleAction} className="card mb-6 space-y-4 p-4 sm:p-5">
        <h2 className="display text-xl">Nuevo rol</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" required placeholder="Operador noche" />
          </div>
          <div>
            <label htmlFor="home">Área de trabajo</label>
            <select id="home" name="home" defaultValue="operator" required>
              {homes.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Permisos</legend>
          <p className="mb-2 text-xs text-muted">
            Marca solo permisos del área elegida. Los demás se ignoran al guardar.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(PERMISSION_CATALOG) as Permission[]).map((p) => (
              <label
                key={p}
                className="m-0 flex items-start gap-2 normal-case tracking-normal"
              >
                <input
                  type="checkbox"
                  name="permissions"
                  value={p}
                  className="mt-1 w-auto"
                  defaultChecked={permissionsForHome("operator").includes(p)}
                />
                <span>
                  <span className="font-medium">{PERMISSION_CATALOG[p].label}</span>
                  <span className="block text-xs text-muted">
                    {PERMISSION_CATALOG[p].description} ·{" "}
                    {PERMISSION_CATALOG[p].homes.join(", ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="btn btn-primary" type="submit">
          Crear rol
        </button>
      </ClientActionForm>

      <div className="space-y-4">
        {roles.map((role) => (
          <article key={role.id} className="card space-y-3 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="display text-lg">{role.name}</h3>
                <p className="text-sm text-muted">
                  {role.slug} · área {role.home}
                  {role.isSystem ? " · sistema" : ""}
                </p>
              </div>
              {!role.isSystem ? (
                <ConfirmForm
                  action={deleteRoleAction}
                  title={`¿Eliminar rol ${role.name}?`}
                  message="Solo si no hay usuarios asignados."
                  confirmLabel="Eliminar"
                >
                  <input type="hidden" name="id" value={role.id} />
                  <button type="submit" className="text-sm text-signal">
                    Eliminar
                  </button>
                </ConfirmForm>
              ) : null}
            </div>
            <ClientActionForm action={saveRoleAction} className="space-y-3">
              <input type="hidden" name="id" value={role.id} />
              <input type="hidden" name="home" value={role.home} />
              {!role.isSystem ? (
                <div>
                  <label>Nombre</label>
                  <input name="name" defaultValue={role.name} required />
                </div>
              ) : (
                <input type="hidden" name="name" value={role.name} />
              )}
              <div className="grid gap-2 sm:grid-cols-2">
                {permissionsForHome(role.home).map((p) => (
                  <label
                    key={p}
                    className="m-0 flex items-start gap-2 normal-case tracking-normal"
                  >
                    <input
                      type="checkbox"
                      name="permissions"
                      value={p}
                      className="mt-1 w-auto"
                      defaultChecked={role.permissions.includes(p)}
                    />
                    <span className="text-sm">{PERMISSION_CATALOG[p].label}</span>
                  </label>
                ))}
              </div>
              <button className="btn btn-ghost text-sm" type="submit">
                Guardar permisos
              </button>
            </ClientActionForm>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
