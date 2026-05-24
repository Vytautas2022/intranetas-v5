import type { UserRole } from "../types/roles";
import type {
  AdminRightsPermission,
  ModuleAccessPermission,
  ObjectScopePermission,
  PermissionRole,
  TenantScopePermission,
  WorkflowAccessPermission,
} from "../mock-db/permissions";

export type ModulePermission =
  | "darbai"
  | "gedimai"
  | "periodiniai"
  | "admin"
  | "analytics"
  | "audit"
  | "orders"
  | "zmones"
  | "ceo";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedRoleIds?: string[];
  effectiveRoles?: PermissionRole[];
  tenantIds?: string[];
  effectivePermissionsPreview?: {
    assignedRoleIds: string[];
    moduleAccess: ModuleAccessPermission[];
    workflowAccess: WorkflowAccessPermission[];
    objectScopes: ObjectScopePermission[];
    tenantScopes: TenantScopePermission[];
    adminRights: AdminRightsPermission;
  };
  region: string;
  regionAccess: string[];
  modulePermissions: ModulePermission[];
  is_active: boolean;
  avatarUrl?: string;
}

export interface AuthContextValue {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
    remember: boolean,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  loginWithGoogleCredential: (
    credential: string,
    remember: boolean,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => void;
}
