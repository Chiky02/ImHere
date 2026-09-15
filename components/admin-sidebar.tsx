"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/lib/actions";
import type { NavGroup } from "@/lib/permissions";
import type { SessionUser } from "@/lib/types";
import { ConfirmForm } from "./confirm-form";

export function AdminSidebar({
  user,
  groups,
}: {
  user: SessionUser;
  groups: NavGroup[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const g of groups) {
      init[g.id] = g.links.some((l) => isActive(pathname, l.href));
    }
    return init;
  });

  useEffect(() => {
    setMobileOpen(false);
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const g of groups) {
        if (g.links.some((l) => isActive(pathname, l.href))) next[g.id] = true;
      }
      return next;
    });
  }, [pathname, groups]);

  const nav = (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
      {groups.map((g) => {
        const open = openGroups[g.id] !== false;
        return (
          <div key={g.id} className="mb-2">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted hover:bg-[#eaf5fc]"
              onClick={() =>
                setOpenGroups((s) => ({ ...s, [g.id]: !open }))
              }
            >
              {g.label}
              <span className="text-sm">{open ? "▾" : "▸"}</span>
            </button>
            {open ? (
              <ul className="mt-0.5 space-y-0.5">
                {g.links.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className={`block rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "bg-[var(--forest)] text-white"
                            : "text-ink hover:bg-[#eaf5fc]"
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-[var(--forest)] px-3 py-3 text-[var(--on-primary)] lg:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15"
          aria-label="Menú"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
        <span className="display truncate text-base">Control de puntos</span>
        <span className="ml-auto truncate text-xs opacity-90">{user.name}</span>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-[#0f2744]/45 lg:hidden ${
          mobileOpen ? "" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(17rem,88vw)] flex-col border-r border-line bg-white lg:static lg:z-0 lg:w-[16.5rem] lg:translate-x-0 lg:transform-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="hidden border-b border-line px-4 py-4 lg:block">
          <p className="display text-lg text-[var(--forest-2)]">Control</p>
          <p className="truncate text-sm text-muted">
            {user.name} · {user.roleName ?? "Admin"}
          </p>
        </div>
        <div className="flex items-center justify-between border-b border-line px-4 py-3 lg:hidden">
          <p className="display text-lg text-[var(--forest-2)]">Menú</p>
          <button
            type="button"
            className="rounded-lg border border-line px-2 py-1"
            onClick={() => setMobileOpen(false)}
          >
            ×
          </button>
        </div>
        {nav}
        <div className="border-t border-line p-3">
          <ConfirmForm
            action={logoutAction}
            title="¿Cerrar sesión?"
            message="Tendrás que volver a iniciar sesión."
            confirmLabel="Salir"
            tone="default"
          >
            <button type="submit" className="btn btn-ghost w-full text-sm">
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
  if (href === "/admin" || href === "/operador" || href === "/cuenta") return false;
  return pathname.startsWith(`${href}/`);
}
