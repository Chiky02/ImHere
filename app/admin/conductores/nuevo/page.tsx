import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CreateUserForm } from "@/components/create-user-form";
import { PageTitle } from "@/components/ui";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function NuevaPersonaPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const [busetas, puntos, roles] = await Promise.all([
    repo.listBusetas(),
    repo.listPuntos(),
    repo.listRoles(),
  ]);

  return (
    <AppShell user={user}>
      <PageTitle title="Nueva persona" subtitle="Rol, buseta o punto según corresponda." />
      <div className="max-w-xl">
        <CreateUserForm
          busetas={busetas.map((b) => ({ id: b.id, codigo: b.codigo }))}
          puntos={puntos
            .filter((p) => p.active)
            .map((p) => ({
              id: p.id,
              label: p.numero != null ? `#${p.numero} ${p.name}` : p.name,
            }))}
          roles={roles.map((r) => ({ id: r.id, name: r.name, home: r.home }))}
        />
        <Link href="/admin/conductores" className="btn btn-ghost mt-3 inline-flex">
          Cancelar
        </Link>
      </div>
    </AppShell>
  );
}
