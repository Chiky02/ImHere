"use client";

import { useState } from "react";
import { saveRecorridoAction } from "@/lib/actions";
import type { Punto, Recorrido } from "@/lib/types";

export function RecorridoForm({
  puntos,
  recorrido,
}: {
  puntos: Punto[];
  recorrido?: Recorrido;
}) {
  const [rows, setRows] = useState(
    recorrido?.puntos.length
      ? recorrido.puntos
      : [{ puntoId: puntos[0]?.id ?? "", orden: 1, tiempoEsperadoMin: 30 }],
  );

  return (
    <form action={saveRecorridoAction as never} className="space-y-3">
      {recorrido ? <input type="hidden" name="id" value={recorrido.id} /> : null}
      <div className="form-grid-compact">
        <div className="sm:col-span-2">
          <label>Nombre del recorrido</label>
          <input
            name="name"
            required
            defaultValue={recorrido?.name}
            placeholder="Ruta Sur"
            className="input-compact w-full max-w-md"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Puntos · minutos desde el anterior
        </p>
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <span className="w-5 text-sm text-muted">{i + 1}.</span>
            <select
              name="puntoId"
              value={row.puntoId}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], puntoId: e.target.value };
                setRows(next);
              }}
              className="input-compact max-w-[14rem]"
            >
              {puntos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero != null ? `#${p.numero} · ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
            <input
              name="tiempoEsperadoMin"
              type="number"
              min={0}
              value={row.tiempoEsperadoMin}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], tiempoEsperadoMin: Number(e.target.value) };
                setRows(next);
              }}
              className="input-compact w-20"
            />
            <span className="text-sm text-muted">min</span>
            {rows.length > 1 ? (
              <button
                type="button"
                className="text-sm text-signal"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            ) : null}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() =>
            setRows([
              ...rows,
              {
                puntoId: puntos[0]?.id ?? "",
                orden: rows.length + 1,
                tiempoEsperadoMin: 20,
              },
            ])
          }
        >
          Agregar punto
        </button>
      </div>
      <button className="btn btn-primary" type="submit">
        {recorrido ? "Guardar cambios" : "Crear recorrido"}
      </button>
    </form>
  );
}
