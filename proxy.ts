import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { homePath, requiredPermissionForPath } from "@/lib/permissions";

const PUBLIC = ["/login", "/registro"];

function secret() {
  const raw = process.env.SESSION_SECRET || "control-puntos-dev-secret-change-me";
  return new TextEncoder().encode(raw);
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
  let role: string | null = null;
  let permissions: string[] = [];
  let active = true;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      role = String(payload.role ?? "");
      active = payload.active !== false;
      permissions = Array.isArray(payload.permissions)
        ? payload.permissions.map(String)
        : [];
    } catch {
      role = null;
    }
  }

  if (role && !active) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const res = NextResponse.redirect(url);
    res.cookies.delete("cp_session");
    return res;
  }

  const isPublic = PUBLIC.some((p) => pathname === p);
  if (!role && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (role && (pathname === "/" || isPublic)) {
    const url = request.nextUrl.clone();
    url.pathname = homePath(role as "admin" | "operator" | "driver");
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/operador") && role !== "operator" && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/conductor") && role !== "driver") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const needed = requiredPermissionForPath(pathname);
  if (needed && role && !permissions.includes(needed)) {
    const url = request.nextUrl.clone();
    url.pathname = homePath(role as "admin" | "operator" | "driver");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
