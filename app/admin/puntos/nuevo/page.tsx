import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { savePuntoAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function NuevoPuntoPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const [puntos, users] = await Promise.all([repo.listPuntos(), repo.listUsers()]);
  const operators = users.filter(
    (u) => (u.role === "operator" || u.role === "admin") && u.approved,
  );
  const nextNumero =
    puntos.reduce((max, p) => Math.max(max, p.numero ?? 0), 0) + 1;

  return (
    <AppShell user={user}>
      <PageTitle title="Nuevo punto" subtitle="Número de cruce y gestores del panel." />
      <form action={savePuntoAction as never} className="card admin-form space-y-4 p-4 sm:p-6">
        <div className="form-grid-compact">
          <div>
            <label>Número</label>
            <input
              name="numero"
              type="number"
              min={1}
              defaultValue={nextNumero}
              required
              className="input-compact"
            />
          </div>
          <div>
            <label>Nombre</label>
            <input name="name" required placeholder="El Recreo" className="input-compact" />
          </div>
          <div className="sm:col-span-2">
            <label>Dirección</label>
            <input name="address" placeholder="Referencia" className="input-compact" />
          </div>
        </div>
        <div>
          <label>Operadores / admin gestores</label>
          <div className="mt-1 flex flex-wrap gap-3">
            {operators.map((op) => (
              <label key={op.id} className="m-0 flex items-center gap-2 normal-case tracking-normal">
                <input type="checkbox" name="operatorIds" value={op.id} className="w-auto" />
                {op.name}
              </label>
            ))}
          </div>
        </div>
        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit">
            Crear punto
          </button>
          <Link href="/admin/puntos" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
