import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RecorridoForm } from "@/components/recorrido-form";
import { PageTitle } from "@/components/ui";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function NuevoRecorridoPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const puntos = (await repo.listPuntos()).filter((p) => p.active);
  return (
    <AppShell user={user}>
      <PageTitle title="Nuevo recorrido" subtitle="Ordena los puntos de cruce." />
      <div className="card max-w-xl p-4 sm:p-5">
        <RecorridoForm puntos={puntos} />
        <Link href="/admin/recorridos" className="btn btn-ghost mt-3 inline-flex">
          Cancelar
        </Link>
      </div>
    </AppShell>
  );
}
