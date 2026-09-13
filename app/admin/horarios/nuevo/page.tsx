import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { HorarioFields } from "@/components/horario-fields";
import { PageTitle } from "@/components/ui";
import { saveHorarioAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function NuevoHorarioPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const [recorridos, busetas, users] = await Promise.all([
    repo.listRecorridos(),
    repo.listBusetas(),
    repo.listUsers(),
  ]);
  const drivers = users.filter((u) => u.role === "driver" && u.approved);

  return (
    <AppShell user={user}>
      <PageTitle
        title="Nueva plantilla"
        subtitle="Recorrido y tiempo. Buseta/conductor/horas son opcionales."
      />
      <form action={saveHorarioAction as never} className="card max-w-xl space-y-3 p-4 sm:p-5">
        <HorarioFields
          recorridos={recorridos}
          busetas={busetas}
          drivers={drivers}
        />
        <div className="flex gap-2">
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
