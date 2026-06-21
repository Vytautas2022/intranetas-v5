import type { User } from "../mock-db/users";
import type { AuthUser } from "./types";
import {
  getDefaultModulePermissions,
  normalizePermissionRole,
} from "../logic/permissionEngine";
import {
  loadMockPermissionConfig,
  resolveEffectivePermissionPreview,
} from "../logic/permissionPreviewResolver";

export function buildAuthUserFromMockUser(user: User): AuthUser {
  const role = normalizePermissionRole(user.role) as AuthUser["role"];
  const region = user.region || "ALL";
  const assignedRegionIds =
    user.assignedRegionIds || (region === "ALL" ? ["ALL"] : [region]);
  const assignedClubIds = user.assignedClubIds || user.assigned_clubs || [];
  const permissions =
    user.modulePermissions || user.permissions || getDefaultModulePermissions(role);

  const preview = resolveEffectivePermissionPreview(
    { role: user.role, assignedRoleIds: user.assignedRoleIds },
    loadMockPermissionConfig(),
  );

  const tenantIds = Array.from(
    new Set(preview.tenantScopes.flatMap((scope) => scope.tenantIds)),
  );

  return {
    id: user.id,
    name: user.name || user.email,
    email: user.email,
    role,
    assignedRegionIds,
    assignedClubIds,
    region,
    regionAccess: assignedRegionIds,
    modulePermissions: permissions,
    is_active: user.is_active !== false,
    assignedRoleIds: preview.assignedRoleIds,
    effectiveRoles: preview.assignedRoles,
    tenantIds,
    effectivePermissionsPreview: {
      assignedRoleIds: preview.assignedRoleIds,
      moduleAccess: preview.moduleAccess,
      workflowAccess: preview.workflowAccess,
      objectScopes: preview.objectScopes,
      tenantScopes: preview.tenantScopes,
      adminRights: preview.adminRights,
    },
  };
}
