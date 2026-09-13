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

  const refSalida =
    snap.horario?.horaSalida && snap.horario.horaSalida !== "00:00"
      ? snap.horario.horaSalida
      : undefined;

  return (
    <AppShell user={{ ...user, approved: snap.approved, busetaId: snap.busetaId }}>
      <PageTitle title={`Hola, ${user.name.split(" ")[0]}`} />
      <DriverHome
        approved={snap.approved}
        busetaCodigo={snap.buseta?.codigo}
        horarioLabel={
          snap.recorrido
            ? `Recorrido ${snap.recorrido.name}${
                snap.salidaHoy
                  ? ` · saliste a las ${snap.salidaHoy}`
                  : refSalida
                    ? ` · ref. ${refSalida}`
                    : ""
              }`
            : undefined
        }
        salidaHoy={snap.salidaHoy}
        tiempoViajeMin={snap.horario?.tiempoViajeMin}
        steps={snap.steps}
        activeIndex={snap.activeIndex}
        inbox={snap.inbox}
      />
    </AppShell>
  );
}
