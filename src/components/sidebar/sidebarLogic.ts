import type { AuthUser } from "../../auth/types";
import {
  getSidebarModules,
  getSubNavigationModules,
} from "../../modules/moduleRegistry";

export interface SidebarItem {
  type?: "header" | "group";
  id?: string;
  label: string;
  icon?: any;
  module?: string;
  route?: string;
  tab?: string;
  hidden?: boolean;
  children?: any[];
}

export interface SidebarSubModule {
  id: string;
  label: string;
  icon: any;
  module: string;
}

export const hasModulePermission = (
  currentUser: AuthUser,
  moduleId?: string,
) => {
  if (!moduleId) return true;

  const permissions = currentUser.modulePermissions || [];
  const hasConfig = permissions.length > 0;
  const allowed = permissions.includes(moduleId as any);

  if (!hasConfig) {
    return currentUser.role === "SUPER_ADMIN";
  }

  return allowed;
};

export const getSidebarItems = (): SidebarItem[] => [
  { type: "header", label: "Pagrindinis meniu" },
  ...getSidebarModules().map((module) => ({
    id: module.moduleId,
    label: module.title,
    icon: module.icon,
    module: module.permissionKey || module.moduleId,
    route: module.route,
    tab: module.tabId,
    hidden: module.sidebarVisibility === "hidden",
    children: [],
  })),
];

export const getFilteredSidebarItems = (
  currentUser: AuthUser,
  sidebarItems: SidebarItem[],
) => {
  const isSuperAdmin = currentUser.role === "SUPER_ADMIN";
  if (isSuperAdmin) return sidebarItems;

  return sidebarItems.filter((item) => {
    if (item.hidden) return false;
    return hasModulePermission(currentUser, item.module);
  });
};

export const getSidebarSubModules = (
  currentUser: AuthUser,
): SidebarSubModule[] =>
  getSubNavigationModules()
    .map((module) => ({
      id: module.tabId || module.moduleId,
      label: module.title,
      icon: module.icon,
      module: String(module.permissionKey || module.moduleId),
    }))
    .filter(
      (tab) =>
        hasModulePermission(currentUser, tab.module) &&
        (!(tab as any).role ||
          (Array.isArray((tab as any).role)
            ? (tab as any).role.includes(currentUser.role)
            : currentUser.role === (tab as any).role)),
    );

export const getActiveSubmodule = (
  subModules: SidebarSubModule[],
  activeTab: string,
) => subModules.find((subModule) => subModule.id === activeTab) || subModules[0];

export const getSidebarTitle = (
  sidebarItems: SidebarItem[],
  pathname: string,
  activeModule: string,
) =>
  sidebarItems.find(
    (item) =>
      item.route && pathname.toLowerCase().includes(`/${item.route}`),
  )?.label ||
  sidebarItems.find((item) => item.id === activeModule)?.label ||
  "Pagrindinis";
