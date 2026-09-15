"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { approveDriverAction } from "@/lib/actions";
import { ConfirmForm } from "./confirm-form";

type BusetaOpt = { id: string; codigo: string };

export function ApproveDriverCard({
  id,
  name,
  phone,
  busetas,
  defaultBusetaId,
}: {
  id: string;
  name: string;
  phone: string;
  busetas: BusetaOpt[];
  defaultBusetaId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <ConfirmForm
      action={(fd: FormData) => {
        setError(null);
        start(async () => {
          try {
            const res = await approveDriverAction(fd);
            if (res?.error) {
              setError(res.error);
              return;
            }
            router.refresh();
          } catch {
            setError("No se pudo aprobar. Intenta de nuevo.");
          }
        });
      }}
      title={`¿Aprobar a ${name}?`}
      message="Al asignar buseta se libera al conductor anterior."
      confirmLabel="Aprobar"
      tone="default"
      className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="id" value={id} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{name}</p>
        <p className="text-sm text-muted">{phone}</p>
        {error ? <p className="mt-1 text-sm text-signal">{error}</p> : null}
      </div>
      <div>
        <label>Buseta</label>
        <select
          name="busetaId"
          defaultValue={defaultBusetaId ?? ""}
          className="input-compact"
          disabled={pending}
        >
          <option value="">Sin asignar</option>
          {busetas.map((b) => (
            <option key={b.id} value={b.id}>
              {b.codigo}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Aprobando…" : "Aprobar"}
      </button>
    </ConfirmForm>
  );
}
