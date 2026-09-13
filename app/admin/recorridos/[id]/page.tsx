import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RecorridoForm } from "@/components/recorrido-form";
import { PageTitle } from "@/components/ui";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function EditRecorridoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const { id } = await params;
  const [recorrido, puntos] = await Promise.all([
    repo.getRecorrido(id),
    repo.listPuntos(),
  ]);
  if (!recorrido) notFound();
  return (
    <AppShell user={user}>
      <PageTitle title={`Editar: ${recorrido.name}`} />
      <div className="card max-w-xl p-4 sm:p-5">
        <RecorridoForm
          puntos={puntos.filter((p) => p.active)}
          recorrido={recorrido}
        />
        <Link href="/admin/recorridos" className="btn btn-ghost mt-3 inline-flex">
          Cancelar
        </Link>
      </div>
    </AppShell>
  );
}
