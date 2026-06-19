import { workflowTypes } from "./workflowTypes";

export type ObjectScopeType = "ALL" | "REGION" | "CLUBS" | "OWN_ONLY";

export interface PermissionRole {
  id: string;
  name: string;
  description: string;
  active: boolean;
  systemRole: boolean;
}

export interface ModuleAccessPermission {
  roleId: string;
  moduleId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canAdmin: boolean;
}

export interface WorkflowAccessPermission {
  roleId: string;
  workflowTypeId: string;
  canView: boolean;
  canCreate: boolean;
  canTransition: boolean;
  canClose: boolean;
  canApprove: boolean;
  canViewAnalytics: boolean;
}

export interface ObjectScopePermission {
  roleId: string;
  scopeType: ObjectScopeType;
  regionIds: string[];
  clubIds: string[];
}

export interface TenantScopePermission {
  roleId: string;
  tenantIds: string[];
}

export interface AdminRightsPermission {
  roleId: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageWorkflowTypes: boolean;
  canManageSLA: boolean;
  canManageAutomations: boolean;
  canManageIntegrations: boolean;
}

const currentModuleIds = [
  "ceo",
  "darbai",
  "orders",
  "zmones",
  "analytics",
  "audit",
  "admin",
  "periodiniai",
  "roles_permissions",
  "workflow_types",
];

const currentWorkflowTypeIds = workflowTypes.map((workflow) => workflow.id);

export const permissionRoles: PermissionRole[] = [
  {
    id: "role-super-admin",
    name: "SUPER_ADMIN",
    description: "Full system administration role.",
    active: true,
    systemRole: true,
  },
  {
    id: "role-admin",
    name: "ADMIN",
    description: "Operational administration role.",
    active: true,
    systemRole: true,
  },
  {
    id: "role-ops",
    name: "OPS",
    description: "Operations team role.",
    active: true,
    systemRole: true,
  },
  {
    id: "role-coordinator",
    name: "COORDINATOR",
    description: "Regional or club coordination role.",
    active: true,
    systemRole: true,
  },
  {
    id: "role-cs",
    name: "CS",
    description: "Customer support and registration role.",
    active: true,
    systemRole: true,
  },
];

const createModuleAccess = (
  roleId: string,
  permissions: Partial<ModuleAccessPermission> = {},
): ModuleAccessPermission[] =>
  currentModuleIds.map((moduleId) => ({
    roleId,
    moduleId,
    canView: false,
    canCreate: false,
    canEdit: false,
    canAdmin: false,
    ...permissions,
  }));

const restrictedAdminModuleIds = ["audit", "roles_permissions", "workflow_types"];

export const moduleAccessPermissions: ModuleAccessPermission[] = [
  ...createModuleAccess("role-super-admin", {
    canView: true,
    canCreate: true,
    canEdit: true,
    canAdmin: true,
  }),
  ...createModuleAccess("role-admin", {
    canView: true,
    canCreate: true,
    canEdit: true,
  }),
  ...createModuleAccess("role-ops", {
    canView: true,
    canCreate: true,
    canEdit: true,
  }),
  ...createModuleAccess("role-coordinator", {
    canView: false,
    canCreate: false,
  }).map((access) =>
    ["darbai", "orders", "periodiniai", "analytics"].includes(access.moduleId)
      ? {
          ...access,
          canView: true,
          canCreate: true,
        }
      : access,
  ),
  ...createModuleAccess("role-cs", {
    canView: true,
    canCreate: true,
  }).map((access) =>
    access.moduleId === "periodiniai"
      ? { ...access, canCreate: false }
      : access,
  ),
].map((access) => {
  if (
    restrictedAdminModuleIds.includes(access.moduleId) &&
    !["role-super-admin", "role-admin"].includes(access.roleId)
  ) {
    return {
      ...access,
      canView: false,
      canCreate: false,
      canEdit: false,
      canAdmin: false,
    };
  }

  return access;
});

const createWorkflowAccess = (
  roleId: string,
  permissions: Partial<WorkflowAccessPermission> = {},
): WorkflowAccessPermission[] =>
  currentWorkflowTypeIds.map((workflowTypeId) => ({
    roleId,
    workflowTypeId,
    canView: false,
    canCreate: false,
    canTransition: false,
    canClose: false,
    canApprove: false,
    canViewAnalytics: false,
    ...permissions,
  }));

const createWorkflowAccessByLegacyCategory = (
  roleId: string,
  legacyCategoryPermissions: Record<string, Partial<WorkflowAccessPermission>>,
): WorkflowAccessPermission[] =>
  workflowTypes.map((workflow) => ({
    roleId,
    workflowTypeId: workflow.id,
    canView: false,
    canCreate: false,
    canTransition: false,
    canClose: false,
    canApprove: false,
    canViewAnalytics: false,
    ...(legacyCategoryPermissions[workflow.legacyCategory] || {}),
  }));

export const workflowAccessPermissions: WorkflowAccessPermission[] = [
  ...createWorkflowAccess("role-super-admin", {
    canView: true,
    canCreate: true,
    canTransition: true,
    canClose: true,
    canApprove: true,
    canViewAnalytics: true,
  }),
  ...createWorkflowAccess("role-admin", {
    canView: true,
    canCreate: true,
    canTransition: true,
    canClose: true,
    canApprove: true,
    canViewAnalytics: true,
  }),
  ...createWorkflowAccess("role-ops", {
    canView: true,
    canCreate: true,
    canTransition: true,
    canClose: true,
  }),
  ...createWorkflowAccessByLegacyCategory("role-coordinator", {
    FACILITY_FAULT: {
      canView: true,
      canCreate: true,
      canTransition: true,
    },
    EQUIPMENT_FAULT: {
      canView: true,
      canCreate: true,
      canTransition: true,
    },
    VIDEO_CONTROL: {
      canView: true,
      canCreate: true,
      canTransition: true,
    },
  }),
  ...createWorkflowAccess("role-cs", {
    canView: true,
    canCreate: true,
  }),
];

export const objectScopePermissions: ObjectScopePermission[] = [
  { roleId: "role-super-admin", scopeType: "ALL", regionIds: [], clubIds: [] },
  { roleId: "role-admin", scopeType: "ALL", regionIds: [], clubIds: [] },
  { roleId: "role-ops", scopeType: "ALL", regionIds: [], clubIds: [] },
  { roleId: "role-coordinator", scopeType: "REGION", regionIds: [], clubIds: [] },
  { roleId: "role-cs", scopeType: "OWN_ONLY", regionIds: [], clubIds: [] },
];

export const tenantScopePermissions: TenantScopePermission[] = [
  { roleId: "role-super-admin", tenantIds: ["tenant-main"] },
  { roleId: "role-admin", tenantIds: ["tenant-main"] },
  { roleId: "role-ops", tenantIds: ["tenant-main"] },
  { roleId: "role-coordinator", tenantIds: ["tenant-main"] },
  { roleId: "role-cs", tenantIds: ["tenant-main"] },
];

export const adminRightsPermissions: AdminRightsPermission[] = [
  {
    roleId: "role-super-admin",
    canManageUsers: true,
    canManageRoles: true,
    canManageWorkflowTypes: true,
    canManageSLA: true,
    canManageAutomations: true,
    canManageIntegrations: true,
  },
  {
    roleId: "role-admin",
    canManageUsers: true,
    canManageRoles: false,
    canManageWorkflowTypes: true,
    canManageSLA: true,
    canManageAutomations: true,
    canManageIntegrations: false,
  },
  {
    roleId: "role-ops",
    canManageUsers: false,
    canManageRoles: false,
    canManageWorkflowTypes: false,
    canManageSLA: false,
    canManageAutomations: false,
    canManageIntegrations: false,
  },
  {
    roleId: "role-coordinator",
    canManageUsers: false,
    canManageRoles: false,
    canManageWorkflowTypes: false,
    canManageSLA: false,
    canManageAutomations: false,
    canManageIntegrations: false,
  },
  {
    roleId: "role-cs",
    canManageUsers: false,
    canManageRoles: false,
    canManageWorkflowTypes: false,
    canManageSLA: false,
    canManageAutomations: false,
    canManageIntegrations: false,
  },
];
