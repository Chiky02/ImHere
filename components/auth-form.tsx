"use client";

import { useActionState } from "react";
import type { loginAction, registerAction } from "@/lib/actions";

type AuthFn = typeof loginAction | typeof registerAction;

export function AuthForm({
  action,
  submitLabel,
  extra,
}: {
  action: AuthFn;
  submitLabel: string;
  extra?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      return (await action(formData)) ?? null;
    },
    null,
  );

  return (
    <form action={formAction} className="space-y-4">
      {extra}
      {state?.error ? (
        <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">
          {state.error}
        </p>
      ) : null}
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Entrando…" : submitLabel}
      </button>
    </form>
  );
}
