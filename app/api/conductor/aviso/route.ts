import { NextResponse } from "next/server";
import { avisoProximidadAction } from "@/lib/actions";
import { readSession } from "@/lib/session";

export async function POST(request: Request) {
  const user = await readSession();
  if (!user || user.role !== "driver") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as { puntoId?: string };
  const fd = new FormData();
  fd.set("puntoId", body.puntoId ?? "");
  const result = await avisoProximidadAction(fd);
  if (result?.error) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
