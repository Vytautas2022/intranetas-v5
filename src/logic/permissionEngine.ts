import type { AuthUser, ModulePermission } from "../auth/types";
import type { UserRole } from "../types/roles";
import {
  moduleRegistry,
  routeRegistry,
  type RouteRegistryItem,
} from "../modules/moduleRegistry";

type PermissionKey = ModulePermission | string;

type PermissionSubject = Pick<
  AuthUser,
  "role" | "modulePermissions"
> | null | undefined;

const DEFAULT_ROLE_MODULE_PERMISSIONS: Record<UserRole, ModulePermission[]> = {
  SUPER_ADMIN: [
    "darbai",
    "gedimai",
    "periodiniai",
    "admin",
    "analytics",
    "audit",
    "orders",
    "zmones",
    "ceo",
  ],
  ADMIN: [
    "darbai",
    "gedimai",
    "periodiniai",
    "admin",
    "analytics",
    "audit",
    "orders",
    "zmones",
    "ceo",
  ],
  OPS: [
    "darbai",
    "gedimai",
    "periodiniai",
    "admin",
    "analytics",
    "audit",
    "orders",
    "zmones",
    "ceo",
  ],
  COORDINATOR: ["darbai", "gedimai", "periodiniai", "analytics", "orders"],
  CS: ["darbai", "gedimai", "analytics", "zmones"],
  ACCOUNTING: ["orders", "audit"],
  EXTERNAL: ["darbai"],
};

export const normalizePermissionRole = (role?: string): UserRole =>
  ((role || "EXTERNAL").trim().toUpperCase() as UserRole) || "EXTERNAL";

export const getDefaultModulePermissions = (
  role?: string,
): ModulePermission[] =>
  DEFAULT_ROLE_MODULE_PERMISSIONS[normalizePermissionRole(role)] ||
  DEFAULT_ROLE_MODULE_PERMISSIONS.EXTERNAL;

export const getUserModulePermissions = (
  user: PermissionSubject,
): PermissionKey[] => user?.modulePermissions || [];

export const isSuperAdmin = (user: PermissionSubject): boolean =>
  normalizePermissionRole(user?.role) === "SUPER_ADMIN";

export const hasPermissionConfig = (user: PermissionSubject): boolean =>
  getUserModulePermissions(user).length > 0;

export const canAccessPermission = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
): boolean => {
  if (!permissionKey) return true;
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const permissions = getUserModulePermissions(user);
  if (permissions.length === 0) return false;

  return permissions.includes(permissionKey);
};

export const getModulePermissionKey = (
  moduleId?: string,
): PermissionKey | undefined =>
  moduleRegistry.find((module) => module.moduleId === moduleId)?.permissionKey ||
  moduleId;

export const canAccessModule = (
  user: PermissionSubject,
  moduleId?: string,
): boolean => canAccessPermission(user, getModulePermissionKey(moduleId));

const getRouteMatch = (pathname: string): RouteRegistryItem | undefined => {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return routeRegistry
    .filter((route) => {
      const routePath = route.path.toLowerCase().replace(/\/+$/, "") || "/";
      return path === routePath || path.startsWith(`${routePath}/`);
    })
    .sort((a, b) => b.path.length - a.path.length)[0];
};

export const canAccessSubmodule = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
): boolean => canAccessPermission(user, permissionKey);

export const canAccessRoute = (
  user: PermissionSubject,
  pathname: string,
): boolean => {
  const match = getRouteMatch(pathname);
  if (!match) return true;

  const routeModuleAllowed = canAccessModule(user, match.moduleId);
  const routePermissionAllowed = canAccessSubmodule(user, match.permissionKey);

  return routeModuleAllowed && routePermissionAllowed;
};

export const canSeeSidebarModule = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
  hidden?: boolean,
): boolean => {
  if (isSuperAdmin(user)) return true;
  if (hidden) return false;
  return canAccessPermission(user, permissionKey);
};

export const canSeeSubmodule = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
  allowedRoles?: UserRole | UserRole[],
): boolean => {
  if (!canAccessSubmodule(user, permissionKey)) return false;
  if (!allowedRoles) return true;

  const role = normalizePermissionRole(user?.role);
  return Array.isArray(allowedRoles)
    ? allowedRoles.includes(role)
    : role === allowedRoles;
};

export const canManageAllClubs = (user: PermissionSubject): boolean =>
  ["SUPER_ADMIN", "ADMIN", "OPS"].includes(normalizePermissionRole(user?.role));

export const canManagePeriodicTasks = (user: PermissionSubject): boolean =>
  ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR"].includes(
    normalizePermissionRole(user?.role),
  );
