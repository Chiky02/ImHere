"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { logoutAction } from "@/lib/actions";
import type { SessionUser } from "@/lib/types";
import { ConfirmForm } from "./confirm-form";

type NavLink = { href: string; label: string };

export function SiteHeader({
  user,
  links,
}: {
  user: SessionUser;
  links: NavLink[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-[var(--forest)] text-[var(--on-primary)]">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4">
          <button
            type="button"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
            aria-controls="side-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <HamburgerIcon open={open} />
          </button>

          <Link
            href="/"
            className="display min-w-0 flex-1 truncate text-base leading-none sm:text-lg lg:flex-none"
          >
            Control de puntos
          </Link>

          <nav className="hidden flex-1 items-center gap-1 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-1.5 text-sm transition ${
                  isActive(pathname, l.href)
                    ? "bg-white/25 font-semibold"
                    : "text-white/90 hover:bg-white/15"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm sm:gap-3">
            <span className="hidden max-w-[12rem] truncate opacity-90 md:block">
              {user.name} · {user.roleName ?? roleLabel(user.role)}
            </span>
            <ConfirmForm
              action={logoutAction}
              title="¿Cerrar sesión?"
              message="Tendrás que volver a iniciar sesión para usar el sistema."
              confirmLabel="Salir"
              tone="default"
            >
              <button
                type="submit"
                className="rounded-full border border-white/30 px-3 py-1 text-xs hover:bg-white/10"
              >
                Salir
              </button>
            </ConfirmForm>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[#0f2744]/45 transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      />

      {/* Side drawer */}
      <aside
        id="side-nav"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18.5rem,88vw)] flex-col bg-white text-ink shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-4">
          <div className="min-w-0">
            <p id={titleId} className="display text-lg text-[var(--forest-2)]">
              Menú
            </p>
            <p className="truncate text-sm text-muted">
              {user.name} · {user.roleName ?? roleLabel(user.role)}
            </p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line text-ink"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {links.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`mb-1 block rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--forest)] text-white"
                    : "text-ink hover:bg-[#eaf5fc]"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-line p-3">
          <ConfirmForm
            action={logoutAction}
            title="¿Cerrar sesión?"
            message="Tendrás que volver a iniciar sesión para usar el sistema."
            confirmLabel="Salir"
            tone="default"
          >
            <button
              type="submit"
              className="btn btn-ghost w-full border-[var(--forest)]/30 text-[var(--forest-2)]"
            >
              Salir
            </button>
          </ConfirmForm>
        </div>
      </aside>
    </>
  );
}

function isActive(pathname: string, href: string) {
  if (pathname === href) return true;
  const roots = ["/admin", "/operador", "/conductor", "/cuenta"];
  if (roots.includes(href)) return false;
  return pathname.startsWith(`${href}/`);
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-3.5 w-5" aria-hidden>
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-white transition ${
          open ? "top-1.5 rotate-45" : "top-0"
        }`}
      />
      <span
        className={`absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-white transition ${
          open ? "opacity-0" : "opacity-100"
        }`}
      />
      <span
        className={`absolute left-0 block h-0.5 w-5 rounded-full bg-white transition ${
          open ? "top-1.5 -rotate-45" : "top-3"
        }`}
      />
    </span>
  );
}

function roleLabel(role: SessionUser["role"]) {
  if (role === "admin") return "Admin";
  if (role === "operator") return "Punto";
  return "Conductor";
}
