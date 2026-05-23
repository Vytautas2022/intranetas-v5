import {
  AlertCircle,
  BarChart3,
  History,
  LayoutDashboard,
  RefreshCcw,
  Settings,
  ShoppingCart,
  TrendingUp,
  Users2,
  type LucideIcon,
} from "lucide-react";
import type { ModulePermission } from "../auth/types";

export type ModuleComponentKey =
  | "CeoDashboard"
  | "OpsFlowView"
  | "DarbaiModule"
  | "PeriodicModule"
  | "OrderModule"
  | "AnalyticsTab"
  | "AuditTab"
  | "AdminModule"
  | "ZmonesOrgModule";

export type SidebarVisibility = "visible" | "hidden" | "none";

export interface ModuleRegistryItem {
  moduleId: string;
  title: string;
  icon: LucideIcon;
  route: string;
  component: ModuleComponentKey;
  permissions: string[];
  permissionKey?: ModulePermission | string;
  sidebarVisibility: SidebarVisibility;
  mobileVisible: boolean;
  category: "main" | "operations" | "administration" | "hidden";
  group: string;
  sortOrder: number;
  activeModuleId?: string;
  tabId?: string;
  showInSubNavigation?: boolean;
}

export type AdminModuleTabId =
  | "clubs"
  | "facility"
  | "equipment"
  | "equipment_issues"
  | "cities"
  | "users"
  | "inventory"
  | "periodic_templates"
  | "periodiniai"
  | "workflow_types"
  | "audit";

export type AdminInventorySubTab =
  | "products"
  | "suppliers"
  | "inventory_settings";

export interface RouteRegistryItem {
  path: string;
  route: string;
  moduleId: string;
  component?: ModuleComponentKey;
  activeModuleId?: string;
  tabId?: string;
  permissionKey?: ModulePermission | string;
  adminTabId?: AdminModuleTabId;
  adminInventorySubTab?: AdminInventorySubTab;
}

export const moduleRegistry: ModuleRegistryItem[] = [
  {
    moduleId: "ceo",
    title: "CEO Skydas",
    icon: TrendingUp,
    route: "ceo",
    component: "CeoDashboard",
    permissions: ["ceo"],
    permissionKey: "ceo",
    sidebarVisibility: "visible",
    mobileVisible: true,
    category: "main",
    group: "Pagrindinis meniu",
    sortOrder: 10,
  },
  {
    moduleId: "ops-flow",
    title: "Procesų flow",
    icon: LayoutDashboard,
    route: "ops-flow",
    component: "OpsFlowView",
    permissions: ["ops-flow"],
    permissionKey: "ops-flow",
    sidebarVisibility: "none",
    mobileVisible: false,
    category: "hidden",
    group: "Pagrindinis meniu",
    sortOrder: 20,
  },
  {
    moduleId: "darbai",
    title: "Sporto klubų darbai",
    icon: AlertCircle,
    route: "darbai",
    component: "DarbaiModule",
    permissions: ["darbai"],
    permissionKey: "darbai",
    sidebarVisibility: "visible",
    mobileVisible: true,
    category: "operations",
    group: "Pagrindinis meniu",
    sortOrder: 30,
    tabId: "kanban",
    showInSubNavigation: true,
  },
  {
    moduleId: "periodiniai",
    title: "Periodiniai darbai",
    icon: RefreshCcw,
    route: "periodiniai",
    component: "PeriodicModule",
    permissions: ["periodiniai"],
    permissionKey: "periodiniai",
    sidebarVisibility: "visible",
    mobileVisible: true,
    category: "operations",
    group: "Pagrindinis meniu",
    sortOrder: 40,
    activeModuleId: "darbai",
    tabId: "periodiniai",
    showInSubNavigation: true,
  },
  {
    moduleId: "orders",
    title: "Užsakymai",
    icon: ShoppingCart,
    route: "orders",
    component: "OrderModule",
    permissions: ["orders"],
    permissionKey: "orders",
    sidebarVisibility: "none",
    mobileVisible: true,
    category: "operations",
    group: "Pagrindinis meniu",
    sortOrder: 50,
    activeModuleId: "darbai",
    tabId: "orders",
    showInSubNavigation: true,
  },
  {
    moduleId: "zmones",
    title: "Žmonės ir organizacija",
    icon: Users2,
    route: "zmones",
    component: "ZmonesOrgModule",
    permissions: ["zmones"],
    permissionKey: "zmones",
    sidebarVisibility: "visible",
    mobileVisible: true,
    category: "main",
    group: "Pagrindinis meniu",
    sortOrder: 60,
  },
  {
    moduleId: "analytics",
    title: "Analitika",
    icon: BarChart3,
    route: "analitika",
    component: "AnalyticsTab",
    permissions: ["analytics"],
    permissionKey: "analytics",
    sidebarVisibility: "hidden",
    mobileVisible: true,
    category: "operations",
    group: "Pagrindinis meniu",
    sortOrder: 70,
    activeModuleId: "darbai",
    tabId: "analytics",
    showInSubNavigation: true,
  },
  {
    moduleId: "audit",
    title: "Auditas",
    icon: History,
    route: "audit",
    component: "AuditTab",
    permissions: ["audit"],
    permissionKey: "audit",
    sidebarVisibility: "hidden",
    mobileVisible: true,
    category: "administration",
    group: "Pagrindinis meniu",
    sortOrder: 80,
    activeModuleId: "darbai",
    tabId: "audit",
    showInSubNavigation: true,
  },
  {
    moduleId: "admin",
    title: "Sistemos administravimas",
    icon: Settings,
    route: "admin",
    component: "AdminModule",
    permissions: ["admin"],
    permissionKey: "admin",
    sidebarVisibility: "visible",
    mobileVisible: true,
    category: "administration",
    group: "Pagrindinis meniu",
    sortOrder: 90,
  },
];

type AdminRouteRegistryItem = Pick<
  RouteRegistryItem,
  "tabId" | "adminTabId" | "adminInventorySubTab"
> & {
  path?: string;
  route?: string;
};

const getAdminRoutePath = (route: AdminRouteRegistryItem) =>
  route.path || route.route || "/admin";

const adminRouteRegistry: AdminRouteRegistryItem[] = [
  { path: "/admin/miestai", tabId: "admin-cities", adminTabId: "cities" },
  { path: "/admin/padaliniai", tabId: "admin-clubs", adminTabId: "clubs" },
  { path: "/admin/vartotojai", tabId: "admin-users", adminTabId: "users" },
  {
    path: "/admin/treniruokliai",
    tabId: "admin-equipment",
    adminTabId: "equipment",
  },
  { path: "/admin/patalpu", tabId: "admin-facility", adminTabId: "facility" },
  {
    path: "/admin/gedimo-tipai",
    tabId: "admin-issues",
    adminTabId: "equipment_issues",
  },
  {
    path: "/admin/uzsakymai",
    tabId: "admin-inventory",
    adminTabId: "inventory",
  },
  {
    path: "/admin/periodiniai-sablonai",
    tabId: "admin-periodic-templates",
    adminTabId: "periodic_templates",
  },
  {
    path: "/admin/periodiniai",
    tabId: "admin-periodiniai",
    adminTabId: "periodiniai",
  },
  {
    path: "/admin/produktai",
    tabId: "admin-products",
    adminTabId: "inventory",
    adminInventorySubTab: "products",
  },
  {
    path: "/admin/tiekėjai",
    tabId: "admin-suppliers",
    adminTabId: "inventory",
    adminInventorySubTab: "suppliers",
  },
  {
    path: "/admin/workflow-types",
    tabId: "admin-workflow_types",
    adminTabId: "workflow_types",
  },
  { path: "/admin/auditas", tabId: "admin-audit", adminTabId: "audit" },
];

const normalizePath = (path: string) => path.toLowerCase();

const routePathMatches = (pathname: string, routePath: string) => {
  const path = normalizePath(pathname).replace(/\/+$/, "") || "/";
  const route = normalizePath(routePath).replace(/\/+$/, "") || "/";
  return path === route || path.startsWith(`${route}/`);
};

export const routeRegistry: RouteRegistryItem[] = [
  ...moduleRegistry.map((module) => ({
    path: `/${module.route}`,
    route: module.route,
    moduleId: module.moduleId,
    component: module.component,
    activeModuleId: module.activeModuleId,
    tabId: module.tabId || module.moduleId,
    permissionKey: module.permissionKey,
  })),
  ...adminRouteRegistry.map((route) => {
    const path = getAdminRoutePath(route);
    return {
      path,
      route: path.replace(/^\//, ""),
      moduleId: "admin",
      component: "AdminModule" as ModuleComponentKey,
      activeModuleId: "admin",
      tabId: route.tabId,
      permissionKey: "admin",
      adminTabId: route.adminTabId,
      adminInventorySubTab: route.adminInventorySubTab,
    };
  }),
];

const getRouteMatch = (pathname: string) =>
  routeRegistry
    .filter((route) => routePathMatches(pathname, route.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

export const getSidebarModules = () =>
  moduleRegistry
    .filter((module) => module.sidebarVisibility !== "none")
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const getSubNavigationModules = () =>
  moduleRegistry
    .filter((module) => module.showInSubNavigation)
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const getActiveModuleIdForPath = (pathname: string): string => {
  const match = getRouteMatch(pathname);

  return match?.activeModuleId || match?.moduleId || "darbai";
};

export const getActiveTabIdForPath = (pathname: string): string => {
  const match = getRouteMatch(pathname);

  return match?.tabId || match?.moduleId || "kanban";
};

export const getRouteSyncPath = (tabId: string): string | undefined => {
  const route = routeRegistry.find(
    (item) => item.tabId === tabId || item.moduleId === tabId,
  );
  return route?.path;
};

export const getAdminTabRoutePath = (
  tabId: AdminModuleTabId,
): string | undefined => {
  const route = adminRouteRegistry.find((item) => item.adminTabId === tabId);
  return route ? getAdminRoutePath(route) : undefined;
};

export const getAdminTabIdForRouteTab = (
  tabId: string,
): AdminModuleTabId | undefined =>
  routeRegistry.find((route) => route.tabId === tabId)?.adminTabId;

export const getAdminInventorySubTabForRouteTab = (
  tabId: string,
): AdminInventorySubTab | undefined =>
  routeRegistry.find((route) => route.tabId === tabId)?.adminInventorySubTab;

export const getRouteTabIdForAdminTab = (
  adminTabId: AdminModuleTabId,
): string | undefined =>
  adminRouteRegistry.find((route) => route.adminTabId === adminTabId)?.tabId;
