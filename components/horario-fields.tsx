import { DIA_LABELS } from "@/lib/time";

export function HorarioFields({
  recorridos,
  busetas,
  drivers,
  defaults,
}: {
  recorridos: { id: string; name: string }[];
  busetas: { id: string; codigo: string }[];
  drivers: { id: string; name: string }[];
  defaults?: {
    recorridoId?: string;
    busetaId?: string;
    conductorId?: string;
    tiempoViajeMin?: number;
    horaSalida?: string;
    horaLlegada?: string;
    dias?: number[];
  };
}) {
  const dias = defaults?.dias ?? [1, 2, 3, 4, 5, 6];
  return (
    <>
      <div className="form-grid-compact">
        <div className="sm:col-span-2">
          <label>Recorrido</label>
          <select
            name="recorridoId"
            required
            defaultValue={defaults?.recorridoId}
            className="input-compact w-full max-w-xs"
          >
            {recorridos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Tiempo de viaje (min)</label>
          <input
            name="tiempoViajeMin"
            type="number"
            min={1}
            defaultValue={defaults?.tiempoViajeMin ?? 100}
            className="input-compact w-24"
            required
          />
        </div>
        <div>
          <label>Buseta (opcional)</label>
          <select
            name="busetaId"
            defaultValue={defaults?.busetaId ?? ""}
            className="input-compact max-w-[8rem]"
          >
            <option value="">Rotativa</option>
            {busetas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.codigo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Conductor (opcional)</label>
          <select
            name="conductorId"
            defaultValue={defaults?.conductorId ?? ""}
            className="input-compact max-w-[12rem]"
          >
            <option value="">Rotativo</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Salida ref.</label>
          <input
            name="horaSalida"
            type="time"
            defaultValue={
              defaults?.horaSalida && defaults.horaSalida !== "00:00"
                ? defaults.horaSalida
                : ""
            }
            className="input-compact"
          />
        </div>
        <div>
          <label>Llegada ref.</label>
          <input
            name="horaLlegada"
            type="time"
            defaultValue={
              defaults?.horaLlegada && defaults.horaLlegada !== "00:00"
                ? defaults.horaLlegada
                : ""
            }
            className="input-compact"
          />
        </div>
      </div>
      <div>
        <label>Días</label>
        <div className="flex flex-wrap gap-3">
          {DIA_LABELS.map((label, i) => (
            <label
              key={label}
              className="m-0 flex items-center gap-1 normal-case tracking-normal"
            >
              <input
                type="checkbox"
                name="dias"
                value={i}
                defaultChecked={dias.includes(i)}
                className="w-auto"
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}
