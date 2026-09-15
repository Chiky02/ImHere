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
  puntoNumero?: number;
  orden: number;
  tiempoEsperadoMin: number;
  esperado?: string;
  pendingAlerta: boolean;
  done?: boolean;
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
  activeIndex = -1,
  inbox,
}: {
  approved: boolean;
  busetaCodigo?: string;
  horarioLabel?: string;
  /** HH:MM declared by driver for today (optional) */
  salidaHoy?: string;
  tiempoViajeMin?: number;
  steps: Step[];
  activeIndex?: number;
  inbox: Note[];
}) {
  const [inboxPage, setInboxPage] = useState(1);
  const router = useRouter();
  const notes = paginate(inbox, inboxPage, 10);
  const canAlert = approved && Boolean(busetaCodigo);
  const active = activeIndex >= 0 ? steps[activeIndex] : undefined;
  const doneSteps = steps.filter((s) => s.done);
  const upcoming = steps.filter((_, i) => activeIndex >= 0 && i > activeIndex);
  const total = steps.length;
  const position = activeIndex >= 0 ? activeIndex + 1 : total;

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
        ) : active ? (
          <article
            key={`${active.puntoId}-${active.orden}-${activeIndex}`}
            className="card border-2 border-[var(--forest)] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Cruce {position} de {total}
                  {active.puntoNumero != null ? ` · Punto #${active.puntoNumero}` : ""}
                </p>
                <h2 className="display text-2xl">{active.puntoName}</h2>
                <p className="text-sm text-muted">{active.puntoAddress}</p>
                {active.esperado ? (
                  <p className="mt-1 text-sm">
                    Llegada estimada {active.esperado}
                  </p>
                ) : null}
              </div>
              <Badge tone="warn">Activo</Badge>
            </div>
            <AvisoButton
              key={`aviso-${active.puntoId}-${active.orden}-${activeIndex}`}
              puntoId={active.puntoId}
              canAlert={canAlert}
              pendingAlerta={active.pendingAlerta}
              disabledReason={disabledReason(active)}
            />
            <p className="mt-3 text-xs text-muted">
              Al avisar, este cruce pasa a la cola y se habilita el siguiente
              {upcoming.length ? ` (#${upcoming[0].puntoNumero ?? upcoming[0].orden} ${upcoming[0].puntoName})` : ""}.
            </p>
          </article>
        ) : (
          <div className="card p-5 text-forest">
            Completaste los {total} cruce{total === 1 ? "" : "s"} de tu recorrido
            de hoy.
            {total <= 1 ? (
              <p className="mt-2 text-sm text-muted">
                Si deberían haber más paradas, el admin debe agregarlas al
                recorrido (en orden) en Recorridos.
              </p>
            ) : null}
          </div>
        )}

        {doneSteps.length > 0 ? (
          <div className="card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Ya avisados
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {doneSteps.map((s, i) => (
                <li key={`${s.puntoId}-done-${i}`}>
                  ✓ Cruce {steps.indexOf(s) + 1}
                  {s.puntoNumero != null ? ` · #${s.puntoNumero}` : ""}{" "}
                  {s.puntoName}
                  {s.pendingAlerta ? " · en cola del punto" : ""}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {upcoming.length > 0 ? (
          <div className="card p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Después
            </p>
            <ul className="space-y-1 text-sm text-muted">
              {upcoming.map((s, i) => (
                <li key={`${s.puntoId}-up-${i}`}>
                  Cruce {activeIndex + 2 + i}
                  {s.puntoNumero != null ? ` · #${s.puntoNumero}` : ""}{" "}
                  {s.puntoName}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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
