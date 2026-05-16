import type { AuthUser } from "./types";

export const MOCK_PASSWORD = "123456";

export const mockUsers: AuthUser[] = [
  {
    id: "auth-superadmin",
    name: "Super Admin",
    email: "superadmin@sportgates.lt",
    role: "SUPER_ADMIN",
    region: "ALL",
    regionAccess: ["ALL"],
    modulePermissions: [
      "darbai",
      "gedimai",
      "periodiniai",
      "admin",
      "analytics",
      "audit",
      "orders",
      "zmones",
      "ceo",
    ],
    is_active: true,
  },
  {
    id: "auth-ops",
    name: "OPS Komanda",
    email: "ops@sportgates.lt",
    role: "OPS",
    region: "ALL",
    regionAccess: ["ALL"],
    modulePermissions: [
      "darbai",
      "gedimai",
      "periodiniai",
      "admin",
      "analytics",
      "audit",
      "orders",
      "zmones",
      "ceo",
    ],
    is_active: true,
  },
  {
    id: "auth-marketing",
    name: "Marketingas",
    email: "marketing@sportgates.lt",
    role: "CS",
    region: "Vilnius",
    regionAccess: ["Vilnius"],
    modulePermissions: ["darbai", "gedimai", "analytics", "zmones"],
    is_active: true,
  },
];
