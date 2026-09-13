"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  avisoProximidadAction,
  markReadAction,
  setSalidaHoyAction,
} from "@/lib/actions";
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

function SubmitLabel({
  alreadySent,
  idleLabel,
}: {
  alreadySent: boolean;
  idleLabel: string;
}) {
  const { pending } = useFormStatus();
  if (pending) return <>Enviando aviso…</>;
  if (alreadySent) return <>Ya avisaste</>;
  return <>{idleLabel}</>;
}

function AvisoButton({
  puntoId,
  canAlert,
  pendingAlerta,
  disabledReason,
}: {
  puntoId: string;
  canAlert: boolean;
  pendingAlerta: boolean;
  disabledReason: string | null;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (
      _prev: { error?: string; ok?: boolean } | null,
      formData: FormData,
    ) => {
      formData.set("puntoId", puntoId);
      try {
        const res = await avisoProximidadAction(formData);
        if (res?.error) return { error: res.error };
        router.refresh();
        return { ok: true };
      } catch {
        return {
          error:
            "No se pudo enviar el aviso. Revisa la conexión e inténtalo de nuevo.",
        };
      }
    },
    null,
  );

  const sent = pendingAlerta || Boolean(state?.ok);
  const blocked = !canAlert || sent;

  return (
    <div className="mt-4">
      <form action={formAction}>
        <button
          type="submit"
          className="btn btn-signal w-full py-3 text-base"
          disabled={blocked}
          title={disabledReason ?? undefined}
        >
          <SubmitLabel
            alreadySent={sent}
            idleLabel="Estoy próximo a llegar"
          />
        </button>
      </form>
      {disabledReason && !sent ? (
        <p className="mt-2 text-sm text-amber-800">{disabledReason}</p>
      ) : null}
      {state?.error ? (
        <p className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-forest">
          Aviso enviado. El operador ya puede verlo.
        </p>
      ) : null}
    </div>
  );
}

export function DriverHome({
  approved,
  busetaCodigo,
  horarioLabel,
  salidaHoy,
  tiempoViajeMin,
  steps,
  inbox,
}: {
  approved: boolean;
  busetaCodigo?: string;
  horarioLabel?: string;
  /** HH:MM declared by driver for today (optional) */
  salidaHoy?: string;
  tiempoViajeMin?: number;
  steps: Step[];
  inbox: Note[];
}) {
  const [inboxPage, setInboxPage] = useState(1);
  const router = useRouter();
  const notes = paginate(inbox, inboxPage, 10);
  const canAlert = approved && Boolean(busetaCodigo);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    if (inboxPage > notes.totalPages) setInboxPage(notes.totalPages);
  }, [inboxPage, notes.totalPages]);

  function disabledReason(step: Step) {
    if (!approved) return "Tu perfil aún no está aprobado.";
    if (!busetaCodigo) return "Aún no tienes buseta asignada.";
    if (step.pendingAlerta) return "Ya enviaste el aviso de este punto.";
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="card p-4 sm:p-5">
        <p className="text-sm text-muted">Tu buseta</p>
        <p className="display text-3xl sm:text-4xl">
          {busetaCodigo ?? "Sin asignar"}
        </p>
        <p className="mt-1 text-muted">
          {horarioLabel ??
            (tiempoViajeMin
              ? `Plantilla de hoy · ~${tiempoViajeMin} min de viaje`
              : "Sin plantilla de recorrido para hoy")}
        </p>
        {!approved ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm">
            El admin aún debe aprobar tu perfil y asignarte buseta.
          </p>
        ) : !busetaCodigo ? (
          <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm">
            Ya estás aprobado, pero aún no tienes buseta asignada.
          </p>
        ) : null}

        {approved && busetaCodigo ? (
          <form action={setSalidaHoyAction as never} className="mt-4 space-y-2 border-t border-line pt-4">
            <label htmlFor="salidaHoy" className="!normal-case !tracking-normal">
              Hora de salida de hoy (opcional)
            </label>
            <p className="text-xs text-muted">
              Si la indicas, el sistema estima la llegada a cada punto. Si no, solo
              usas los avisos de proximidad.
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <input
                id="salidaHoy"
                name="salidaHoy"
                type="time"
                defaultValue={salidaHoy ?? ""}
                className="input-compact"
              />
              <button className="btn btn-primary text-sm" type="submit">
                Guardar salida
              </button>
              {salidaHoy ? (
                <button
                  className="btn btn-ghost text-sm"
                  type="submit"
                  name="clear"
                  value="1"
                >
                  Borrar
                </button>
              ) : null}
            </div>
            {salidaHoy ? (
              <p className="text-sm text-forest">Salida de hoy: {salidaHoy}</p>
            ) : null}
          </form>
        ) : null}

        <div className="mt-4">
          <PushToggle />
        </div>
      </div>

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
                    <p className="mt-1 text-sm">
                      Llegada programada {s.esperado}
                    </p>
                  ) : null}
                </div>
                {s.pendingAlerta ? <Badge tone="warn">Aviso enviado</Badge> : null}
              </div>
              <AvisoButton
                puntoId={s.puntoId}
                canAlert={canAlert}
                pendingAlerta={s.pendingAlerta}
                disabledReason={disabledReason(s)}
              />
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
