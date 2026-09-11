import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import * as repo from "@/lib/repo";
import { homeForRole, setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; password?: string };
  const phone = repo.normalizePhone(body.phone ?? "");
  const password = body.password ?? "";
  const user = await repo.getUserByPhone(phone);
  if (!user || !(await compare(password, user.passwordHash))) {
    return NextResponse.json({ error: "Celular o contraseña incorrectos." }, { status: 401 });
  }
  await setSessionCookie({
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    busetaId: user.busetaId,
    approved: user.approved,
  });
  return NextResponse.json({ ok: true, role: user.role, home: homeForRole(user.role) });
}
