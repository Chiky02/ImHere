import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PaginationNav } from "@/components/pagination";
import { PageTitle } from "@/components/ui";
import { RecorridoForm } from "@/components/recorrido-form";
import { deleteRecorridoAction } from "@/lib/actions";
import { paginate, parsePage } from "@/lib/pagination";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function RecorridosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [recorridos, puntos] = await Promise.all([
    repo.listRecorridos(),
    repo.listPuntos(),
  ]);
  const nameOf = (id: string) => puntos.find((p) => p.id === id)?.name ?? id;
  const list = paginate(
    [...recorridos].sort((a, b) => a.name.localeCompare(b.name)),
    parsePage(sp.page),
    8,
  );
  return (
    <AppShell user={user}>
      <PageTitle
        title="Recorridos"
        subtitle="Un recorrido es la secuencia de puntos donde los conductores avisan."
      />
      <RecorridoForm puntos={puntos.filter((p) => p.active)} />
      <div className="mt-6 space-y-4">
        {list.items.map((r) => (
          <div key={r.id} className="space-y-2">
            <p className="text-sm text-muted">
              {r.puntos
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((p) => `${nameOf(p.puntoId)} (${p.tiempoEsperadoMin} min)`)
                .join(" → ") || "Sin puntos"}
            </p>
            <RecorridoForm
              puntos={puntos.filter((p) => p.active)}
              recorrido={r}
            />
            <form action={deleteRecorridoAction}>
              <input type="hidden" name="id" value={r.id} />
              <button className="text-sm text-signal" type="submit">
                Eliminar {r.name}
              </button>
            </form>
          </div>
        ))}
      </div>
      <PaginationNav
        path="/admin/recorridos"
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        label="recorridos"
      />
    </AppShell>
  );
}
