import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { deleteBusetaAction, saveBusetaAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function BusetasPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const [busetas, users] = await Promise.all([repo.listBusetas(), repo.listUsers()]);
  const driverOf = (busetaId: string) =>
    users.find((u) => u.role === "driver" && u.busetaId === busetaId);

  return (
    <AppShell user={user}>
      <PageTitle
        title="Busetas"
        subtitle="Cada buseta se identifica por su número. Luego se asocia a un conductor."
      />
      <form
        action={saveBusetaAction}
        className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5"
      >
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor="codigo">Número de buseta</label>
          <input id="codigo" name="codigo" required placeholder="12" inputMode="numeric" />
        </div>
        <button className="btn btn-primary w-full sm:w-auto" type="submit">
          Agregar
        </button>
      </form>
      <div className="space-y-3 sm:hidden">
        {busetas.map((b) => {
          const driver = driverOf(b.id);
          return (
            <article key={b.id} className="card space-y-3 p-4">
              <form action={saveBusetaAction} className="space-y-3">
                <input type="hidden" name="id" value={b.id} />
                <div>
                  <label>Número</label>
                  <input name="codigo" defaultValue={b.codigo} required inputMode="numeric" />
                </div>
                <p className="text-sm text-muted">
                  {driver ? `Conductor: ${driver.name}` : "Sin conductor asignado"}
                </p>
                <button className="btn btn-primary w-full" type="submit">
                  Guardar
                </button>
              </form>
              <form action={deleteBusetaAction}>
                <input type="hidden" name="id" value={b.id} />
                <button className="text-sm text-signal" type="submit">
                  Eliminar
                </button>
              </form>
            </article>
          );
        })}
      </div>
      <div className="card hidden overflow-x-auto p-2 sm:block">
        <table>
          <thead>
            <tr>
              <th>Número</th>
              <th>Conductor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {busetas.map((b) => {
              const driver = driverOf(b.id);
              return (
                <tr key={b.id}>
                  <td>
                    <form action={saveBusetaAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={b.id} />
                      <input
                        name="codigo"
                        defaultValue={b.codigo}
                        className="max-w-28"
                        required
                        inputMode="numeric"
                      />
                      <button className="btn btn-ghost text-sm" type="submit">
                        Guardar
                      </button>
                    </form>
                  </td>
                  <td>{driver?.name ?? "—"}</td>
                  <td>
                    <form action={deleteBusetaAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-sm text-signal" type="submit">
                        Eliminar
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {busetas.length === 0 ? (
          <p className="p-4 text-muted">Aún no hay busetas. Crea la primera arriba.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
