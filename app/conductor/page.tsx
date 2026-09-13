import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { DriverHome } from "@/components/driver-home";
import { buildSessionUser } from "@/lib/auth-user";
import { driverSnapshot } from "@/lib/queries";
import { readSession, setSessionCookie } from "@/lib/session";

export default async function ConductorPage() {
  const user = await readSession();
  if (!user) redirect("/login");
  const snap = await driverSnapshot(user);

  // Keep cookie in sync when admin approved / assigned buseta while the
  // driver still had an old JWT (very common on iPhone Safari / PWA).
  if (
    snap.dbUser &&
    (user.approved !== snap.dbUser.approved ||
      user.busetaId !== snap.dbUser.busetaId ||
      user.active !== snap.dbUser.active)
  ) {
    await setSessionCookie(await buildSessionUser(snap.dbUser));
  }

  return (
    <AppShell user={{ ...user, approved: snap.approved, busetaId: snap.busetaId }}>
      <PageTitle title={`Hola, ${user.name.split(" ")[0]}`} />
      <DriverHome
        approved={snap.approved}
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
