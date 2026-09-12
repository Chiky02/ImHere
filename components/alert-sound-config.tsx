"use client";

import { useActionState, useRef, useState } from "react";
import {
  resetAlertSoundAction,
  saveAlertSoundUrlAction,
  uploadAlertSoundAction,
} from "@/lib/actions";
import { ConfirmForm } from "./confirm-form";

export function AlertSoundConfig({
  currentUrl,
  soundName,
  hasCustomUpload,
  scopeLabel = "del sistema",
}: {
  currentUrl: string;
  soundName: string | null;
  hasCustomUpload: boolean;
  scopeLabel?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const [urlState, urlAction, urlPending] = useActionState(
    async (_p: { error?: string; ok?: boolean } | null, fd: FormData) =>
      (await saveAlertSoundUrlAction(fd)) ?? null,
    null,
  );
  const [upState, upAction, upPending] = useActionState(
    async (_p: { error?: string; ok?: boolean } | null, fd: FormData) =>
      (await uploadAlertSoundAction(fd)) ?? null,
    null,
  );

  async function preview() {
    try {
      stopPreview();
      const audio = new Audio(`${currentUrl}${currentUrl.includes("?") ? "&" : "?"}preview=${Date.now()}`);
      audioRef.current = audio;
      audio.loop = false;
      await audio.play();
      setPreviewing(true);
      audio.onended = () => setPreviewing(false);
    } catch {
      setPreviewing(false);
    }
  }

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPreviewing(false);
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-3 p-4 sm:p-6">
        <h2 className="display text-xl">Sonido actual ({scopeLabel})</h2>
        <p className="text-sm text-muted break-all">
          {hasCustomUpload
            ? `Archivo subido: ${soundName ?? "audio personalizado"}`
            : currentUrl.split("?")[0]}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={preview}>
            {previewing ? "Reproduciendo…" : "Probar sonido"}
          </button>
          {previewing ? (
            <button type="button" className="btn btn-ghost" onClick={stopPreview}>
              Detener
            </button>
          ) : null}
          <ConfirmForm
            action={resetAlertSoundAction}
            title="¿Restaurar sirena?"
            message="Se volverá al sonido por defecto. Esta acción no se puede deshacer desde aquí."
            confirmLabel="Restaurar"
            tone="default"
          >
            <button className="btn btn-ghost" type="submit">
              Restaurar sirena por defecto
            </button>
          </ConfirmForm>
        </div>
        <p className="text-xs text-muted">
          Si “Probar” suena bien pero la alerta del panel no, recarga el panel del
          operador o pulsa otra vez <strong>Activar sonido</strong> para cargar el
          audio nuevo.
        </p>
      </div>

      <form action={upAction} className="card space-y-4 p-4 sm:p-6">
        <h2 className="display text-xl">Subir audio</h2>
        <p className="text-sm text-muted">
          MP3, WAV u OGG. Máximo 3 MB.
        </p>
        {upState?.error ? (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">
            {upState.error}
          </p>
        ) : null}
        {upState?.ok ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Audio actualizado.
          </p>
        ) : null}
        <div>
          <label htmlFor="file">Archivo</label>
          <input id="file" name="file" type="file" accept="audio/*" required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={upPending}>
          {upPending ? "Subiendo…" : "Guardar archivo"}
        </button>
      </form>

      <form action={urlAction} className="card space-y-4 p-4 sm:p-6">
        <h2 className="display text-xl">O usar un enlace / ruta</h2>
        <p className="text-sm text-muted">
          Ejemplos: <code className="rounded bg-stone-100 px-1">/sounds/alerta.wav</code>{" "}
          o <code className="rounded bg-stone-100 px-1">https://midominio.com/alarma.mp3</code>
        </p>
        {urlState?.error ? (
          <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">
            {urlState.error}
          </p>
        ) : null}
        {urlState?.ok ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            URL guardada.
          </p>
        ) : null}
        <div>
          <label htmlFor="alertSoundUrl">URL del audio</label>
          <input
            id="alertSoundUrl"
            name="alertSoundUrl"
            defaultValue={hasCustomUpload ? "" : currentUrl.split("?")[0]}
            placeholder="/sounds/alerta.wav"
            required
          />
        </div>
        <button className="btn btn-primary" type="submit" disabled={urlPending}>
          {urlPending ? "Guardando…" : "Guardar URL"}
        </button>
      </form>
    </div>
  );
}
