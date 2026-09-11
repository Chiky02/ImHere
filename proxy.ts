import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

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
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret());
      role = String(payload.role ?? "");
    } catch {
      role = null;
    }
  }

  const isPublic = PUBLIC.some((p) => pathname === p);
  if (!role && !isPublic && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (role && (pathname === "/" || isPublic)) {
    const url = request.nextUrl.clone();
    url.pathname =
      role === "admin" ? "/admin" : role === "operator" ? "/operador" : "/conductor";
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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
