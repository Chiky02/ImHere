import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PasswordForm } from "@/components/password-form";
import { PageTitle } from "@/components/ui";
import { setOwnBusetaAction, updateProfileAction } from "@/lib/actions";
import { hasPermission } from "@/lib/permissions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function CuentaPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = await repo.getUserById(session.id);
  if (!user) redirect("/login");
  const busetas = await repo.listBusetas();
  const buseta = user.busetaId
    ? busetas.find((b) => b.id === user.busetaId)
    : undefined;
  const canPickBuseta =
    user.role === "driver" && hasPermission(session, "conductor.buseta_self");

  return (
    <AppShell user={session}>
      <PageTitle title="Tu cuenta" subtitle="Datos personales, buseta y contraseña." />
      <div className="stack-cards wide">
        <form action={updateProfileAction} className="card space-y-4 p-4 sm:p-6">
          <h2 className="display text-xl">Datos</h2>
          <div className="form-grid-compact">
            <div>
              <label htmlFor="name">Nombre</label>
              <input
                id="name"
                name="name"
                defaultValue={user.name}
                required
                className="input-compact w-full"
              />
            </div>
            <div>
              <label htmlFor="phone">Celular</label>
              <input
                id="phone"
                name="phone"
                defaultValue={user.phone}
                required
                className="input-compact w-full"
              />
            </div>
          </div>
          {user.role === "driver" && !canPickBuseta ? (
            <div>
              <label>Buseta asignada</label>
              <p className="rounded-xl border border-line bg-stone-50 px-3 py-2.5 text-sm">
                {buseta
                  ? `Número ${buseta.codigo}`
                  : "Pendiente: el admin la asigna al aprobarte"}
              </p>
            </div>
          ) : null}
          <p className="text-sm text-muted">
            Rol: {session.roleName ?? session.role}
          </p>
          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Guardar datos
          </button>
        </form>

        {canPickBuseta ? (
          <form
            action={setOwnBusetaAction as never}
            className="card space-y-4 p-4 sm:p-6"
          >
            <h2 className="display text-xl">Buseta que estás usando</h2>
            <p className="text-sm text-muted">
              Si otro conductor la tenía, queda liberado al guardar. El operador
              verá este número en tus avisos.
            </p>
            <div>
              <label htmlFor="busetaId">Buseta</label>
              <select
                id="busetaId"
                name="busetaId"
                defaultValue={user.busetaId ?? ""}
                required
                className="input-compact w-full max-w-xs"
              >
                <option value="">Selecciona…</option>
                {busetas
                  .filter((b) => b.active)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.codigo}
                    </option>
                  ))}
              </select>
            </div>
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Guardar buseta
            </button>
          </form>
        ) : null}

        <div className={canPickBuseta ? "md:col-span-2" : undefined}>
          <PasswordForm />
        </div>
      </div>
    </AppShell>
  );
}
