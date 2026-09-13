import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { saveBusetaAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function NuevaBusetaPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const drivers = (await repo.listUsers()).filter(
    (u) => u.role === "driver" && u.approved,
  );
  return (
    <AppShell user={user}>
      <PageTitle title="Nueva buseta" subtitle="Número e, opcionalmente, conductor." />
      <form action={saveBusetaAction as never} className="card admin-form space-y-4 p-4 sm:p-6">
        <div className="form-grid-compact">
          <div>
            <label>Número</label>
            <input
              name="codigo"
              required
              placeholder="5012"
              inputMode="numeric"
              className="input-compact"
            />
          </div>
          <div>
            <label>Conductor (opcional)</label>
            <select name="driverId" defaultValue="" className="input-compact">
              <option value="">Sin conductor</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.busetaId ? " · otra buseta" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit">
            Crear
          </button>
          <Link href="/admin/busetas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
