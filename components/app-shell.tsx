import { SiteHeader } from "@/components/site-header";
import type { SessionUser } from "@/lib/types";

const ADMIN_LINKS = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/puntos", label: "Puntos" },
  { href: "/admin/recorridos", label: "Recorridos" },
  { href: "/admin/busetas", label: "Busetas" },
  { href: "/admin/conductores", label: "Personas" },
  { href: "/admin/horarios", label: "Horarios" },
  { href: "/admin/historial", label: "Historial" },
  { href: "/admin/configuracion", label: "Config" },
  { href: "/cuenta", label: "Cuenta" },
];

export function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const links =
    user.role === "admin"
      ? ADMIN_LINKS
      : user.role === "operator"
        ? [
            { href: "/operador", label: "Panel" },
            { href: "/cuenta", label: "Cuenta" },
          ]
        : [
            { href: "/conductor", label: "Avisar" },
            { href: "/cuenta", label: "Cuenta" },
          ];

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader user={user} links={links} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-3 py-4 sm:px-4 sm:py-6">
        {children}
      </main>
    </div>
  );
}
