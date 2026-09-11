import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { adminDashboard } from "@/lib/queries";
import { readSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase";

export default async function AdminHome() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const dash = await adminDashboard();
  const cards = [
    { href: "/admin/puntos", label: "Puntos", value: dash.puntos },
    { href: "/admin/busetas", label: "Busetas", value: dash.busetas },
    { href: "/admin/conductores", label: "Conductores", value: dash.conductores },
    { href: "/admin/historial", label: "Cruces hoy", value: dash.crucesHoy },
  ];
  return (
    <AppShell user={user}>
      <PageTitle
        title="Tablero"
        subtitle="Listado completo de cruces, puntos y equipos."
      />
      {!isSupabaseConfigured() ? (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          Modo local (archivo JSON). En Vercel configura Supabase para persistir
          entre instancias. Ver README.
        </p>
      ) : null}
      {dash.pendientes > 0 ? (
        <p className="mb-4 rounded-2xl bg-orange-50 px-4 py-3 text-sm">
          Hay {dash.pendientes} conductor(es) por aprobar.{" "}
          <Link href="/admin/conductores" className="font-semibold text-forest">
            Revisar
          </Link>
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href} className="card p-5">
            <p className="text-xs uppercase tracking-wide text-muted">{c.label}</p>
            <p className="display mt-1 text-4xl">{c.value}</p>
          </Link>
        ))}
      </div>
      <section className="card mt-6 overflow-x-auto p-5">
        <h2 className="display mb-3 text-2xl">Cruces de hoy</h2>
        {dash.recientes.length === 0 ? (
          <p className="text-muted">Aún no hay registros hoy.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Punto</th>
                <th>Buseta</th>
                <th>Conductor</th>
                <th>Llegada</th>
              </tr>
            </thead>
            <tbody>
              {dash.recientes.map((r) => (
                <tr key={r.id}>
                  <td>{r.puntoName}</td>
                  <td>{r.busetaCodigo}</td>
                  <td>{r.conductorName}</td>
                  <td>{r.llegadaHora}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppShell>
  );
}
