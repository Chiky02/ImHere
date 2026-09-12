import { defaultPermissions, SYSTEM_ROLE_IDS } from "./permissions";
import type { AppRole, Database } from "./types";

export function systemRolesSeed(): AppRole[] {
  const now = "2026-01-01T00:00:00.000Z";
  return [
    {
      id: SYSTEM_ROLE_IDS.admin,
      name: "Administrador",
      slug: "admin",
      home: "admin",
      permissions: defaultPermissions("admin"),
      isSystem: true,
      active: true,
      createdAt: now,
    },
    {
      id: SYSTEM_ROLE_IDS.operator,
      name: "Operador de punto",
      slug: "operator",
      home: "operator",
      permissions: defaultPermissions("operator"),
      isSystem: true,
      active: true,
      createdAt: now,
    },
    {
      id: SYSTEM_ROLE_IDS.driver,
      name: "Conductor",
      slug: "driver",
      home: "driver",
      permissions: defaultPermissions("driver"),
      isSystem: true,
      active: true,
      createdAt: now,
    },
  ];
}

export function ensureRoles(db: Database) {
  if (!db.roles?.length) {
    db.roles = systemRolesSeed();
  }
  for (const u of db.users) {
    if (u.active === undefined) u.active = true;
    if (!u.roleId) {
      if (u.role === "admin") u.roleId = SYSTEM_ROLE_IDS.admin;
      else if (u.role === "operator") u.roleId = SYSTEM_ROLE_IDS.operator;
      else u.roleId = SYSTEM_ROLE_IDS.driver;
    }
  }
}
