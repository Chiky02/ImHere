import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PasswordForm } from "@/components/password-form";
import { PageTitle } from "@/components/ui";
import { updateProfileAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function CuentaPage() {
  const session = await readSession();
  if (!session) redirect("/login");
  const user = await repo.getUserById(session.id);
  if (!user) redirect("/login");
  const buseta = user.busetaId ? await repo.getBuseta(user.busetaId) : undefined;

  return (
    <AppShell user={session}>
      <PageTitle title="Tu cuenta" subtitle="Datos personales y contraseña." />
      <div className="space-y-5">
        <form action={updateProfileAction} className="card max-w-lg space-y-4 p-4 sm:p-6">
          <h2 className="display text-xl">Datos</h2>
          <div>
            <label htmlFor="name">Nombre</label>
            <input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div>
            <label htmlFor="phone">Celular</label>
            <input id="phone" name="phone" defaultValue={user.phone} required />
          </div>
          {user.role === "driver" ? (
            <div>
              <label>Buseta asignada</label>
              <p className="rounded-xl border border-line bg-stone-50 px-3 py-2.5 text-sm">
                {buseta
                  ? `Número ${buseta.codigo}`
                  : "Pendiente: el admin la asigna al aprobarte"}
              </p>
            </div>
          ) : null}
          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Guardar datos
          </button>
        </form>
        <PasswordForm />
      </div>
    </AppShell>
  );
}
