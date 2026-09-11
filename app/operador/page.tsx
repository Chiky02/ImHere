import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { OperatorPanel } from "@/components/operator-panel";
import { operatorSnapshot } from "@/lib/queries";
import { readSession } from "@/lib/session";

export default async function OperadorPage({
  searchParams,
}: {
  searchParams: Promise<{ punto?: string }>;
}) {
  const user = await readSession();
  if (!user) redirect("/login");
  const { punto } = await searchParams;
  const snap = await operatorSnapshot(user, punto);
  return (
    <AppShell user={user}>
      <PageTitle
        title={snap.selected ? snap.selected.name : "Panel del punto"}
        subtitle="Mantén esta pantalla abierta. Activa el sonido para salir a tiempo."
      />
      <OperatorPanel initial={snap} initialPuntoId={punto} />
    </AppShell>
  );
}
