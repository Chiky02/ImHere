"use client";

import { useActionState } from "react";
import { saveUserAction } from "@/lib/actions";
import { ConfirmForm } from "./confirm-form";

type BusetaOpt = { id: string; codigo: string };
type RoleOpt = { id: string; name: string; home: string };

export function CreateUserForm({
  busetas,
  roles,
}: {
  busetas: BusetaOpt[];
  roles: RoleOpt[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; ok?: boolean; message?: string } | null, fd: FormData) =>
      (await saveUserAction(fd)) ?? null,
    null,
  );

  const defaultRole =
    roles.find((r) => r.home === "driver")?.id ?? roles[0]?.id ?? "";

  return (
    <ConfirmForm
      action={formAction}
      title="¿Crear este usuario?"
      message="Se creará el perfil con el rol y contraseña indicados."
      confirmLabel="Crear usuario"
      tone="default"
      className="card space-y-3 p-4 sm:p-5"
    >
      <h2 className="display text-xl">Nuevo usuario</h2>
      {state?.error ? (
        <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.message ?? "Usuario creado."}
        </p>
      ) : null}
      <input type="hidden" name="approved" value="on" />
      <input type="hidden" name="active" value="on" />
      <div className="form-grid-compact">
        <div>
          <label htmlFor="cu-name">Nombre</label>
          <input id="cu-name" name="name" required minLength={2} className="input-compact w-full" />
        </div>
        <div>
          <label htmlFor="cu-phone">Celular (10+ dígitos)</label>
          <input
            id="cu-phone"
            name="phone"
            required
            inputMode="numeric"
            minLength={10}
            className="input-compact w-full"
          />
        </div>
        <div>
          <label htmlFor="cu-role">Rol</label>
          <select
            id="cu-role"
            name="roleId"
            defaultValue={defaultRole}
            required
            className="input-compact w-full"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cu-buseta">Buseta (si aplica)</label>
          <select id="cu-buseta" name="busetaId" defaultValue="" className="input-compact w-full">
            <option value="">—</option>
            {busetas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.codigo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cu-pass">Contraseña inicial</label>
          <input
            id="cu-pass"
            name="password"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            className="input-compact w-full"
          />
        </div>
        <div>
          <label htmlFor="cu-pass2">Confirmar contraseña</label>
          <input
            id="cu-pass2"
            name="passwordConfirm"
            type="password"
            minLength={6}
            required
            autoComplete="new-password"
            className="input-compact w-full"
          />
        </div>
      </div>
      <button className="btn btn-primary w-full sm:w-auto" type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear"}
      </button>
    </ConfirmForm>
  );
}
