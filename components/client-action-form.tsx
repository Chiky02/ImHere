"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";

type ActionResult = {
  error?: string;
  ok?: boolean;
  home?: string;
  selfChanged?: boolean;
  message?: string;
} | void | null;

export function ClientActionForm({
  action,
  className,
  children,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          try {
            const res = await action(fd);
            if (res?.error) {
              setError(res.error);
              return;
            }
            if (res?.selfChanged && res.home) {
              window.location.assign(res.home);
              return;
            }
            router.refresh();
          } catch {
            setError("No se pudo guardar. Intenta de nuevo.");
          }
        });
      }}
    >
      {error ? (
        <p className="rounded-xl bg-orange-50 px-3 py-2 text-sm text-signal">{error}</p>
      ) : null}
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
    </form>
  );
}
