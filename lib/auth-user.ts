import { defaultPermissions, SYSTEM_ROLE_IDS } from "./permissions";
import * as repo from "./repo";
import type { SessionUser, User } from "./types";

export async function buildSessionUser(user: User): Promise<SessionUser> {
  let roleId = user.roleId;
  if (!roleId) {
    roleId =
      user.role === "admin"
        ? SYSTEM_ROLE_IDS.admin
        : user.role === "operator"
          ? SYSTEM_ROLE_IDS.operator
          : SYSTEM_ROLE_IDS.driver;
  }
  const appRole = await repo.getRole(roleId);
  const permissions =
    appRole && appRole.active
      ? appRole.permissions
      : defaultPermissions(user.role);
  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: appRole?.home ?? user.role,
    roleId,
    roleName: appRole?.name,
    busetaId: user.busetaId,
    puntoId: user.puntoId,
    approved: user.approved,
    active: user.active !== false,
    permissions,
  };
}
