import type { AuthUser } from "../../auth/types";
import {
  getSidebarModules,
  getSubNavigationModules,
} from "../../modules/moduleRegistry";
import {
  canAccessPermission,
} from "../../logic/permissionEngine";
import { canSeeSidebarModuleResolver } from "../../logic/permissionPreviewResolver";
import { isSystemOwnerUser } from "../../logic/systemOwner";

export interface SidebarItem {
  type?: "header" | "group";
  id?: string;
  label: string;
  icon?: any;
  module?: string;
  route?: string;
  tab?: string;
  hidden?: boolean;
  systemOwnerOnly?: boolean;
  children?: any[];
}

export interface SidebarSubModule {
  id: string;
  label: string;
  icon: any;
  module: string;
  hidden?: boolean;
}

export const hasModulePermission = (
  currentUser: AuthUser,
  moduleId?: string,
) => canAccessPermission(currentUser, moduleId);

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
    systemOwnerOnly: module.systemOwnerOnly,
    children: [],
  })),
];

export const getFilteredSidebarItems = (
  currentUser: AuthUser,
  sidebarItems: SidebarItem[],
) => {
  return sidebarItems.filter((item) => {
    if (item.systemOwnerOnly && !isSystemOwnerUser(currentUser as any)) return false;
    return canSeeSidebarModuleResolver(currentUser, item.module, item.hidden);
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
      hidden: module.sidebarVisibility === "hidden",
    }))
    .filter(
      (tab) =>
        canSeeSidebarModuleResolver(currentUser, tab.module, tab.hidden),
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
