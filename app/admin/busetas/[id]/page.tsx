import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { saveBusetaAction } from "@/lib/actions";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function EditBusetaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const { id } = await params;
  const buseta = await repo.getBuseta(id);
  if (!buseta) notFound();
  return (
    <AppShell user={user}>
      <PageTitle title={`Editar buseta ${buseta.codigo}`} />
      <form action={saveBusetaAction as never} className="card max-w-md space-y-3 p-4 sm:p-5">
        <input type="hidden" name="id" value={buseta.id} />
        <div>
          <label>Número</label>
          <input
            name="codigo"
            required
            defaultValue={buseta.codigo}
            inputMode="numeric"
            className="input-compact w-full max-w-[10rem]"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
          <Link href="/admin/busetas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
