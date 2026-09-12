import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { homePath, hasPermission, type Permission } from "./permissions";
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
    roleId: user.roleId,
    roleName: user.roleName,
    busetaId: user.busetaId,
    approved: user.approved,
    active: user.active,
    permissions: user.permissions,
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
    if (payload.active === false) return null;
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions.map(String)
      : [];
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      phone: String(payload.phone ?? ""),
      role: payload.role as Role,
      roleId: payload.roleId ? String(payload.roleId) : undefined,
      roleName: payload.roleName ? String(payload.roleName) : undefined,
      busetaId: payload.busetaId ? String(payload.busetaId) : undefined,
      approved: Boolean(payload.approved),
      active: payload.active !== false,
      permissions,
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
  return homePath(role);
}

export async function requireUser(roles?: Role[]) {
  const user = await readSession();
  if (!user || user.active === false) return null;
  if (roles && !roles.includes(user.role)) return null;
  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await readSession();
  if (!user || user.active === false) return null;
  if (!hasPermission(user, permission)) return null;
  return user;
}
