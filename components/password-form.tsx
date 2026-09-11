"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean } | null, formData: FormData) => {
      return (await changePasswordAction(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="card max-w-lg space-y-4 p-4 sm:p-6">
      <h2 className="display text-xl">Cambiar contraseña</h2>
      {state?.error ? (
        <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Contraseña actualizada.
        </p>
      ) : null}
      <div>
        <label htmlFor="currentPassword">Contraseña actual</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div>
        <label htmlFor="password">Nueva contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          autoComplete="new-password"
          required
        />
      </div>
      <div>
        <label htmlFor="passwordConfirm">Confirmar nueva contraseña</label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          minLength={6}
          autoComplete="new-password"
          required
        />
      </div>
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending} type="submit">
        {pending ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
