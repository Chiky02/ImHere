import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { buildSessionUser } from "@/lib/auth-user";
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
  if (user.active === false) {
    return NextResponse.json(
      { error: "Esta cuenta está inactiva. Contacta al administrador." },
      { status: 403 },
    );
  }
  const session = await buildSessionUser(user);
  await setSessionCookie(session);
  return NextResponse.json({
    ok: true,
    role: session.role,
    home: homeForRole(session.role),
  });
}
