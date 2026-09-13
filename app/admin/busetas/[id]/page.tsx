import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { saveBusetaAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function EditBusetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const { id } = await params;
  const [buseta, users] = await Promise.all([repo.getBuseta(id), repo.listUsers()]);
  if (!buseta) notFound();
  const drivers = users.filter((u) => u.role === "driver" && u.approved);
  const currentDriverId = drivers.find((d) => d.busetaId === buseta.id)?.id ?? "";

  return (
    <AppShell user={user}>
      <PageTitle
        title={`Editar buseta ${buseta.codigo}`}
        subtitle="Cambia el número o el conductor asignado."
      />
      <form action={saveBusetaAction as never} className="card admin-form space-y-4 p-4 sm:p-6">
        <input type="hidden" name="id" value={buseta.id} />
        <div className="form-grid-compact">
          <div>
            <label>Número</label>
            <input
              name="codigo"
              required
              defaultValue={buseta.codigo}
              inputMode="numeric"
              className="input-compact"
            />
          </div>
          <div>
            <label>Conductor</label>
            <select
              name="driverId"
              defaultValue={currentDriverId}
              className="input-compact"
            >
              <option value="">Sin conductor</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.busetaId && d.busetaId !== buseta.id ? " · otra buseta" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
          <Link href="/admin/busetas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
