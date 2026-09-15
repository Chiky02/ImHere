import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import {
  defaultPermissions,
  homePath,
  hasPermission,
  type Permission,
} from "./permissions";
import type { Role, SessionUser } from "./types";

const COOKIE = "cp_session";

function secret() {
  const raw = process.env.SESSION_SECRET || "control-puntos-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

function normalizePermissions(role: Role, raw: unknown): string[] {
  if (Array.isArray(raw) && raw.length > 0) return raw.map(String);
  return defaultPermissions(role);
}

function samePerms(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((p) => set.has(p));
}

function cookieOpts(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
    expires: maxAge === 0 ? new Date(0) : undefined,
  };
}

export async function signSession(user: SessionUser) {
  const permissions =
    user.permissions?.length > 0
      ? user.permissions
      : defaultPermissions(user.role);
  const defaults = defaultPermissions(user.role);
  // Omit default permission lists to keep the cookie small (Vercel/edge 4KB).
  const payload: Record<string, unknown> = {
    name: user.name,
    phone: user.phone,
    role: user.role,
    roleId: user.roleId,
    roleName: user.roleName,
    busetaId: user.busetaId,
    puntoId: user.puntoId,
    approved: user.approved,
    active: user.active,
  };
  if (!samePerms(permissions, defaults)) {
    payload.permissions = permissions;
  }
  return new SignJWT(payload)
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
    const role = payload.role as Role;
    if (role !== "admin" && role !== "operator" && role !== "driver") {
      return null;
    }
    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      phone: String(payload.phone ?? ""),
      role,
      roleId: payload.roleId ? String(payload.roleId) : undefined,
      roleName: payload.roleName ? String(payload.roleName) : undefined,
      busetaId: payload.busetaId ? String(payload.busetaId) : undefined,
      puntoId: payload.puntoId ? String(payload.puntoId) : undefined,
      approved: Boolean(payload.approved),
      active: payload.active !== false,
      permissions: normalizePermissions(role, payload.permissions),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = await signSession(user);
  (await cookies()).set(COOKIE, token, cookieOpts(60 * 60 * 24 * 14));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", cookieOpts(0));
  jar.delete({ name: COOKIE, path: "/" });
}

/** Never replace the logged-in cookie with another person's session. */
export async function refreshSessionIfSelf(userId: string) {
  const session = await readSession();
  if (!session || session.id !== userId) return session;
  const { buildSessionUser } = await import("./auth-user");
  const { getUserById } = await import("./repo");
  const fresh = await getUserById(userId);
  if (!fresh || fresh.active === false) {
    await clearSessionCookie();
    return null;
  }
  const next = await buildSessionUser(fresh);
  await setSessionCookie(next);
  return next;
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
