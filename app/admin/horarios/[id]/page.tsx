import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HorarioFields } from "@/components/horario-fields";
import { PageTitle } from "@/components/ui";
import { saveHorarioAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function EditHorarioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const { id } = await params;
  const [horarios, recorridos, busetas, users] = await Promise.all([
    repo.listHorarios(),
    repo.listRecorridos(),
    repo.listBusetas(),
    repo.listUsers(),
  ]);
  const horario = horarios.find((h) => h.id === id);
  if (!horario) notFound();
  const drivers = users.filter((u) => u.role === "driver" && u.approved);

  return (
    <AppShell user={user}>
      <PageTitle title="Editar plantilla" />
      <form action={saveHorarioAction as never} className="card admin-form space-y-4 p-4 sm:p-6">
        <input type="hidden" name="id" value={horario.id} />
        <HorarioFields
          recorridos={recorridos}
          busetas={busetas}
          drivers={drivers}
          defaults={horario}
        />
        <div className="admin-form-actions">
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
          <Link href="/admin/horarios" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
