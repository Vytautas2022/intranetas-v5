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
    sidebarVisibility: "hidden",
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

const adminRouteTabs = [
  { route: "/admin/miestai", tabId: "admin-cities" },
  { route: "/admin/padaliniai", tabId: "admin-clubs" },
  { route: "/admin/vartotojai", tabId: "admin-users" },
  { route: "/admin/treniruokliai", tabId: "admin-equipment" },
  { route: "/admin/patalpu", tabId: "admin-facility" },
  { route: "/admin/gedimo-tipai", tabId: "admin-issues" },
  { route: "/admin/uzsakymai", tabId: "admin-inventory" },
  { route: "/admin/periodiniai-sablonai", tabId: "admin-periodic-templates" },
  { route: "/admin/periodiniai", tabId: "admin-periodiniai" },
  { route: "/admin/produktai", tabId: "admin-products" },
  { route: "/admin/tiekėjai", tabId: "admin-suppliers" },
  { route: "/admin/workflow-types", tabId: "admin-workflow_types" },
];

const normalizePath = (path: string) => path.toLowerCase();

const routeMatches = (path: string, route: string) =>
  normalizePath(path).includes(`/${normalizePath(route)}`);

export const getSidebarModules = () =>
  moduleRegistry
    .filter((module) => module.sidebarVisibility !== "none")
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const getSubNavigationModules = () =>
  moduleRegistry
    .filter((module) => module.showInSubNavigation)
    .sort((a, b) => a.sortOrder - b.sortOrder);

export const getActiveModuleIdForPath = (pathname: string): string => {
  if (normalizePath(pathname).includes("/admin")) return "admin";

  const match = moduleRegistry
    .filter((module) => routeMatches(pathname, module.route))
    .sort((a, b) => b.route.length - a.route.length)[0];

  return match?.activeModuleId || match?.moduleId || "darbai";
};

export const getActiveTabIdForPath = (pathname: string): string => {
  const path = normalizePath(pathname);
  const adminTab = adminRouteTabs.find((route) => path.includes(route.route));
  if (adminTab) return adminTab.tabId;

  const match = moduleRegistry
    .filter((module) => routeMatches(pathname, module.route))
    .sort((a, b) => b.route.length - a.route.length)[0];

  return match?.tabId || match?.moduleId || "kanban";
};

export const getRouteSyncPath = (tabId: string): string | undefined => {
  const module = moduleRegistry.find(
    (item) => item.tabId === tabId || item.moduleId === tabId,
  );
  return module ? `/${module.route}` : undefined;
};
