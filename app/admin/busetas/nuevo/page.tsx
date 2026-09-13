import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageTitle } from "@/components/ui";
import { saveBusetaAction } from "@/lib/actions";
import { readSession } from "@/lib/session";

export default async function NuevaBusetaPage() {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  return (
    <AppShell user={user}>
      <PageTitle title="Nueva buseta" subtitle="Solo el número de identificación." />
      <form action={saveBusetaAction as never} className="card max-w-md space-y-3 p-4 sm:p-5">
        <div>
          <label>Número</label>
          <input
            name="codigo"
            required
            placeholder="5012"
            inputMode="numeric"
            className="input-compact w-full max-w-[10rem]"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary" type="submit">
            Crear
          </button>
          <Link href="/admin/busetas" className="btn btn-ghost">
            Cancelar
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
