/**
 * Role definitions and permission helpers for the application.
 */

/**
 * Valid user roles within the system.
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "OPS" | "COORDINATOR" | "CS" | "ACCOUNTING" | "EXTERNAL";

/**
 * Array of all valid user roles.
 */
export const ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPS",
  "COORDINATOR",
  "CS",
  "ACCOUNTING",
  "EXTERNAL"
];

/**
 * Checks if a role can approve requests or actions.
 */
export const canApprove = (role: UserRole): boolean => 
  ["SUPER_ADMIN", "ADMIN", "OPS"].includes(role);

/**
 * Checks if a role can manage all clubs regardless of region.
 */
export const canManageAllClubs = (role: UserRole): boolean => 
  ["SUPER_ADMIN", "ADMIN", "OPS"].includes(role);

/**
 * Checks if a role can manage orders.
 */
export const canManageOrders = (role: UserRole): boolean => 
  ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR"].includes(role);

/**
 * Checks if a role can manage periodic operational tasks.
 */
export const canManagePeriodicTasks = (role: UserRole): boolean => 
  ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR"].includes(role);

/**
 * Checks if a role can access the accounting/financial flow.
 */
export const canAccessAccounting = (role: UserRole): boolean => 
  ["SUPER_ADMIN", "ADMIN", "ACCOUNTING"].includes(role);

/**
 * Checks if a role is a coordinator.
 */
export const isCoordinator = (role: UserRole): boolean => 
  role === "COORDINATOR";
