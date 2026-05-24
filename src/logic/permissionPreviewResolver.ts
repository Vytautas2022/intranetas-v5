import type { User } from "../mock-db/users";
import type { AuthUser, ModulePermission } from "../auth/types";
import {
  canAccessModule,
  canAccessRoute,
  canSeeSidebarModule,
  getDefaultModulePermissions,
  normalizePermissionRole,
} from "./permissionEngine";
import {
  moduleRegistry,
  routeRegistry,
  type ModuleRegistryItem,
  type RouteRegistryItem,
} from "../modules/moduleRegistry";
import {
  adminRightsPermissions,
  moduleAccessPermissions,
  objectScopePermissions,
  permissionRoles,
  tenantScopePermissions,
  workflowAccessPermissions,
  type AdminRightsPermission,
  type ModuleAccessPermission,
  type ObjectScopePermission,
  type PermissionRole,
  type TenantScopePermission,
  type WorkflowAccessPermission,
} from "../mock-db/permissions";
import type {
  AdminModuleTabId,
} from "../modules/moduleRegistry";
import type { WorkflowType } from "../mock-db/workflowTypes";

export interface PermissionPreviewConfig {
  roles: PermissionRole[];
  moduleAccess: ModuleAccessPermission[];
  workflowAccess: WorkflowAccessPermission[];
  objectScopes: ObjectScopePermission[];
  tenantScopes: TenantScopePermission[];
  adminRights: AdminRightsPermission[];
}

export interface EffectivePermissionPreview {
  assignedRoles: PermissionRole[];
  assignedRoleIds: string[];
  moduleAccess: ModuleAccessPermission[];
  workflowAccess: WorkflowAccessPermission[];
  objectScopes: ObjectScopePermission[];
  tenantScopes: TenantScopePermission[];
  adminRights: AdminRightsPermission;
  scopeLabel: string;
  tenantScopeLabel: string;
}

export type PermissionShadowSurface = "module" | "sidebar" | "route";
export type WorkflowShadowSurface =
  | "workflow"
  | "workflow-selector"
  | "workflow-filter";

export interface PermissionShadowComparison {
  userId: string;
  userName: string;
  surface: PermissionShadowSurface;
  targetId: string;
  targetLabel: string;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
  resolverEnforced: boolean;
  mismatch: boolean;
}

export interface WorkflowShadowComparison {
  userId: string;
  userName: string;
  surface: WorkflowShadowSurface;
  workflowTypeId: string;
  workflowName: string;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
  resolverDataMissing: boolean;
  effectiveRoleNames: string[];
  mismatch: boolean;
}

type WorkflowPermissionSubject =
  | (Pick<AuthUser, "role"> & {
      assignedRoleIds?: string[];
      effectiveRoles?: PermissionRole[];
      effectivePermissionsPreview?: Pick<
        EffectivePermissionPreview,
        "workflowAccess"
      >;
    })
  | (Pick<User, "role"> & { assignedRoleIds?: string[] });

export const resolverEnforcedModuleTargets = [
  "audit",
  "roles_permissions",
  "workflow_types",
] as const;

type ResolverEnforcedModuleTarget =
  (typeof resolverEnforcedModuleTargets)[number];

export const defaultPermissionPreviewConfig: PermissionPreviewConfig = {
  roles: permissionRoles,
  moduleAccess: moduleAccessPermissions,
  workflowAccess: workflowAccessPermissions,
  objectScopes: objectScopePermissions,
  tenantScopes: tenantScopePermissions,
  adminRights: adminRightsPermissions,
};

export const isResolverEnforcedModuleTarget = (
  targetId?: string,
): targetId is ResolverEnforcedModuleTarget =>
  Boolean(
    targetId &&
      resolverEnforcedModuleTargets.includes(
        targetId as ResolverEnforcedModuleTarget,
      ),
  );

const hasResolverModuleConfig = (
  moduleId: string | undefined,
  permissionsConfig: PermissionPreviewConfig,
): moduleId is string =>
  Boolean(
    moduleId &&
      permissionsConfig.moduleAccess.some(
        (access) => access.moduleId === moduleId,
      ),
  );

const emptyAdminRights = (roleId = "preview"): AdminRightsPermission => ({
  roleId,
  canManageUsers: false,
  canManageRoles: false,
  canManageWorkflowTypes: false,
  canManageSLA: false,
  canManageAutomations: false,
  canManageIntegrations: false,
});

const dedupeById = <T extends { id: string }>(items: T[]): T[] =>
  Array.from(new Map(items.map((item) => [item.id, item])).values());

const joinUnique = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).join(", ");

// Preview-only additive role resolver. Enforcement not enabled yet.
export const resolveUserAssignedRoles = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  roles: PermissionRole[],
): PermissionRole[] => {
  const assignedRoleIds = user.assignedRoleIds || [];
  const assignedRoles = assignedRoleIds
    .map((roleId) => roles.find((role) => role.id === roleId))
    .filter((role): role is PermissionRole => Boolean(role));

  if (assignedRoles.length) return dedupeById(assignedRoles);

  const legacyRole = roles.find((role) => role.name === user.role);
  return legacyRole ? [legacyRole] : [];
};

const aggregateModuleAccess = (
  roleIds: string[],
  moduleAccess: ModuleAccessPermission[],
): ModuleAccessPermission[] => {
  const accessByModule = new Map<string, ModuleAccessPermission>();

  moduleAccess
    .filter((access) => roleIds.includes(access.roleId))
    .forEach((access) => {
      const current =
        accessByModule.get(access.moduleId) || ({
          roleId: "preview",
          moduleId: access.moduleId,
          canView: false,
          canCreate: false,
          canEdit: false,
          canAdmin: false,
        } satisfies ModuleAccessPermission);

      accessByModule.set(access.moduleId, {
        ...current,
        canView: current.canView || access.canView,
        canCreate: current.canCreate || access.canCreate,
        canEdit: current.canEdit || access.canEdit,
        canAdmin: current.canAdmin || access.canAdmin,
      });
    });

  return Array.from(accessByModule.values());
};

const aggregateWorkflowAccess = (
  roleIds: string[],
  workflowAccess: WorkflowAccessPermission[],
): WorkflowAccessPermission[] => {
  const accessByWorkflow = new Map<string, WorkflowAccessPermission>();

  workflowAccess
    .filter((access) => roleIds.includes(access.roleId))
    .forEach((access) => {
      const current =
        accessByWorkflow.get(access.workflowTypeId) || ({
          roleId: "preview",
          workflowTypeId: access.workflowTypeId,
          canView: false,
          canCreate: false,
          canTransition: false,
          canClose: false,
          canApprove: false,
          canViewAnalytics: false,
        } satisfies WorkflowAccessPermission);

      accessByWorkflow.set(access.workflowTypeId, {
        ...current,
        canView: current.canView || access.canView,
        canCreate: current.canCreate || access.canCreate,
        canTransition: current.canTransition || access.canTransition,
        canClose: current.canClose || access.canClose,
        canApprove: current.canApprove || access.canApprove,
        canViewAnalytics: current.canViewAnalytics || access.canViewAnalytics,
      });
    });

  return Array.from(accessByWorkflow.values());
};

const aggregateAdminRights = (
  roleIds: string[],
  adminRights: AdminRightsPermission[],
): AdminRightsPermission =>
  adminRights
    .filter((rights) => roleIds.includes(rights.roleId))
    .reduce<AdminRightsPermission>(
      (current, rights) => ({
        ...current,
        canManageUsers: current.canManageUsers || rights.canManageUsers,
        canManageRoles: current.canManageRoles || rights.canManageRoles,
        canManageWorkflowTypes:
          current.canManageWorkflowTypes || rights.canManageWorkflowTypes,
        canManageSLA: current.canManageSLA || rights.canManageSLA,
        canManageAutomations:
          current.canManageAutomations || rights.canManageAutomations,
        canManageIntegrations:
          current.canManageIntegrations || rights.canManageIntegrations,
      }),
      emptyAdminRights(),
    );

const getScopeLabel = (objectScopes: ObjectScopePermission[]) => {
  if (!objectScopes.length) return "Not scoped";

  return objectScopes
    .map((scope) => {
      const regionIds = joinUnique(scope.regionIds);
      const clubIds = joinUnique(scope.clubIds);
      const details = [regionIds && `regions: ${regionIds}`, clubIds && `clubs: ${clubIds}`]
        .filter(Boolean)
        .join("; ");

      return details ? `${scope.scopeType} (${details})` : scope.scopeType;
    })
    .join(", ");
};

// Preview-only additive role resolver. Enforcement not enabled yet.
export const resolveEffectivePermissionPreview = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  permissionsConfig: PermissionPreviewConfig,
): EffectivePermissionPreview => {
  const assignedRoles = resolveUserAssignedRoles(user, permissionsConfig.roles);
  const assignedRoleIds = assignedRoles.map((role) => role.id);
  const objectScopes = permissionsConfig.objectScopes.filter((scope) =>
    assignedRoleIds.includes(scope.roleId),
  );
  const tenantScopes = permissionsConfig.tenantScopes.filter((scope) =>
    assignedRoleIds.includes(scope.roleId),
  );
  const tenantScopeLabel =
    joinUnique(tenantScopes.flatMap((scope) => scope.tenantIds)) ||
    "No tenant scope";

  return {
    assignedRoles,
    assignedRoleIds,
    moduleAccess: aggregateModuleAccess(
      assignedRoleIds,
      permissionsConfig.moduleAccess,
    ),
    workflowAccess: aggregateWorkflowAccess(
      assignedRoleIds,
      permissionsConfig.workflowAccess,
    ),
    objectScopes,
    tenantScopes,
    adminRights: aggregateAdminRights(
      assignedRoleIds,
      permissionsConfig.adminRights,
    ),
    scopeLabel: getScopeLabel(objectScopes),
    tenantScopeLabel,
  };
};

// Preview-only additive role resolver. Enforcement not enabled yet.
export const getEffectiveRoles = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): PermissionRole[] => resolveUserAssignedRoles(user, permissionsConfig.roles);

const toLegacyPermissionSubject = (
  user: Pick<User, "id" | "name" | "role" | "permissions" | "modulePermissions">,
): Pick<AuthUser, "role" | "modulePermissions"> => ({
  role: user.role as AuthUser["role"],
  modulePermissions: (user.modulePermissions ||
    user.permissions ||
    getDefaultModulePermissions(user.role)) as ModulePermission[],
});

const getRouteMatch = (pathname: string): RouteRegistryItem | undefined => {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  return routeRegistry
    .filter((route) => {
      const routePath = route.path.toLowerCase().replace(/\/+$/, "") || "/";
      return path === routePath || path.startsWith(`${routePath}/`);
    })
    .sort((a, b) => b.path.length - a.path.length)[0];
};

const toResolverSubject = (
  user: Pick<AuthUser, "role"> & { assignedRoleIds?: string[] },
) => ({
  role: user.role as User["role"],
  assignedRoleIds: user.assignedRoleIds,
});

const canResolverViewModule = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  module: Pick<ModuleRegistryItem, "moduleId">,
  permissionsConfig: PermissionPreviewConfig,
): boolean => {
  const preview = resolveEffectivePermissionPreview(user, permissionsConfig);
  const roleNames = preview.assignedRoles.map((role) => role.name);
  if (roleNames.includes("SUPER_ADMIN")) return true;

  return preview.moduleAccess.some(
    (access) => access.moduleId === module.moduleId && access.canView,
  );
};

export const canAccessModuleResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  moduleId?: string,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): boolean => {
  const legacyAllowed = canAccessModule(user, moduleId);
  if (!user || !moduleId) return legacyAllowed;
  if (user.role === "SUPER_ADMIN") return true;
  if (!hasResolverModuleConfig(moduleId, permissionsConfig)) {
    return legacyAllowed;
  }

  const preview = resolveEffectivePermissionPreview(
    toResolverSubject(user),
    permissionsConfig,
  );
  const resolverAccess = preview.moduleAccess.find(
    (access) => access.moduleId === moduleId,
  );

  if (!preview.assignedRoles.length || !resolverAccess) return legacyAllowed;

  return resolverAccess.canView;
};

export const canSeeSidebarModuleResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  moduleId?: string,
  hidden?: boolean,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): boolean => {
  const legacyAllowed = canSeeSidebarModule(user, moduleId, hidden);
  if (!moduleId || !hasResolverModuleConfig(moduleId, permissionsConfig)) {
    return legacyAllowed;
  }
  if (hidden && user?.role !== "SUPER_ADMIN") return false;

  return canAccessModuleResolver(user, moduleId, permissionsConfig);
};

export const canAccessAdminTabResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  adminTabId: AdminModuleTabId,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): boolean => {
  if (!hasResolverModuleConfig(adminTabId, permissionsConfig)) return true;

  return canAccessModuleResolver(user, adminTabId, permissionsConfig);
};

export const canAccessRouteResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  pathname: string,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): boolean => {
  const legacyAllowed = canAccessRoute(user, pathname);
  const route = getRouteMatch(pathname);
  if (!route) return legacyAllowed;

  const targetId =
    route.adminTabId && hasResolverModuleConfig(route.adminTabId, permissionsConfig)
      ? route.adminTabId
      : route.moduleId;
  if (!hasResolverModuleConfig(targetId, permissionsConfig)) {
    return legacyAllowed;
  }

  return canAccessModuleResolver(user, targetId, permissionsConfig);
};

export const getFirstAllowedRoute = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): string => {
  const visibleModuleRoute = moduleRegistry
    .filter((module) => module.sidebarVisibility === "visible")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((module) =>
      canAccessRouteResolver(user, `/${module.route}`, permissionsConfig),
    );

  if (visibleModuleRoute) return `/${visibleModuleRoute.route}`;

  const allowedRoute = routeRegistry.find((route) =>
    canAccessRouteResolver(user, route.path, permissionsConfig),
  );

  return allowedRoute?.path || "/darbai";
};

const createComparison = ({
  user,
  surface,
  targetId,
  targetLabel,
  legacyAllowed,
  resolverAllowed,
  resolverEnforced,
}: {
  user: Pick<User, "id" | "name">;
  surface: PermissionShadowSurface;
  targetId: string;
  targetLabel: string;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
  resolverEnforced: boolean;
}): PermissionShadowComparison => ({
  userId: user.id,
  userName: user.name,
  surface,
  targetId,
  targetLabel,
  legacyAllowed,
  resolverAllowed,
  resolverEnforced,
  mismatch: legacyAllowed !== resolverAllowed,
});

// Preview-only additive role resolver. Enforcement not enabled yet.
export const compareLegacyVsResolverAccess = (
  user: Pick<
    User,
    | "id"
    | "name"
    | "role"
    | "assignedRoleIds"
    | "permissions"
    | "modulePermissions"
  >,
  permissionsConfig: PermissionPreviewConfig,
): PermissionShadowComparison[] => {
  const legacyUser = toLegacyPermissionSubject(user);
  const moduleComparisons = moduleRegistry.map((module) =>
    createComparison({
      user,
      surface: "module",
      targetId: module.moduleId,
      targetLabel: module.title,
      legacyAllowed: canAccessModule(legacyUser, module.moduleId),
      resolverAllowed: canResolverViewModule(user, module, permissionsConfig),
      resolverEnforced: hasResolverModuleConfig(
        module.moduleId,
        permissionsConfig,
      ),
    }),
  );
  const sidebarComparisons = moduleRegistry.map((module) =>
    createComparison({
      user,
      surface: "sidebar",
      targetId: module.moduleId,
      targetLabel: module.title,
      legacyAllowed: canSeeSidebarModule(
        legacyUser,
        module.permissionKey || module.moduleId,
        module.sidebarVisibility === "hidden",
      ),
      resolverAllowed:
        module.sidebarVisibility !== "hidden" &&
        canResolverViewModule(user, module, permissionsConfig),
      resolverEnforced: hasResolverModuleConfig(
        module.moduleId,
        permissionsConfig,
      ),
    }),
  );
  const routeComparisons = routeRegistry.map((route: RouteRegistryItem) =>
    {
      const targetId =
        route.adminTabId && hasResolverModuleConfig(route.adminTabId, permissionsConfig)
          ? route.adminTabId
          : route.moduleId;
      return createComparison({
        user,
        surface: "route",
        targetId: route.path,
        targetLabel: route.path,
        legacyAllowed: canAccessRoute(legacyUser, route.path),
        resolverAllowed: canResolverViewModule(
          user,
          { moduleId: targetId },
          permissionsConfig,
        ),
        resolverEnforced: hasResolverModuleConfig(targetId, permissionsConfig),
      });
    },
  );

  return [...moduleComparisons, ...sidebarComparisons, ...routeComparisons];
};

const canLegacyViewWorkflow = (
  user: Pick<User, "role">,
  workflow: Pick<WorkflowType, "allowedRoles">,
): boolean => {
  const role = normalizePermissionRole(user.role);
  return (
    role === "SUPER_ADMIN" ||
    !workflow.allowedRoles?.length ||
    workflow.allowedRoles.includes(role)
  );
};

const getWorkflowPermissionPreview = (
  user: WorkflowPermissionSubject,
  permissionsConfig: PermissionPreviewConfig,
): Pick<EffectivePermissionPreview, "assignedRoles" | "workflowAccess"> => {
  const hydratedWorkflowAccess =
    "effectivePermissionsPreview" in user
      ? user.effectivePermissionsPreview?.workflowAccess
      : undefined;
  const hydratedRoles =
    "effectiveRoles" in user ? user.effectiveRoles : undefined;

  if (hydratedWorkflowAccess && hydratedRoles) {
    return {
      assignedRoles: hydratedRoles,
      workflowAccess: hydratedWorkflowAccess,
    };
  }

  return resolveEffectivePermissionPreview(user, permissionsConfig);
};

const hasResolverWorkflowConfig = (
  workflowTypeId: string | undefined,
  permissionsConfig: PermissionPreviewConfig,
): workflowTypeId is string =>
  Boolean(
    workflowTypeId &&
      permissionsConfig.workflowAccess.some(
        (access) => access.workflowTypeId === workflowTypeId,
      ),
  );

export const canViewWorkflowResolver = (
  user: WorkflowPermissionSubject | null | undefined,
  workflow: WorkflowType,
  permissionsConfig: PermissionPreviewConfig = defaultPermissionPreviewConfig,
): boolean => {
  if (!user) return false;

  const legacyAllowed = canLegacyViewWorkflow(user, workflow);
  const normalizedRole = normalizePermissionRole(user.role);
  if (normalizedRole === "SUPER_ADMIN") return true;
  if (!hasResolverWorkflowConfig(workflow.id, permissionsConfig)) {
    return legacyAllowed;
  }

  const preview = getWorkflowPermissionPreview(user, permissionsConfig);
  if (preview.assignedRoles.some((role) => role.name === "SUPER_ADMIN")) {
    return true;
  }

  const resolverAccess = preview.workflowAccess.find(
    (access) => access.workflowTypeId === workflow.id,
  );

  if (!preview.assignedRoles.length || !resolverAccess) return legacyAllowed;

  return resolverAccess.canView;
};

const createWorkflowComparison = ({
  user,
  surface,
  workflow,
  legacyAllowed,
  resolverAllowed,
  resolverDataMissing,
  effectiveRoleNames,
}: {
  user: Pick<User, "id" | "name">;
  surface: WorkflowShadowSurface;
  workflow: Pick<WorkflowType, "id" | "label" | "name">;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
  resolverDataMissing: boolean;
  effectiveRoleNames: string[];
}): WorkflowShadowComparison => ({
  userId: user.id,
  userName: user.name,
  surface,
  workflowTypeId: workflow.id,
  workflowName: workflow.label || workflow.name,
  legacyAllowed,
  resolverAllowed,
  resolverDataMissing,
  effectiveRoleNames,
  mismatch: legacyAllowed !== resolverAllowed,
});

// Preview-only workflow visibility shadow comparison. Enforcement not enabled yet.
export const compareLegacyVsResolverWorkflowAccess = (
  user: Pick<User, "id" | "name" | "role" | "assignedRoleIds">,
  workflows: WorkflowType[],
  permissionsConfig: PermissionPreviewConfig,
): WorkflowShadowComparison[] => {
  const preview = resolveEffectivePermissionPreview(user, permissionsConfig);
  const effectiveRoleNames = preview.assignedRoles.map((role) => role.name);
  const isSuperAdmin =
    normalizePermissionRole(user.role) === "SUPER_ADMIN" ||
    effectiveRoleNames.includes("SUPER_ADMIN");
  const surfaces: WorkflowShadowSurface[] = [
    "workflow",
    "workflow-selector",
    "workflow-filter",
  ];

  return workflows.flatMap((workflow) => {
    const legacyAllowed = canLegacyViewWorkflow(user, workflow);
    const resolverAccess = preview.workflowAccess.find(
      (access) => access.workflowTypeId === workflow.id,
    );
    const resolverDataMissing =
      !preview.assignedRoles.length ||
      !hasResolverWorkflowConfig(workflow.id, permissionsConfig) ||
      !resolverAccess;
    const resolverAllowed = isSuperAdmin
      ? true
      : resolverDataMissing
        ? legacyAllowed
        : resolverAccess.canView;

    return surfaces.map((surface) =>
      createWorkflowComparison({
        user,
        surface,
        workflow,
        legacyAllowed,
        resolverAllowed,
        resolverDataMissing,
        effectiveRoleNames,
      }),
    );
  });
};
