import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaginationNav } from "@/components/pagination";
import { Badge, PageTitle } from "@/components/ui";
import {
  approveDriverAction,
  assignBusetaAction,
  saveUserAction,
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
  const [users, busetas] = await Promise.all([repo.listUsers(), repo.listBusetas()]);
  const drivers = users.filter((u) => u.role === "driver");
  const operators = users.filter((u) => u.role === "operator");
  const pending = drivers.filter((d) => !d.approved);
  const team = [...operators, ...drivers].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const list = paginate(team, parsePage(sp.page), 15);
  return (
    <AppShell user={user}>
      <PageTitle
        title="Personas"
        subtitle="Aprueba conductores, asígnales buseta y gestiona operadores."
      />

      {pending.length > 0 ? (
        <section className="mb-6 space-y-3">
          <h2 className="display text-2xl">Por aprobar</h2>
          {pending.map((d) => (
            <form
              key={d.id}
              action={approveDriverAction}
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
            </form>
          ))}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={saveUserAction} className="card space-y-3 p-4 sm:p-5">
          <h2 className="display text-xl">Nuevo conductor u operador</h2>
          <input type="hidden" name="approved" value="on" />
          <div>
            <label>Nombre</label>
            <input name="name" required />
          </div>
          <div>
            <label>Celular</label>
            <input name="phone" required inputMode="numeric" />
          </div>
          <div>
            <label>Rol</label>
            <select name="role" defaultValue="driver">
              <option value="driver">Conductor</option>
              <option value="operator">Operador de punto</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label>Buseta (si es conductor)</label>
            <select name="busetaId" defaultValue="">
              <option value="">—</option>
              {busetas.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.codigo}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Contraseña inicial</label>
            <input name="password" type="password" minLength={6} required />
          </div>
          <button className="btn btn-primary w-full sm:w-auto" type="submit">
            Crear
          </button>
        </form>

        <div className="card overflow-x-auto p-4 sm:p-5">
          <h2 className="display mb-3 text-xl">Equipo</h2>
          <div className="space-y-4 sm:hidden">
            {list.items.map((u) => (
              <div key={u.id} className="rounded-2xl border border-line p-3">
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-muted">{u.phone}</p>
                <p className="mt-1 text-sm">{u.role}</p>
                <div className="mt-2">
                  <Badge tone={u.approved ? "ok" : "warn"}>
                    {u.approved ? "Activo" : "Pendiente"}
                  </Badge>
                </div>
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
              </div>
            ))}
          </div>
          <table className="hidden sm:table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Celular</th>
                <th>Rol</th>
                <th>Buseta</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.role}</td>
                  <td>
                    {u.role === "driver" ? (
                      <form action={assignBusetaAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <select
                          name="busetaId"
                          defaultValue={u.busetaId ?? ""}
                          className="max-w-28"
                        >
                          <option value="">—</option>
                          {busetas.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.codigo}
                            </option>
                          ))}
                        </select>
                        <button className="text-xs font-semibold text-forest" type="submit">
                          OK
                        </button>
                      </form>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <Badge tone={u.approved ? "ok" : "warn"}>
                      {u.approved ? "Activo" : "Pendiente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
