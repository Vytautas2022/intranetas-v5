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
import { getOrderWorkflowModuleId, getOrderWorkflowTypeId } from "./workflowPurpose";

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

export type ActionPermissionType =
  | "workflow-card-create"
  | "workflow-card-edit"
  | "assignee-change"
  | "comments-edit-delete"
  | "checklist-edit"
  | "kanban-drag-drop"
  | "status-dropdown"
  | "waiting-modal"
  | "workflow-card-close"
  | "orders-create"
  | "workflow-item-approve"
  | "admin-config-edit";

export interface ActionPermissionComparison {
  userId: string;
  userName: string;
  action: ActionPermissionType;
  targetId: string;
  targetLabel: string;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
  noEnforcement: true;
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

export const MOCK_PERMISSION_CONFIG_STORAGE_KEY =
  "sg_mock_permissions_config";

const isBrowserStorageAvailable = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const clonePermissionPreviewConfig = (
  config: PermissionPreviewConfig,
): PermissionPreviewConfig => ({
  roles: [...config.roles],
  moduleAccess: [...config.moduleAccess],
  workflowAccess: [...config.workflowAccess],
  objectScopes: [...config.objectScopes],
  tenantScopes: [...config.tenantScopes],
  adminRights: [...config.adminRights],
});

const isPermissionPreviewConfig = (
  value: unknown,
): value is PermissionPreviewConfig => {
  const candidate = value as Partial<PermissionPreviewConfig> | null;
  return Boolean(
    candidate &&
      Array.isArray(candidate.roles) &&
      Array.isArray(candidate.moduleAccess) &&
      Array.isArray(candidate.workflowAccess) &&
      Array.isArray(candidate.objectScopes) &&
      Array.isArray(candidate.tenantScopes) &&
      Array.isArray(candidate.adminRights),
  );
};

export const loadMockPermissionConfig = (): PermissionPreviewConfig => {
  if (!isBrowserStorageAvailable()) {
    return clonePermissionPreviewConfig(defaultPermissionPreviewConfig);
  }

  try {
    const raw = window.localStorage.getItem(MOCK_PERMISSION_CONFIG_STORAGE_KEY);
    if (!raw) return clonePermissionPreviewConfig(defaultPermissionPreviewConfig);

    const parsed = JSON.parse(raw);
    if (!isPermissionPreviewConfig(parsed)) {
      return clonePermissionPreviewConfig(defaultPermissionPreviewConfig);
    }

    return parsed;
  } catch {
    return clonePermissionPreviewConfig(defaultPermissionPreviewConfig);
  }
};

export const saveMockPermissionConfig = (
  config: PermissionPreviewConfig,
): void => {
  if (!isBrowserStorageAvailable()) return;
  window.localStorage.setItem(
    MOCK_PERMISSION_CONFIG_STORAGE_KEY,
    JSON.stringify(config),
  );
};

export const resetMockPermissionConfig = (): PermissionPreviewConfig => {
  if (isBrowserStorageAvailable()) {
    window.localStorage.removeItem(MOCK_PERMISSION_CONFIG_STORAGE_KEY);
  }

  return clonePermissionPreviewConfig(defaultPermissionPreviewConfig);
};

const resolvePermissionPreviewConfig = (
  permissionsConfig?: PermissionPreviewConfig,
): PermissionPreviewConfig =>
  permissionsConfig || loadMockPermissionConfig();

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
  permissionsConfig?: PermissionPreviewConfig,
): EffectivePermissionPreview => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const assignedRoles = resolveUserAssignedRoles(user, effectiveConfig.roles);
  const assignedRoleIds = assignedRoles.map((role) => role.id);
  const objectScopes = effectiveConfig.objectScopes.filter((scope) =>
    assignedRoleIds.includes(scope.roleId),
  );
  const tenantScopes = effectiveConfig.tenantScopes.filter((scope) =>
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
      effectiveConfig.moduleAccess,
    ),
    workflowAccess: aggregateWorkflowAccess(
      assignedRoleIds,
      effectiveConfig.workflowAccess,
    ),
    objectScopes,
    tenantScopes,
    adminRights: aggregateAdminRights(
      assignedRoleIds,
      effectiveConfig.adminRights,
    ),
    scopeLabel: getScopeLabel(objectScopes),
    tenantScopeLabel,
  };
};

// Preview-only additive role resolver. Enforcement not enabled yet.
export const getEffectiveRoles = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  permissionsConfig?: PermissionPreviewConfig,
): PermissionRole[] =>
  resolveUserAssignedRoles(user, resolvePermissionPreviewConfig(permissionsConfig).roles);

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

const hasAssignedRoleIds = (
  user:
    | { assignedRoleIds?: string[] }
    | null
    | undefined,
): boolean => Boolean(user?.assignedRoleIds?.length);

const canUseMigrationFallback = (
  user:
    | { assignedRoleIds?: string[] }
    | null
    | undefined,
): boolean => !hasAssignedRoleIds(user);

const canResolverViewModule = (
  user: Pick<User, "role" | "assignedRoleIds"> | Partial<User>,
  module: Pick<ModuleRegistryItem, "moduleId">,
  permissionsConfig: PermissionPreviewConfig,
): boolean => {
  const preview = resolveEffectivePermissionPreview(user, permissionsConfig);
  return preview.moduleAccess.some(
    (access) => access.moduleId === module.moduleId && access.canView,
  );
};

export const canAccessModuleResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  moduleId?: string,
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const legacyAllowed = canAccessModule(user, moduleId);
  if (!user || !moduleId) return false;
  if (!hasResolverModuleConfig(moduleId, effectiveConfig)) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }

  const preview = resolveEffectivePermissionPreview(
    toResolverSubject(user),
    effectiveConfig,
  );
  const resolverAccess = preview.moduleAccess.find(
    (access) => access.moduleId === moduleId,
  );

  if (!preview.assignedRoles.length || !resolverAccess) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }

  return resolverAccess.canView;
};

export const canSeeSidebarModuleResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  moduleId?: string,
  hidden?: boolean,
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const legacyAllowed = canSeeSidebarModule(user, moduleId, hidden);
  if (!moduleId || !hasResolverModuleConfig(moduleId, effectiveConfig)) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }
  if (hidden) return false;

  return canAccessModuleResolver(user, moduleId, effectiveConfig);
};

export const canAccessAdminTabResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  adminTabId: AdminModuleTabId,
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  if (!hasResolverModuleConfig(adminTabId, effectiveConfig)) {
    return canAccessModuleResolver(user, "admin", effectiveConfig);
  }

  return canAccessModuleResolver(user, adminTabId, effectiveConfig);
};

export const canAccessRouteResolver = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  pathname: string,
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const legacyAllowed = canAccessRoute(user, pathname);
  const route = getRouteMatch(pathname);
  if (!route) return legacyAllowed;

  const targetId =
    route.adminTabId && hasResolverModuleConfig(route.adminTabId, effectiveConfig)
      ? route.adminTabId
      : route.moduleId;
  if (!hasResolverModuleConfig(targetId, effectiveConfig)) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }

  return canAccessModuleResolver(user, targetId, effectiveConfig);
};

export const getFirstAllowedRoute = (
  user: (Pick<AuthUser, "role" | "modulePermissions"> & {
    assignedRoleIds?: string[];
  }) | null | undefined,
  permissionsConfig?: PermissionPreviewConfig,
): string => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const visibleModuleRoute = moduleRegistry
    .filter((module) => module.sidebarVisibility === "visible")
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .find((module) =>
      canAccessRouteResolver(user, `/${module.route}`, effectiveConfig),
    );

  if (visibleModuleRoute) return `/${visibleModuleRoute.route}`;

  const allowedRoute = routeRegistry.find((route) =>
    canAccessRouteResolver(user, route.path, effectiveConfig),
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
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  if (!user) return false;

  const legacyAllowed = canLegacyViewWorkflow(user, workflow);
  if (!hasResolverWorkflowConfig(workflow.id, effectiveConfig)) {
    const preview = getWorkflowPermissionPreview(user, effectiveConfig);
    const fullAccessRoleIds = new Set(["role-super-admin", "role-admin", "role-ops"]);
    const hasFullAccess = preview.assignedRoles.some((r) => fullAccessRoleIds.has(r.id));
    return hasFullAccess || legacyAllowed;
  }

  const preview = getWorkflowPermissionPreview(user, effectiveConfig);

  const resolverAccess = preview.workflowAccess.find(
    (access) => access.workflowTypeId === workflow.id,
  );

  if (!preview.assignedRoles.length || !resolverAccess) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }

  return resolverAccess.canView;
};

const getPreviewForAction = (
  user: WorkflowPermissionSubject | null | undefined,
  permissionsConfig: PermissionPreviewConfig,
): Pick<EffectivePermissionPreview, "assignedRoles" | "moduleAccess" | "workflowAccess" | "adminRights"> => {
  if (!user) {
    return {
      assignedRoles: [],
      moduleAccess: [],
      workflowAccess: [],
      adminRights: emptyAdminRights(),
    };
  }

  const workflowPreview = getWorkflowPermissionPreview(user, permissionsConfig);
  const fullPreview = resolveEffectivePermissionPreview(user, permissionsConfig);
  return {
    assignedRoles: workflowPreview.assignedRoles,
    workflowAccess: workflowPreview.workflowAccess,
    moduleAccess: fullPreview.moduleAccess,
    adminRights: fullPreview.adminRights,
  };
};

const getWorkflowActionAccess = (
  user: WorkflowPermissionSubject | null | undefined,
  workflowTypeId: string | undefined,
  permission: keyof Pick<
    WorkflowAccessPermission,
    "canCreate" | "canTransition" | "canClose" | "canApprove" | "canView"
  >,
  permissionsConfig: PermissionPreviewConfig,
): boolean => {
  const preview = getPreviewForAction(user, permissionsConfig);
  if (!workflowTypeId) return false;

  return Boolean(
    preview.workflowAccess.find(
      (access) => access.workflowTypeId === workflowTypeId,
    )?.[permission],
  );
};

const getModuleActionAccess = (
  user: WorkflowPermissionSubject | null | undefined,
  moduleId: string | undefined,
  permission: keyof Pick<
    ModuleAccessPermission,
    "canCreate" | "canEdit" | "canAdmin" | "canView"
  >,
  permissionsConfig: PermissionPreviewConfig,
): boolean => {
  const preview = getPreviewForAction(user, permissionsConfig);
  if (!moduleId) return false;

  return Boolean(
    preview.moduleAccess.find((access) => access.moduleId === moduleId)?.[
      permission
    ],
  );
};

const getCardWorkflowTypeId = (card: { workflowTypeId?: string }) =>
  card.workflowTypeId;

const getCardModuleId = (card: {
  moduleId?: string;
  type?: string;
  entityType?: string;
}) => {
  if (card.moduleId) return card.moduleId;
  if (card.type === "ORDER" || card.entityType === "order") return "orders";
  return "darbai";
};

// Preview-only action permission helpers. Enforcement not enabled yet.
export const canCreateWorkflowCardPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  workflowTypeId: string,
  moduleId = "darbai",
  permissionsConfig?: PermissionPreviewConfig,
): boolean =>
  getModuleActionAccess(user, moduleId, "canCreate", resolvePermissionPreviewConfig(permissionsConfig)) &&
  getWorkflowActionAccess(
    user,
    workflowTypeId,
    "canCreate",
    resolvePermissionPreviewConfig(permissionsConfig),
  );

export const canCreateWorkflowCardResolver = (
  user: WorkflowPermissionSubject | null | undefined,
  workflowTypeId: string,
  moduleId = "darbai",
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  if (!user) return false;

  const legacyAllowed =
    canAccessModule(
      {
        role: user.role as AuthUser["role"],
        modulePermissions:
          (user as { modulePermissions?: ModulePermission[] }).modulePermissions ||
          getDefaultModulePermissions(user.role),
      },
    moduleId,
  );

  if (
    !hasResolverModuleConfig(moduleId, effectiveConfig) ||
    !hasResolverWorkflowConfig(workflowTypeId, effectiveConfig)
  ) {
    return legacyAllowed;
  }

  const preview = getPreviewForAction(user, effectiveConfig);
  if (!preview.assignedRoles.length) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }

  const moduleAccess = preview.moduleAccess.find(
    (access) => access.moduleId === moduleId,
  );
  const workflowAccess = preview.workflowAccess.find(
    (access) => access.workflowTypeId === workflowTypeId,
  );

  if (!moduleAccess || !workflowAccess) {
    return canUseMigrationFallback(user) ? legacyAllowed : false;
  }
  return moduleAccess.canCreate && workflowAccess.canCreate;
};

export const canEditWorkflowCardPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  card: { workflowTypeId?: string; moduleId?: string; type?: string; entityType?: string },
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const workflowTypeId = getCardWorkflowTypeId(card);
  return (
    getModuleActionAccess(
      user,
      getCardModuleId(card),
      "canEdit",
      effectiveConfig,
    ) &&
    (!workflowTypeId ||
      getWorkflowActionAccess(user, workflowTypeId, "canView", effectiveConfig))
  );
};

export const canTransitionWorkflowCardPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  card: { workflowTypeId?: string },
  _fromStatus: string,
  _toStatus: string,
  permissionsConfig?: PermissionPreviewConfig,
): boolean =>
  getWorkflowActionAccess(
    user,
    getCardWorkflowTypeId(card),
    "canTransition",
    resolvePermissionPreviewConfig(permissionsConfig),
  );

export const canCloseWorkflowCardPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  card: { workflowTypeId?: string },
  _terminalStatus: string,
  permissionsConfig?: PermissionPreviewConfig,
): boolean =>
  getWorkflowActionAccess(
    user,
    getCardWorkflowTypeId(card),
    "canClose",
    resolvePermissionPreviewConfig(permissionsConfig),
  );

export const canApproveWorkflowItemPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  item: { workflowTypeId?: string; moduleId?: string; type?: string; entityType?: string },
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const workflowTypeId = getCardWorkflowTypeId(item);
  if (workflowTypeId) {
    return getWorkflowActionAccess(
      user,
      workflowTypeId,
      "canApprove",
      effectiveConfig,
    );
  }

  return getModuleActionAccess(
    user,
    getCardModuleId(item),
    "canAdmin",
    effectiveConfig,
  );
};

export const canEditAdminConfigPreview = (
  user: WorkflowPermissionSubject | null | undefined,
  configArea: keyof Omit<AdminRightsPermission, "roleId"> | string,
  permissionsConfig?: PermissionPreviewConfig,
): boolean => {
  const effectiveConfig = resolvePermissionPreviewConfig(permissionsConfig);
  const preview = getPreviewForAction(user, effectiveConfig);

  if (configArea in preview.adminRights) {
    return Boolean(
      preview.adminRights[configArea as keyof Omit<AdminRightsPermission, "roleId">],
    );
  }

  return getModuleActionAccess(user, configArea, "canAdmin", effectiveConfig);
};

const isLegacyOpsAdmin = (role: string | undefined) => {
  const normalizedRole = normalizePermissionRole(role);
  return (
    normalizedRole === "SUPER_ADMIN" ||
    normalizedRole === "ADMIN" ||
    normalizedRole === "OPS"
  );
};

const createActionComparison = ({
  user,
  action,
  targetId,
  targetLabel,
  legacyAllowed,
  resolverAllowed,
}: {
  user: Pick<User, "id" | "name">;
  action: ActionPermissionType;
  targetId: string;
  targetLabel: string;
  legacyAllowed: boolean;
  resolverAllowed: boolean;
}): ActionPermissionComparison => ({
  userId: user.id,
  userName: user.name,
  action,
  targetId,
  targetLabel,
  legacyAllowed,
  resolverAllowed,
  noEnforcement: true,
  mismatch: legacyAllowed !== resolverAllowed,
});

// Preview-only action permission shadow comparison. Enforcement not enabled yet.
export const compareLegacyVsResolverActionAccess = (
  user: Pick<User, "id" | "name" | "role" | "assignedRoleIds">,
  workflows: WorkflowType[],
  permissionsConfig: PermissionPreviewConfig,
): ActionPermissionComparison[] => {
  const normalizedRole = normalizePermissionRole(user.role);
  const activeWorkflow = workflows[0];
  const activeWorkflowId = activeWorkflow?.id || "unknown-workflow";
  const activeWorkflowLabel =
    activeWorkflow?.label || activeWorkflow?.name || activeWorkflowId;
  const sampleCard = {
    workflowTypeId: activeWorkflowId,
    moduleId: "darbai",
  };
  const orderWorkflowTypeId = getOrderWorkflowTypeId(workflows);
  const orderWorkflowModuleId = getOrderWorkflowModuleId(workflows);
  const legacyWorkflowVisible = activeWorkflow
    ? canLegacyViewWorkflow(user, activeWorkflow)
    : false;
  const legacyEditAllowed =
    isLegacyOpsAdmin(user.role) || normalizedRole === "COORDINATOR";

  const comparisons: ActionPermissionComparison[] = workflows.flatMap(
    (workflow) =>
      [
        createActionComparison({
          user,
          action: "workflow-card-create",
          targetId: workflow.id,
          targetLabel: workflow.label || workflow.name,
          legacyAllowed: canLegacyViewWorkflow(user, workflow),
          resolverAllowed: canCreateWorkflowCardPreview(
            user,
            workflow.id,
            "darbai",
            permissionsConfig,
          ),
        }),
      ],
  );

  comparisons.push(
    createActionComparison({
      user,
      action: "workflow-card-edit",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} card edit`,
      legacyAllowed: legacyEditAllowed || legacyWorkflowVisible,
      resolverAllowed: canEditWorkflowCardPreview(
        user,
        sampleCard,
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "assignee-change",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} assignee change`,
      legacyAllowed: legacyEditAllowed,
      resolverAllowed: canEditWorkflowCardPreview(
        user,
        sampleCard,
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "comments-edit-delete",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} comments edit/delete`,
      legacyAllowed: legacyWorkflowVisible,
      resolverAllowed: canEditWorkflowCardPreview(
        user,
        sampleCard,
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "checklist-edit",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} checklist edit`,
      legacyAllowed: legacyWorkflowVisible,
      resolverAllowed: canEditWorkflowCardPreview(
        user,
        sampleCard,
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "kanban-drag-drop",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} Kanban drag/drop`,
      legacyAllowed: legacyWorkflowVisible,
      resolverAllowed: canTransitionWorkflowCardPreview(
        user,
        sampleCard,
        "new",
        "in_progress",
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "status-dropdown",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} status dropdown`,
      legacyAllowed: legacyWorkflowVisible,
      resolverAllowed: canTransitionWorkflowCardPreview(
        user,
        sampleCard,
        "new",
        "in_progress",
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "waiting-modal",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} Laukiama modal`,
      legacyAllowed: legacyWorkflowVisible,
      resolverAllowed: canTransitionWorkflowCardPreview(
        user,
        sampleCard,
        "in_progress",
        "waiting_details",
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "workflow-card-close",
      targetId: activeWorkflowId,
      targetLabel: `${activeWorkflowLabel} Atlikta / Atmesta`,
      legacyAllowed: isLegacyOpsAdmin(user.role),
      resolverAllowed: canCloseWorkflowCardPreview(
        user,
        sampleCard,
        "fixed",
        permissionsConfig,
      ),
    }),
    createActionComparison({
      user,
      action: "orders-create",
      targetId: orderWorkflowTypeId || "order-workflow",
      targetLabel: "Orders create",
      legacyAllowed: Boolean(orderWorkflowModuleId) &&
        canAccessModule(
          toLegacyPermissionSubject({
            ...user,
            permissions: undefined,
            modulePermissions: undefined,
          }),
          orderWorkflowModuleId,
        ),
      resolverAllowed: Boolean(orderWorkflowTypeId && orderWorkflowModuleId) &&
        canCreateWorkflowCardPreview(
          user,
          orderWorkflowTypeId,
          orderWorkflowModuleId,
          permissionsConfig,
        ),
    }),
    createActionComparison({
      user,
      action: "workflow-item-approve",
      targetId: orderWorkflowTypeId || "order-workflow",
      targetLabel: "Orders approve",
      legacyAllowed: isLegacyOpsAdmin(user.role),
      resolverAllowed: Boolean(orderWorkflowTypeId && orderWorkflowModuleId) &&
        canApproveWorkflowItemPreview(
          user,
          {
            workflowTypeId: orderWorkflowTypeId,
            moduleId: orderWorkflowModuleId,
            type: "ORDER",
          },
          permissionsConfig,
        ),
    }),
  );

  const adminConfigAreas: Array<{
    id: keyof Omit<AdminRightsPermission, "roleId">;
    label: string;
  }> = [
    { id: "canManageUsers", label: "Users admin config" },
    { id: "canManageRoles", label: "Roles admin config" },
    { id: "canManageWorkflowTypes", label: "Workflow Types config" },
    { id: "canManageSLA", label: "SLA config" },
    { id: "canManageAutomations", label: "Periodic automations config" },
    { id: "canManageIntegrations", label: "Integrations config" },
  ];

  adminConfigAreas.forEach((area) => {
    comparisons.push(
      createActionComparison({
        user,
        action: "admin-config-edit",
        targetId: area.id,
        targetLabel: area.label,
        legacyAllowed: isLegacyOpsAdmin(user.role),
        resolverAllowed: canEditAdminConfigPreview(
          user,
          area.id,
          permissionsConfig,
        ),
      }),
    );
  });

  return comparisons;
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
