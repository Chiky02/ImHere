"use client";

import { saveAvisoCooldownAction } from "@/lib/actions";
import {
  DEFAULT_AVISO_COOLDOWN_SECONDS,
  MAX_AVISO_COOLDOWN_SECONDS,
  MIN_AVISO_COOLDOWN_SECONDS,
} from "@/lib/aviso-cooldown";
import { ClientActionForm } from "./client-action-form";

export function AvisoCooldownConfig({
  seconds,
}: {
  seconds: number;
}) {
  const value = seconds || DEFAULT_AVISO_COOLDOWN_SECONDS;
  return (
    <ClientActionForm
      action={saveAvisoCooldownAction}
      className="card space-y-3 p-4 sm:p-6"
    >
      <h2 className="display text-xl">Espera entre avisos</h2>
      <p className="text-sm text-muted">
        Después de que un conductor pulse un cruce, ese mismo botón no puede
        volver a disparar la alarma hasta que pase este tiempo. Los otros
        cruces siguen disponibles.
      </p>
      <div>
        <label htmlFor="avisoCooldownSeconds">Segundos de espera</label>
        <input
          id="avisoCooldownSeconds"
          name="avisoCooldownSeconds"
          type="number"
          min={MIN_AVISO_COOLDOWN_SECONDS}
          max={MAX_AVISO_COOLDOWN_SECONDS}
          step={1}
          defaultValue={value}
          className="input-compact max-w-[10rem]"
          required
        />
      </div>
      <p className="text-xs text-muted">
        Valor actual: {value}s
        {value >= 60 ? ` (${Math.round(value / 60)} min)` : ""}. Entre{" "}
        {MIN_AVISO_COOLDOWN_SECONDS} y {MAX_AVISO_COOLDOWN_SECONDS} segundos.
        0 = sin espera.
      </p>
      <button className="btn btn-primary" type="submit">
        Guardar espera
      </button>
    </ClientActionForm>
  );
}
