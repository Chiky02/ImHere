"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { registrarLlegadaAction, registrarSalidaAction } from "@/lib/actions";
import { AlertPlayer } from "@/lib/alert-sound";
import { paginate } from "@/lib/pagination";
import type { operatorSnapshot } from "@/lib/queries";
import { ClientPagination } from "./pagination";
import { Badge } from "./ui";

type Snapshot = Awaited<ReturnType<typeof operatorSnapshot>>;

export function OperatorPanel({
  initial,
  initialPuntoId,
}: {
  initial: Snapshot;
  initialPuntoId?: string;
}) {
  const [data, setData] = useState(initial);
  const [puntoId, setPuntoId] = useState(
    initialPuntoId || initial.selected?.id || "",
  );
  const [soundOn, setSoundOn] = useState(false);
  const [ringing, setRinging] = useState(false);
  const [alertSrc, setAlertSrc] = useState("/sounds/alerta.wav");
  const [pending, start] = useTransition();
  const [bitacoraPage, setBitacoraPage] = useState(1);
  const playerRef = useRef<AlertPlayer | null>(null);
  const seen = useRef(new Set(initial.incoming.map((a) => a.id)));
  const primed = useRef(false);

  if (!playerRef.current) playerRef.current = new AlertPlayer();

  useEffect(() => {
    let alive = true;
    fetch("/api/config/alert-sound", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg: { alertSoundUrl?: string } | null) => {
        if (!alive || !cfg?.alertSoundUrl) return;
        setAlertSrc(cfg.alertSoundUrl);
        playerRef.current?.setSource(cfg.alertSoundUrl);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  function stopRing() {
    playerRef.current?.stop();
    setRinging(false);
  }

  async function startRing() {
    const ok = await playerRef.current?.ring({ loop: true, src: alertSrc });
    if (ok) setRinging(true);
  }

  useEffect(() => {
    primed.current = false;
    seen.current = new Set();
    setBitacoraPage(1);
    stopRing();
    let alive = true;
    const tick = async () => {
      const res = await fetch(
        `/api/operador/estado?puntoId=${encodeURIComponent(puntoId)}`,
        { cache: "no-store" },
      );
      if (!res.ok || !alive) return;
      const next = (await res.json()) as Snapshot;
      if (!primed.current) {
        next.incoming.forEach((a) => seen.current.add(a.id));
        primed.current = true;
      } else {
        const newcomers = next.incoming.filter((a) => !seen.current.has(a.id));
        if (newcomers.length && playerRef.current?.isUnlocked) {
          void startRing();
        }
        next.incoming.forEach((a) => seen.current.add(a.id));
      }
      if (next.incoming.length === 0) stopRing();
      setData(next);
    };
    const id = setInterval(tick, 1500);
    tick();
    return () => {
      alive = false;
      clearInterval(id);
      stopRing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al cambiar de punto
  }, [puntoId]);

  async function unlock() {
    const ok = await playerRef.current?.unlock(alertSrc);
    setSoundOn(Boolean(ok));
  }

  const bitacora = paginate(data.bitacora, bitacoraPage, 10);

  useEffect(() => {
    if (bitacoraPage > bitacora.totalPages) setBitacoraPage(bitacora.totalPages);
  }, [bitacoraPage, bitacora.totalPages]);

  if (!data.selected && data.myPuntos.length === 0) {
    return (
      <div className="card p-6">
        No tienes puntos asignados. Pide al admin que te vincule a un control.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {ringing ? (
        <div className="flex flex-col gap-3 rounded-2xl border-2 border-signal bg-orange-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between animate-pulse">
          <div>
            <p className="display text-xl text-signal sm:text-2xl">
              ¡Bus en camino!
            </p>
            <p className="text-sm text-ink">
              Suena la alerta. Sal a registrar o silénciala.
            </p>
          </div>
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={stopRing}>
            Silenciar
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="m-0 w-auto">Punto</label>
        <select
          className="w-full sm:max-w-xs"
          value={puntoId}
          onChange={(e) => setPuntoId(e.target.value)}
        >
          {data.myPuntos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={
            soundOn ? "btn btn-ghost w-full sm:w-auto" : "btn btn-signal w-full sm:w-auto"
          }
          onClick={unlock}
        >
          {soundOn ? "Sonido activo" : "Activar sonido"}
        </button>
        {soundOn && ringing ? (
          <button type="button" className="btn btn-ghost w-full sm:w-auto" onClick={stopRing}>
            Silenciar ahora
          </button>
        ) : null}
      </div>

      {!soundOn ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Pulsa <strong>Activar sonido</strong> una vez. Sin eso el navegador
          bloquea la alarma. El admin configura el audio en{" "}
          <strong>Config</strong>.
        </p>
      ) : null}

      <section className="card p-4 sm:p-5">
        <h2 className="display mb-3 text-xl sm:text-2xl">En camino</h2>
        {data.incoming.length === 0 ? (
          <p className="text-muted">Nadie ha avisado todavía en este punto.</p>
        ) : (
          <ul className="space-y-3">
            {data.incoming.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-orange-50/70 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold sm:text-lg">
                    Buseta {a.busetaCodigo} · {a.conductorName}
                  </p>
                  <p className="text-sm text-muted">
                    Aviso{" "}
                    {new Date(a.createdAt).toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {a.esperado ? ` · esperado ${a.esperado}` : ""}
                  </p>
                </div>
                <button
                  className="btn btn-signal w-full sm:w-auto"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const fd = new FormData();
                      fd.set("alertaId", a.id);
                      fd.set("conductorId", a.conductorId);
                      fd.set("puntoId", a.puntoId);
                      fd.set("busetaId", a.busetaId);
                      if (a.horarioId) fd.set("horarioId", a.horarioId);
                      await registrarLlegadaAction(fd);
                      stopRing();
                    })
                  }
                >
                  Registrar llegada
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="display mb-3 text-2xl">En el punto (falta salida)</h2>
        {data.waitingSalida.length === 0 ? (
          <p className="text-muted">Ningún bus detenido ahora.</p>
        ) : (
          <ul className="space-y-3">
            {data.waitingSalida.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-4"
              >
                <div>
                  <p className="font-semibold">
                    Buseta {r.busetaCodigo} · {r.conductorName}
                  </p>
                  <p className="text-sm text-muted">Llegó {r.llegadaHora}</p>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const fd = new FormData();
                      fd.set("registroId", r.id);
                      await registrarSalidaAction(fd);
                    })
                  }
                >
                  Registrar salida
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card overflow-x-auto p-4 sm:p-5">
        <h2 className="display mb-3 text-xl sm:text-2xl">Bitácora de hoy</h2>
        <table>
          <thead>
            <tr>
              <th>Buseta</th>
              <th>Conductor</th>
              <th>Llegada</th>
              <th>Salida</th>
              <th>Puntualidad</th>
            </tr>
          </thead>
          <tbody>
            {bitacora.items.map((r) => (
              <tr key={r.id}>
                <td>{r.busetaCodigo}</td>
                <td>{r.conductorName}</td>
                <td>{r.llegadaHora}</td>
                <td>{r.salidaHora ?? "—"}</td>
                <td>
                  {r.puntualidad ? (
                    <Badge
                      tone={
                        r.puntualidad === "a_tiempo"
                          ? "ok"
                          : r.puntualidad === "tarde"
                            ? "late"
                            : "warn"
                      }
                    >
                      {r.puntualidad.replace("_", " ")}
                      {r.esperado ? ` (prog. ${r.esperado})` : ""}
                    </Badge>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <ClientPagination
          page={bitacora.page}
          totalPages={bitacora.totalPages}
          total={bitacora.total}
          onPageChange={setBitacoraPage}
          label="registros"
        />
      </section>
    </div>
  );
}
