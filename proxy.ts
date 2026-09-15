import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  defaultPermissions,
  homePath,
  requiredPermissionForPath,
} from "@/lib/permissions";
import type { Role } from "@/lib/types";

const PUBLIC = ["/login", "/registro"];

function secret() {
  const raw = process.env.SESSION_SECRET || "control-puntos-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

function resolvePermissions(role: Role, raw: unknown): string[] {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw.map(String);
  }
  return defaultPermissions(role);
}

function safeFallbackPath(role: Role, permissions: string[], fromPath: string) {
  const candidates =
    role === "admin"
      ? [
          "/admin",
          "/admin/puntos",
          "/admin/recorridos",
          "/admin/busetas",
          "/admin/conductores",
          "/admin/roles",
          "/admin/horarios",
          "/admin/historial",
          "/admin/configuracion",
        ]
      : role === "operator"
        ? ["/operador", "/operador/sonido"]
        : ["/conductor"];

  for (const path of candidates) {
    if (path === fromPath) continue;
    const need = requiredPermissionForPath(path);
    if (!need || permissions.includes(need)) return path;
  }
  return "/cuenta";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("cp_session")?.value;
  let role: Role | null = null;
  let permissions: string[] = [];
  let active = true;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      const rawRole = String(payload.role ?? "");
      if (rawRole === "admin" || rawRole === "operator" || rawRole === "driver") {
        role = rawRole;
        active = payload.active !== false;
        permissions = resolvePermissions(role, payload.permissions);
      }
    } catch {
      role = null;
    }
  }

  if (role && !active) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.set("cp_session", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    return res;
  }

  const isPublic = PUBLIC.some((p) => pathname === p);
  if (!role && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (role && (pathname === "/" || isPublic)) {
    const dest = homePath(role);
    if (pathname === dest) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = dest;
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = homePath(role);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/operador") && role !== "operator" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = role ? homePath(role) : "/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/conductor") && role !== "driver") {
    const url = request.nextUrl.clone();
    url.pathname = role ? homePath(role) : "/login";
    return NextResponse.redirect(url);
  }

  const needed = requiredPermissionForPath(pathname);
  if (needed && role && !permissions.includes(needed)) {
    const dest = safeFallbackPath(role, permissions, pathname);
    const url = request.nextUrl.clone();
    url.pathname = dest === pathname ? "/cuenta" : dest;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
