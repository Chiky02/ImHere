import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminListHeader } from "@/components/admin-list-header";
import { AppShell } from "@/components/app-shell";
import { IconEdit, IconTrash } from "@/components/action-icons";
import { ConfirmForm } from "@/components/confirm-form";
import { ListToolbar } from "@/components/list-toolbar";
import { PaginationNav } from "@/components/pagination";
import { deletePuntoAction } from "@/lib/actions";
import { listQuery } from "@/lib/list-query";
import * as repo from "@/lib/repo";
import { readSession } from "@/lib/session";

export default async function PuntosPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>;
}) {
  const user = await readSession();
  if (!user || user.role !== "admin") redirect("/login");
  const sp = await searchParams;
  const [puntos, users] = await Promise.all([repo.listPuntos(), repo.listUsers()]);
  const operators = users.filter(
    (u) => (u.role === "operator" || u.role === "admin") && u.approved,
  );
  const rows = puntos.map((p) => ({
    ...p,
    operatorNames: operators
      .filter((op) => p.operatorIds.includes(op.id) || op.puntoId === p.id)
      .map((op) => op.name)
      .join(", "),
  }));
  const list = listQuery(rows, {
    q: sp.q,
    sort: sp.sort as "asc" | "desc" | undefined,
    page: sp.page,
    pageSize: 12,
    fields: (p) => [String(p.numero ?? ""), p.name, p.address, p.operatorNames],
    sortKey: (p) => String(p.numero ?? p.name).padStart(4, "0"),
  });

  return (
    <AppShell user={user}>
      <AdminListHeader
        title="Puntos"
        subtitle="Controles de cruce numerados. Crear y editar en pantalla aparte."
        createHref="/admin/puntos/nuevo"
        createLabel="Nuevo punto"
      />

      <div className="card p-4 sm:p-5">
        <ListToolbar path="/admin/puntos" q={list.q} sort={list.sort} placeholder="Buscar punto…" />
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="w-16">Nº</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Gestores</th>
                <th className="w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {list.items.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.numero ?? "—"}</td>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-sm text-muted">{p.address || "—"}</td>
                  <td className="text-sm">{p.operatorNames || "—"}</td>
                  <td>
                    <div className="table-actions">
                      <Link
                        href={`/admin/puntos/${p.id}`}
                        className="icon-btn"
                        title="Editar"
                      >
                        <IconEdit />
                      </Link>
                      <ConfirmForm
                        action={deletePuntoAction}
                        title={`¿Archivar ${p.name}?`}
                        message="El punto quedará archivado (borrado lógico)."
                        confirmLabel="Archivar"
                      >
                        <input type="hidden" name="id" value={p.id} />
                        <button type="submit" className="icon-btn danger" title="Eliminar">
                          <IconTrash />
                        </button>
                      </ConfirmForm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationNav
          path="/admin/puntos"
          page={list.page}
          totalPages={list.totalPages}
          total={list.total}
          params={{ q: list.q || undefined, sort: list.sort === "desc" ? "desc" : undefined }}
          label="puntos"
        />
      </div>
    </AppShell>
  );
}
