import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role, SessionUser } from "./types";

const COOKIE = "cp_session";

function secret() {
  const raw = process.env.SESSION_SECRET || "control-puntos-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function signSession(user: SessionUser) {
  return new SignJWT({
    name: user.name,
    phone: user.phone,
    role: user.role,
    busetaId: user.busetaId,
    approved: user.approved,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
}

export async function readSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      phone: String(payload.phone ?? ""),
      role: payload.role as Role,
      busetaId: payload.busetaId ? String(payload.busetaId) : undefined,
      approved: Boolean(payload.approved),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE);
}

export function homeForRole(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "operator") return "/operador";
  return "/conductor";
}

export async function requireUser(roles?: Role[]) {
  const user = await readSession();
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}
