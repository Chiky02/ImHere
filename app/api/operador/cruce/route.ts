import { NextResponse } from "next/server";
import { registrarLlegadaAction, registrarSalidaAction } from "@/lib/actions";
import { readSession } from "@/lib/session";

async function guard() {
  const user = await readSession();
  if (!user || (user.role !== "operator" && user.role !== "admin")) {
    return null;
  }
  return user;
}

export async function POST(request: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    alertaId?: string;
    conductorId?: string;
    puntoId?: string;
    busetaId?: string;
    horarioId?: string;
  };
  const fd = new FormData();
  if (body.alertaId) fd.set("alertaId", body.alertaId);
  fd.set("conductorId", body.conductorId ?? "");
  fd.set("puntoId", body.puntoId ?? "");
  fd.set("busetaId", body.busetaId ?? "");
  if (body.horarioId) fd.set("horarioId", body.horarioId);
  const result = await registrarLlegadaAction(fd);
  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await guard())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { registroId?: string };
  const fd = new FormData();
  fd.set("registroId", body.registroId ?? "");
  const result = await registrarSalidaAction(fd);
  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json({ ok: true });
}
