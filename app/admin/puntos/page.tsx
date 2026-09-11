import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import { deletePuntoAction, savePuntoAction } from "@/lib/actions";
import { paginate, parsePage } from "@/lib/pagination";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function PuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [puntos, users] = await Promise.all([repo.listPuntos(), repo.listUsers()]);
  const operators = users.filter((u) => u.role === "operator" && u.approved);
  const list = paginate(
    [...puntos].sort((a, b) => a.name.localeCompare(b.name)),
    parsePage(sp.page),
    10,
  );
  return (
    <AppShell user={user}>
      <PageTitle
        title="Puntos"
        subtitle="Cada control del recorrido. Asigna quién atiende el negocio."
      />
      <form action={savePuntoAction} className="card mb-6 grid gap-3 p-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="display text-xl">Nuevo punto</h2>
        </div>
        <div>
          <label>Nombre</label>
          <input name="name" required placeholder="El Recreo" />
        </div>
        <div>
          <label>Dirección o referencia</label>
          <input name="address" placeholder="Cruce del negocio" />
        </div>
        <div className="md:col-span-2">
          <label>Operadores</label>
          <div className="flex flex-wrap gap-3">
            {operators.map((op) => (
              <label key={op.id} className="m-0 flex items-center gap-2 normal-case tracking-normal">
                <input type="checkbox" name="operatorIds" value={op.id} className="w-auto" />
                {op.name}
              </label>
            ))}
            {operators.length === 0 ? (
              <span className="text-sm text-muted">Crea un operador en Personas.</span>
            ) : null}
          </div>
        </div>
        <div>
          <button className="btn btn-primary" type="submit">
            Guardar punto
          </button>
        </div>
      </form>
      <div className="space-y-3">
        {list.items.map((p) => (
          <article key={p.id} className="card p-5">
            <form action={savePuntoAction} className="grid gap-3 md:grid-cols-2">
              <input type="hidden" name="id" value={p.id} />
              <div>
                <label>Nombre</label>
                <input name="name" defaultValue={p.name} required />
              </div>
              <div>
                <label>Dirección</label>
                <input name="address" defaultValue={p.address} />
              </div>
              <div className="md:col-span-2">
                <label>Operadores</label>
                <div className="flex flex-wrap gap-3">
                  {operators.map((op) => (
                    <label
                      key={op.id}
                      className="m-0 flex items-center gap-2 normal-case tracking-normal"
                    >
                      <input
                        type="checkbox"
                        name="operatorIds"
                        value={op.id}
                        defaultChecked={p.operatorIds.includes(op.id)}
                        className="w-auto"
                      />
                      {op.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit">
                  Actualizar
                </button>
              </div>
            </form>
            <form action={deletePuntoAction} className="mt-2">
              <input type="hidden" name="id" value={p.id} />
              <button className="text-sm text-signal" type="submit">
                Eliminar
              </button>
            </form>
          </article>
        ))}
      </div>
      <PaginationNav
        path="/admin/puntos"
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        label="puntos"
      />
    </AppShell>
  );
}
