import {
  moduleRegistry,
  routeRegistry,
  type ModuleRegistryItem,
} from "./moduleRegistry";

const routePathMatches = (pathname: string, routePath: string) => {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  const route = routePath.toLowerCase().replace(/\/+$/, "") || "/";
  return path === route || path.startsWith(`${route}/`);
};

export const getModuleById = (
  moduleId?: string,
): ModuleRegistryItem | undefined =>
  moduleRegistry.find((module) => module.moduleId === moduleId);

export const getRuntimeModuleForPath = (
  pathname: string,
): ModuleRegistryItem | undefined => {
  const match = routeRegistry
    .filter((route) => routePathMatches(pathname, route.path))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return getModuleById(match?.activeModuleId || match?.moduleId || "darbai");
};
