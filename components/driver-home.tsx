"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { avisoProximidadAction, markReadAction } from "@/lib/actions";
import { paginate } from "@/lib/pagination";
import { ClientPagination } from "./pagination";
import { Badge } from "./ui";
import { PushToggle } from "./push-toggle";

type Step = {
  puntoId: string;
  puntoName: string;
  puntoAddress: string;
  orden: number;
  tiempoEsperadoMin: number;
  esperado?: string;
  pendingAlerta: boolean;
};

type Note = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

export function DriverHome({
  approved,
  busetaCodigo,
  horarioLabel,
  steps,
  inbox,
}: {
  approved: boolean;
  busetaCodigo?: string;
  horarioLabel?: string;
  steps: Step[];
  inbox: Note[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inboxPage, setInboxPage] = useState(1);
  const router = useRouter();
  const notes = paginate(inbox, inboxPage, 10);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (inboxPage > notes.totalPages) setInboxPage(notes.totalPages);
  }, [inboxPage, notes.totalPages]);

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <p className="text-sm text-muted">Tu buseta</p>
        <p className="display text-3xl sm:text-4xl">{busetaCodigo ?? "Sin asignar"}</p>
        <p className="mt-1 text-muted">{horarioLabel ?? "Sin horario para hoy"}</p>
        {!approved ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm">
            El admin aún debe aprobar tu perfil y asignarte buseta.
          </p>
        ) : !busetaCodigo ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm">
            Ya estás aprobado, pero aún no tienes buseta asignada.
          </p>
        ) : null}
        <div className="mt-4">
          <PushToggle />
        </div>
      </div>

      {error ? <p className="text-sm text-signal">{error}</p> : null}

      <div className="space-y-3">
        {steps.length === 0 ? (
          <div className="card p-5 text-muted">
            No hay puntos en tu recorrido. El admin debe armar la ruta.
          </div>
        ) : (
          steps.map((s) => (
            <article key={s.puntoId} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Punto {s.orden}
                  </p>
                  <h2 className="display text-2xl">{s.puntoName}</h2>
                  <p className="text-sm text-muted">{s.puntoAddress}</p>
                  {s.esperado ? (
                    <p className="mt-1 text-sm">Llegada programada {s.esperado}</p>
                  ) : null}
                </div>
                {s.pendingAlerta ? <Badge tone="warn">Aviso enviado</Badge> : null}
              </div>
              <button
                className="btn btn-signal mt-4 w-full py-3 text-base"
                disabled={!approved || s.pendingAlerta || pending}
                onClick={() =>
                  start(async () => {
                    setError(null);
                    const fd = new FormData();
                    fd.set("puntoId", s.puntoId);
                    const res = await avisoProximidadAction(fd);
                    if (res?.error) setError(res.error);
                    else router.refresh();
                  })
                }
              >
                {s.pendingAlerta ? "Ya avisaste" : "Estoy próximo a llegar"}
              </button>
            </article>
          ))
        )}
      </div>

      <section className="card p-5">
        <h2 className="display mb-3 text-2xl">El siguiente ya cruzó</h2>
        <p className="mb-3 text-sm text-muted">
          Solo ves al bus que llega detrás de ti en cada punto. El listado
          completo es del admin.
        </p>
        {notes.total === 0 ? (
          <p className="text-muted">Sin avisos todavía.</p>
        ) : (
          <>
            <ul className="space-y-3">
              {notes.items.map((n) => (
                <li key={n.id} className="rounded-2xl border border-line p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{n.title}</p>
                    {!n.read ? <Badge tone="warn">Nuevo</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm">{n.body}</p>
                  {!n.read ? (
                    <form
                      action={async (fd) => {
                        fd.set("id", n.id);
                        await markReadAction(fd);
                      }}
                      className="mt-2"
                    >
                      <button className="text-xs font-semibold text-forest underline">
                        Marcar leído
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
            <ClientPagination
              page={notes.page}
              totalPages={notes.totalPages}
              total={notes.total}
              onPageChange={setInboxPage}
              label="avisos"
            />
          </>
        )}
      </section>
    </div>
  );
}
