"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { IconSave } from "@/components/action-icons";
import { assignDriverToBusetaAction } from "@/lib/actions";

type DriverOpt = { id: string; name: string; busetaId?: string };

export function AssignBusetaDriverForm({
  busetaId,
  currentDriverId,
  drivers,
}: {
  busetaId: string;
  currentDriverId?: string;
  drivers: DriverOpt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="table-actions flex-wrap"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await assignDriverToBusetaAction(fd);
          if (res?.error) {
            setError(res.error);
            return;
          }
          router.refresh();
        });
      }}
    >
      <input type="hidden" name="busetaId" value={busetaId} />
      <select
        name="driverId"
        defaultValue={currentDriverId ?? ""}
        className="input-compact min-w-[10rem] max-w-full sm:max-w-[16rem]"
        disabled={pending}
      >
        <option value="">Sin conductor</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
            {d.busetaId && d.busetaId !== busetaId ? " · otra" : ""}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="icon-btn"
        title="Guardar conductor"
        disabled={pending}
      >
        <IconSave />
      </button>
      {error ? <span className="w-full text-xs text-signal">{error}</span> : null}
    </form>
  );
}
