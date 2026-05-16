import type { UserRole } from "../types/roles";

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
  ) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogleCredential: (
    credential: string,
    remember: boolean,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}
