import type { Role, SessionUser } from "./types";

export type Permission =
  | "manage.dashboard"
  | "manage.puntos"
  | "manage.recorridos"
  | "manage.busetas"
  | "manage.personas"
  | "manage.horarios"
  | "manage.historial"
  | "manage.config"
  | "manage.roles"
  | "operador.panel"
  | "operador.sonido"
  | "conductor.avisar"
  | "conductor.buseta_self";

export type PermissionMeta = {
  label: string;
  description: string;
  homes: Role[];
};

/** Catálogo fijo: evita permisos que no corresponden al “hogar” del rol. */
export const PERMISSION_CATALOG: Record<Permission, PermissionMeta> = {
  "manage.dashboard": {
    label: "Inicio admin",
    description: "Ver el panel de administración",
    homes: ["admin"],
  },
  "manage.puntos": {
    label: "Puntos",
    description: "Crear y editar puntos de control",
    homes: ["admin"],
  },
  "manage.recorridos": {
    label: "Recorridos",
    description: "Gestionar recorridos",
    homes: ["admin"],
  },
  "manage.busetas": {
    label: "Busetas",
    description: "Gestionar busetas",
    homes: ["admin"],
  },
  "manage.personas": {
    label: "Personas",
    description: "Crear usuarios, roles y aprobar conductores",
    homes: ["admin"],
  },
  "manage.horarios": {
    label: "Horarios",
    description: "Gestionar horarios",
    homes: ["admin"],
  },
  "manage.historial": {
    label: "Historial",
    description: "Ver historial de cruces",
    homes: ["admin"],
  },
  "manage.config": {
    label: "Configuración",
    description: "Sonido global y ajustes del sistema",
    homes: ["admin"],
  },
  "manage.roles": {
    label: "Roles",
    description: "Crear y editar roles y permisos",
    homes: ["admin"],
  },
  "operador.panel": {
    label: "Panel del punto",
    description: "Registrar llegadas y salidas",
    homes: ["operator", "admin"],
  },
  "operador.sonido": {
    label: "Sonido del operador",
    description: "Configurar alarma personal",
    homes: ["operator", "admin"],
  },
  "conductor.avisar": {
    label: "Avisar proximidad",
    description: "Enviar aviso al punto",
    homes: ["driver"],
  },
  "conductor.buseta_self": {
    label: "Elegir buseta",
    description: "El conductor puede cambiar la buseta que usa",
    homes: ["driver"],
  },
};

export const ALL_PERMISSIONS = Object.keys(PERMISSION_CATALOG) as Permission[];

export function permissionsForHome(home: Role): Permission[] {
  return ALL_PERMISSIONS.filter((p) => PERMISSION_CATALOG[p].homes.includes(home));
}

export function sanitizePermissions(home: Role, raw: string[]): Permission[] {
  const allowed = new Set(permissionsForHome(home));
  const out: Permission[] = [];
  for (const p of raw) {
    if (allowed.has(p as Permission) && !out.includes(p as Permission)) {
      out.push(p as Permission);
    }
  }
  return out;
}

export function defaultPermissions(home: Role): Permission[] {
  return permissionsForHome(home);
}

export function hasPermission(
  user: Pick<SessionUser, "permissions"> | null | undefined,
  permission: Permission,
) {
  return Boolean(user?.permissions?.includes(permission));
}

export function hasAnyPermission(
  user: Pick<SessionUser, "permissions"> | null | undefined,
  permissions: Permission[],
) {
  return permissions.some((p) => hasPermission(user, p));
}

export function homePath(role: Role) {
  if (role === "admin") return "/admin";
  if (role === "operator") return "/operador";
  return "/conductor";
}

/** Ruta → permiso requerido (además del hogar del rol en el proxy). */
export const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: "/admin/puntos", permission: "manage.puntos" },
  { prefix: "/admin/recorridos", permission: "manage.recorridos" },
  { prefix: "/admin/busetas", permission: "manage.busetas" },
  { prefix: "/admin/conductores", permission: "manage.personas" },
  { prefix: "/admin/roles", permission: "manage.roles" },
  { prefix: "/admin/horarios", permission: "manage.horarios" },
  { prefix: "/admin/historial", permission: "manage.historial" },
  { prefix: "/admin/configuracion", permission: "manage.config" },
  { prefix: "/admin", permission: "manage.dashboard" },
  { prefix: "/operador/sonido", permission: "operador.sonido" },
  { prefix: "/operador", permission: "operador.panel" },
  { prefix: "/conductor", permission: "conductor.avisar" },
];

export function requiredPermissionForPath(pathname: string): Permission | null {
  const hit = ROUTE_PERMISSIONS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  return hit?.permission ?? null;
}

export type NavLink = { href: string; label: string; permission?: Permission };

export function navLinksForUser(user: SessionUser): NavLink[] {
  const links: NavLink[] = [];
  if (user.role === "admin") {
    const admin: NavLink[] = [
      { href: "/admin", label: "Inicio", permission: "manage.dashboard" },
      { href: "/admin/puntos", label: "Puntos", permission: "manage.puntos" },
      { href: "/admin/recorridos", label: "Recorridos", permission: "manage.recorridos" },
      { href: "/admin/busetas", label: "Busetas", permission: "manage.busetas" },
      { href: "/admin/conductores", label: "Personas", permission: "manage.personas" },
      { href: "/admin/roles", label: "Roles", permission: "manage.roles" },
      { href: "/admin/horarios", label: "Horarios", permission: "manage.horarios" },
      { href: "/admin/historial", label: "Historial", permission: "manage.historial" },
      { href: "/admin/configuracion", label: "Config", permission: "manage.config" },
      { href: "/operador", label: "Panel punto", permission: "operador.panel" },
    ];
    for (const l of admin) {
      if (!l.permission || hasPermission(user, l.permission)) links.push(l);
    }
  } else if (user.role === "operator") {
    if (hasPermission(user, "operador.panel")) {
      links.push({ href: "/operador", label: "Panel" });
    }
    if (hasPermission(user, "operador.sonido")) {
      links.push({ href: "/operador/sonido", label: "Sonido" });
    }
  } else {
    if (hasPermission(user, "conductor.avisar")) {
      links.push({ href: "/conductor", label: "Avisar" });
    }
  }
  links.push({ href: "/cuenta", label: "Cuenta" });
  return links;
}

export const SYSTEM_ROLE_IDS = {
  admin: "00000000-0000-4000-8000-000000000001",
  operator: "00000000-0000-4000-8000-000000000002",
  driver: "00000000-0000-4000-8000-000000000003",
} as const;
