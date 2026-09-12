"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  registrarLlegadaAction,
  registrarSalidaAction,
  updateRegistroCruceAction,
} from "@/lib/actions";
import { AlertPlayer } from "@/lib/alert-sound";
import { paginate } from "@/lib/pagination";
import type { operatorSnapshot } from "@/lib/queries";
import { ClientPagination } from "./pagination";
import { Badge } from "./ui";

type Snapshot = Awaited<ReturnType<typeof operatorSnapshot>>;

function bogotaHhmmNow() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Bogota",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

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
  const [msg, setMsg] = useState<string | null>(null);
  const playerRef = useRef<AlertPlayer | null>(null);
  const seen = useRef(new Set(initial.incoming.map((a) => a.id)));
  const primed = useRef(false);

  if (!playerRef.current) playerRef.current = new AlertPlayer();

  async function refreshAlertSound() {
    try {
      const res = await fetch("/api/config/alert-sound", { cache: "no-store" });
      if (!res.ok) return;
      const cfg = (await res.json()) as { alertSoundUrl?: string };
      if (!cfg.alertSoundUrl) return;
      setAlertSrc(cfg.alertSoundUrl);
      playerRef.current?.forceSource(cfg.alertSoundUrl);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void refreshAlertSound();
    const id = setInterval(() => void refreshAlertSound(), 15000);
    return () => clearInterval(id);
  }, []);

  function stopRing() {
    playerRef.current?.stop();
    setRinging(false);
  }

  async function startRing() {
    try {
      const res = await fetch("/api/config/alert-sound", { cache: "no-store" });
      if (res.ok) {
        const cfg = (await res.json()) as { alertSoundUrl?: string };
        if (cfg.alertSoundUrl) {
          setAlertSrc(cfg.alertSoundUrl);
          playerRef.current?.forceSource(cfg.alertSoundUrl);
          const ok = await playerRef.current?.ring({
            loop: true,
            src: cfg.alertSoundUrl,
          });
          if (ok) setRinging(true);
          return;
        }
      }
    } catch {
      /* fall through */
    }
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
    await refreshAlertSound();
    const ok = await playerRef.current?.unlock(alertSrc);
    setSoundOn(Boolean(ok));
  }

  const bitacora = paginate(data.bitacora, bitacoraPage, 10);
  const selectedName =
    data.myPuntos.find((p) => p.id === puntoId)?.name ?? data.selected?.name;

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
      {msg ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {msg}
        </p>
      ) : null}

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
        <p className="m-0 text-sm font-semibold text-ink">
          Punto: <span className="font-normal">{selectedName}</span>
        </p>
        {data.myPuntos.length > 1 ? (
          <div className="flex w-full flex-wrap gap-2">
            {data.myPuntos.map((p) => (
              <button
                key={p.id}
                type="button"
                className={
                  p.id === puntoId
                    ? "btn btn-primary text-sm"
                    : "btn btn-ghost text-sm"
                }
                onClick={() => setPuntoId(p.id)}
              >
                {p.name}
              </button>
            ))}
          </div>
        ) : null}
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
          bloquea la alarma. Puedes cambiar tu audio en{" "}
          <strong>Sonido</strong>.
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
                className="rounded-2xl border border-line bg-orange-50/70 p-4"
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
                  {a.conductorPhone ? (
                    <p className="mt-1 text-sm">
                      Llamar:{" "}
                      <a
                        className="font-semibold text-forest underline"
                        href={`tel:${a.conductorPhone}`}
                      >
                        {a.conductorPhone}
                      </a>
                    </p>
                  ) : null}
                </div>
                <form
                  className="mt-3 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    start(async () => {
                      const fd = new FormData(form);
                      fd.set("alertaId", a.id);
                      fd.set("conductorId", a.conductorId);
                      fd.set("puntoId", a.puntoId);
                      fd.set("busetaId", a.busetaId);
                      if (a.horarioId) fd.set("horarioId", a.horarioId);
                      const res = await registrarLlegadaAction(fd);
                      if (res?.error) {
                        setMsg(res.error);
                        return;
                      }
                      setMsg("Llegada registrada.");
                      stopRing();
                    });
                  }}
                >
                  <div>
                    <label htmlFor={`llegada-${a.id}`}>Hora llegada</label>
                    <input
                      id={`llegada-${a.id}`}
                      name="horaLlegada"
                      type="time"
                      defaultValue={bogotaHhmmNow()}
                      required
                      className="max-w-[9rem]"
                    />
                  </div>
                  <div>
                    <label htmlFor={`desc-${a.id}`}>Descripción (opcional)</label>
                    <input
                      id={`desc-${a.id}`}
                      name="descripcion"
                      maxLength={500}
                      placeholder="Ej. demora por tráfico"
                    />
                  </div>
                  <button
                    className="btn btn-signal w-full sm:w-auto"
                    disabled={pending}
                    type="submit"
                  >
                    Registrar llegada
                  </button>
                </form>
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
          <ul className="space-y-4">
            {data.waitingSalida.map((r) => (
              <li
                key={r.id}
                className="space-y-3 rounded-2xl border border-line p-4"
              >
                <div>
                  <p className="font-semibold">
                    Buseta {r.busetaCodigo} · {r.conductorName}
                  </p>
                  <p className="text-sm text-muted">
                    Llegó {r.llegadaHora}
                    {r.descripcion ? ` · ${r.descripcion}` : ""}
                  </p>
                </div>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    start(async () => {
                      const fd = new FormData(form);
                      fd.set("registroId", r.id);
                      const res = await updateRegistroCruceAction(fd);
                      setMsg(res?.error ?? "Registro actualizado.");
                    });
                  }}
                >
                  <div>
                    <label htmlFor={`edit-llegada-${r.id}`}>Hora llegada</label>
                    <input
                      id={`edit-llegada-${r.id}`}
                      name="horaLlegada"
                      type="time"
                      defaultValue={r.llegadaHora}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor={`edit-desc-${r.id}`}>Descripción</label>
                    <input
                      id={`edit-desc-${r.id}`}
                      name="descripcion"
                      maxLength={500}
                      defaultValue={r.descripcion ?? ""}
                      placeholder="Opcional"
                    />
                  </div>
                  <button
                    className="btn btn-ghost w-full sm:w-auto"
                    disabled={pending}
                    type="submit"
                  >
                    Guardar cambios
                  </button>
                </form>
                <form
                  className="flex flex-col gap-3 sm:flex-row sm:items-end"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    start(async () => {
                      const fd = new FormData(form);
                      fd.set("registroId", r.id);
                      const res = await registrarSalidaAction(fd);
                      setMsg(res?.error ?? "Salida registrada.");
                    });
                  }}
                >
                  <div>
                    <label htmlFor={`salida-${r.id}`}>Hora salida</label>
                    <input
                      id={`salida-${r.id}`}
                      name="horaSalida"
                      type="time"
                      defaultValue={bogotaHhmmNow()}
                      required
                      className="max-w-[9rem]"
                    />
                  </div>
                  <button
                    className="btn btn-primary w-full sm:w-auto"
                    disabled={pending}
                    type="submit"
                  >
                    Registrar salida
                  </button>
                </form>
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
              <th>Nota</th>
              <th>Puntualidad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {bitacora.items.map((r) => (
              <tr key={r.id}>
                <td>{r.busetaCodigo}</td>
                <td>{r.conductorName}</td>
                <td>{r.llegadaHora}</td>
                <td>{r.salidaHora ?? "—"}</td>
                <td className="max-w-[12rem] truncate text-sm text-muted">
                  {r.descripcion || "—"}
                </td>
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
                <td>
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-forest">
                      Editar
                    </summary>
                    <form
                      className="mt-2 space-y-2 rounded-xl border border-line bg-white p-3"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        start(async () => {
                          const fd = new FormData(form);
                          fd.set("registroId", r.id);
                          const res = await updateRegistroCruceAction(fd);
                          setMsg(res?.error ?? "Registro actualizado.");
                        });
                      }}
                    >
                      <div>
                        <label>Llegada</label>
                        <input
                          name="horaLlegada"
                          type="time"
                          defaultValue={r.llegadaHora}
                          required
                        />
                      </div>
                      {r.salidaHora ? (
                        <div>
                          <label>Salida</label>
                          <input
                            name="horaSalida"
                            type="time"
                            defaultValue={r.salidaHora}
                          />
                        </div>
                      ) : null}
                      <div>
                        <label>Descripción</label>
                        <input
                          name="descripcion"
                          maxLength={500}
                          defaultValue={r.descripcion ?? ""}
                        />
                      </div>
                      <button
                        className="btn btn-ghost text-sm"
                        disabled={pending}
                        type="submit"
                      >
                        Guardar
                      </button>
                    </form>
                  </details>
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
