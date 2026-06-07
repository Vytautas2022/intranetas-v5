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
  "role" | "modulePermissions" | "effectivePermissionsPreview"
> | null | undefined;

export const normalizePermissionRole = (role?: string): UserRole =>
  ((role || "EXTERNAL").trim().toUpperCase() as UserRole) || "EXTERNAL";

export const getDefaultModulePermissions = (
  _role?: string,
): ModulePermission[] => [];

export const getUserModulePermissions = (
  user: PermissionSubject,
): PermissionKey[] => {
  if (!user) return [];

  const configuredPermissions = user.modulePermissions || [];
  const previewPermissions =
    user.effectivePermissionsPreview?.moduleAccess
      .filter((access) => access.canView)
      .map((access) => access.moduleId) || [];

  return Array.from(new Set([...configuredPermissions, ...previewPermissions]));
};

export const isSuperAdmin = (user: PermissionSubject): boolean =>
  false;

export const hasPermissionConfig = (user: PermissionSubject): boolean =>
  getUserModulePermissions(user).length > 0;

export const canAccessPermission = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
): boolean => {
  if (!permissionKey) return true;
  if (!user) return false;

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
  if (hidden) return false;
  return canAccessPermission(user, permissionKey);
};

export const canSeeSubmodule = (
  user: PermissionSubject,
  permissionKey?: PermissionKey,
  allowedRoles?: UserRole | UserRole[],
): boolean => {
  if (!canAccessSubmodule(user, permissionKey)) return false;
  return true;
};

export const canManageAllClubs = (user: PermissionSubject): boolean =>
  canAccessPermission(user, "admin");

export const canManagePeriodicTasks = (user: PermissionSubject): boolean =>
  canAccessPermission(user, "periodiniai") || canAccessPermission(user, "darbai");
