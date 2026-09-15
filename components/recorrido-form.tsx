"use client";

import { useState } from "react";
import { saveRecorridoAction } from "@/lib/actions";
import type { Punto, Recorrido } from "@/lib/types";

function nextPuntoId(puntos: Punto[], used: string[]) {
  const free = puntos.find((p) => !used.includes(p.id));
  return free?.id ?? puntos[0]?.id ?? "";
}

export function RecorridoForm({
  puntos,
  recorrido,
}: {
  puntos: Punto[];
  recorrido?: Recorrido;
}) {
  const sortedPuntos = [...puntos].sort(
    (a, b) => (a.numero ?? 9999) - (b.numero ?? 9999) || a.name.localeCompare(b.name),
  );
  const [rows, setRows] = useState(
    recorrido?.puntos.length
      ? [...recorrido.puntos].sort((a, b) => a.orden - b.orden)
      : [
          {
            puntoId: sortedPuntos[0]?.id ?? "",
            orden: 1,
            tiempoEsperadoMin: 30,
          },
        ],
  );

  return (
    <form action={saveRecorridoAction as never} className="space-y-4">
      {recorrido ? <input type="hidden" name="id" value={recorrido.id} /> : null}
      <div className="form-grid-compact">
        <div className="sm:col-span-2 lg:col-span-3">
          <label>Nombre del recorrido</label>
          <input
            name="name"
            required
            defaultValue={recorrido?.name}
            placeholder="Ruta Sur"
            className="input-compact"
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Puntos en orden · minutos desde el anterior
        </p>
        <p className="text-sm text-muted">
          Cada fila es un cruce distinto del recorrido. El conductor avisará en
          este mismo orden.
        </p>
        {rows.map((row, i) => (
          <div
            key={`${row.orden}-${i}`}
            className="grid grid-cols-1 items-end gap-2 sm:grid-cols-[auto_minmax(12rem,1fr)_6rem_auto] sm:gap-3"
          >
            <span className="pb-2 text-sm font-semibold text-muted">{i + 1}.</span>
            <select
              name="puntoId"
              value={row.puntoId}
              onChange={(e) => {
                const next = [...rows];
                next[i] = { ...next[i], puntoId: e.target.value };
                setRows(next);
              }}
              className="input-compact w-full"
            >
              {sortedPuntos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numero != null ? `#${p.numero} · ` : ""}
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex items-end gap-2">
              <input
                name="tiempoEsperadoMin"
                type="number"
                min={0}
                value={row.tiempoEsperadoMin}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = {
                    ...next[i],
                    tiempoEsperadoMin: Number(e.target.value),
                  };
                  setRows(next);
                }}
                className="input-compact w-full"
              />
              <span className="pb-2 text-sm text-muted">min</span>
            </div>
            {rows.length > 1 ? (
              <button
                type="button"
                className="btn btn-ghost text-sm text-signal sm:mb-0.5"
                onClick={() => setRows(rows.filter((_, j) => j !== i))}
              >
                Quitar
              </button>
            ) : (
              <span className="hidden sm:block" />
            )}
          </div>
        ))}
        <button
          type="button"
          className="btn btn-ghost text-sm"
          onClick={() => {
            const used = rows.map((r) => r.puntoId);
            setRows([
              ...rows,
              {
                puntoId: nextPuntoId(sortedPuntos, used),
                orden: rows.length + 1,
                tiempoEsperadoMin: 20,
              },
            ]);
          }}
        >
          Agregar punto
        </button>
      </div>
      <div className="admin-form-actions">
        <button className="btn btn-primary" type="submit">
          {recorrido ? "Guardar cambios" : "Crear recorrido"}
        </button>
      </div>
    </form>
  );
}
