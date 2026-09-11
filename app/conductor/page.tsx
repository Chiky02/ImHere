import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { DriverHome } from "@/components/driver-home";
import { driverSnapshot } from "@/lib/queries";
import { readSession } from "@/lib/session";

export default async function ConductorPage() {
  const user = await readSession();
  if (!user) redirect("/login");
  const snap = await driverSnapshot(user);
  return (
    <AppShell user={user}>
      <PageTitle title={`Hola, ${user.name.split(" ")[0]}`} />
      <DriverHome
        approved={user.approved}
        busetaCodigo={snap.buseta?.codigo}
        horarioLabel={
          snap.horario
            ? `Sale ${snap.horario.horaSalida} · llega ${snap.horario.horaLlegada} · ${snap.horario.tiempoViajeMin} min`
            : undefined
        }
        steps={snap.steps}
        inbox={snap.inbox}
      />
    </AppShell>
  );
}
