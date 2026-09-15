import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { ClientActionForm } from "@/components/client-action-form";
import { ConfirmForm } from "@/components/confirm-form";
import {
  assignBusetaAction,
  assignPuntoAction,
  saveUserAction,
  toggleUserActiveAction,
  updateUserRoleAction,
} from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function EditPersonaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const { id } = await params;
  const [person, busetas, puntos, roles] = await Promise.all([
    repo.getUserById(id),
    repo.listBusetas(),
    repo.listPuntos(),
    repo.listRoles(),
  ]);
  if (!person) notFound();

  return (
    <AppShell user={user}>
      <PageTitle title={`Editar: ${person.name}`} />
      <div className="stack-cards wide">
        <ClientActionForm action={saveUserAction} className="card admin-form space-y-3 p-4 sm:p-6">
          <input type="hidden" name="id" value={person.id} />
          <input type="hidden" name="roleId" value={person.roleId ?? ""} />
          <input type="hidden" name="approved" value={person.approved ? "on" : "off"} />
          <input type="hidden" name="active" value={person.active !== false ? "on" : "off"} />
          <div className="form-grid-compact">
            <div>
              <label>Nombre</label>
              <input
                name="name"
                defaultValue={person.name}
                required
                className="input-compact"
              />
            </div>
            <div>
              <label>Celular</label>
              <input
                name="phone"
                defaultValue={person.phone}
                required
                className="input-compact"
              />
            </div>
            <div>
              <label>Nueva contraseña (opcional)</label>
              <input name="password" type="password" minLength={6} className="input-compact" />
            </div>
            <div>
              <label>Confirmar contraseña</label>
              <input
                name="passwordConfirm"
                type="password"
                minLength={6}
                className="input-compact"
              />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">
            Guardar datos
          </button>
        </ClientActionForm>

        <ClientActionForm action={updateUserRoleAction} className="card admin-form space-y-3 p-4 sm:p-6">
          <h2 className="display text-lg">Rol</h2>
          <input type="hidden" name="id" value={person.id} />
          <select
            name="roleId"
            defaultValue={person.roleId ?? ""}
            required
            className="input-compact"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <button className="btn btn-ghost" type="submit">
            Aplicar rol
          </button>
        </ClientActionForm>

        {person.role === "driver" ? (
          <ClientActionForm action={assignBusetaAction} className="card admin-form space-y-3 p-4 sm:p-6">
            <h2 className="display text-lg">Buseta</h2>
            <p className="text-sm text-muted">
              Si otro conductor la tenía, queda liberado al guardar.
            </p>
            <input type="hidden" name="id" value={person.id} />
            <select
              name="busetaId"
              defaultValue={person.busetaId ?? ""}
              className="input-compact"
            >
              <option value="">Sin asignar</option>
              {busetas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.codigo}
                </option>
              ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Asignar buseta
            </button>
          </ClientActionForm>
        ) : null}

        {person.role === "operator" || person.role === "admin" ? (
          <ClientActionForm action={assignPuntoAction} className="card admin-form space-y-3 p-4 sm:p-6">
            <h2 className="display text-lg">Punto que gestiona</h2>
            <p className="text-sm text-muted">
              Fija el panel de punto sin tener que elegirlo cada vez.
            </p>
            <input type="hidden" name="id" value={person.id} />
            <select
              name="puntoId"
              defaultValue={person.puntoId ?? ""}
              className="input-compact"
            >
              <option value="">Sin asignar</option>
              {puntos
                .filter((p) => p.active)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.numero != null ? `#${p.numero} · ` : ""}
                    {p.name}
                  </option>
                ))}
            </select>
            <button className="btn btn-primary" type="submit">
              Asignar punto
            </button>
          </ClientActionForm>
        ) : null}

        <ConfirmForm
          action={toggleUserActiveAction}
          title={
            person.active !== false
              ? `¿Desactivar a ${person.name}?`
              : `¿Activar a ${person.name}?`
          }
          message={
            person.active !== false
              ? "No podrá iniciar sesión."
              : "Recuperará el acceso."
          }
          confirmLabel={person.active !== false ? "Desactivar" : "Activar"}
          tone={person.active !== false ? "danger" : "default"}
          className="card p-4"
        >
          <input type="hidden" name="id" value={person.id} />
          <input
            type="hidden"
            name="active"
            value={person.active !== false ? "off" : "on"}
          />
          <button type="submit" className="btn btn-ghost text-signal">
            {person.active !== false ? "Marcar inactivo" : "Marcar activo"}
          </button>
        </ConfirmForm>

        <Link href="/admin/conductores" className="btn btn-ghost self-start">
          Volver al listado
        </Link>
      </div>
    </AppShell>
  );
}
