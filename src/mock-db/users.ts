// SEED DATA FROZEN — DO NOT MODIFY (beta v1.0)
import type { ModulePermission } from "../auth/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'OPS' | 'COORDINATOR' | 'CS' | 'ACCOUNTING' | 'EXTERNAL';
  assignedRoleIds?: string[];
  assignedRegionIds?: string[];
  assignedClubIds?: string[];
  assigned_clubs?: string[];
  is_active?: boolean;
  region?: string;
  permissions?: ModulePermission[];
  modulePermissions?: ModulePermission[];
}

export const users: User[] = [
  { id: "u1", name: "Miglė", email: "migle@fitsport.lt", role: "COORDINATOR", assignedRoleIds: ["role-coordinator"], assignedRegionIds: ["Vilnius"], assignedClubIds: ["OGM", "MND", "STN", "DNG"], region: "Vilnius", is_active: true, assigned_clubs: ["OGM", "MND", "STN", "DNG"] },
  { id: "u2", name: "Tomas", email: "tomas@fitsport.lt", role: "COORDINATOR", assignedRoleIds: ["role-coordinator"], assignedRegionIds: ["Kaunas"], assignedClubIds: ["SG_VYT", "ALEKS", "SIAU", "KRE"], region: "Kaunas", is_active: true, assigned_clubs: ["SG_VYT", "ALEKS", "SIAU", "KRE"] },
  { id: "u4", name: "Jonas", email: "jonas@fitsport.lt", role: "COORDINATOR", assignedRoleIds: ["role-coordinator"], assignedRegionIds: ["Klaipėda"], assignedClubIds: ["KL_CR", "BIG"], region: "Klaipėda", is_active: true, assigned_clubs: ["KL_CR", "BIG"] },
  { id: "u3", name: "Admin User", email: "admin@fitsport.lt", role: "OPS", assignedRoleIds: ["role-ops"], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true },
  { id: "u5", name: "Super Admin", email: "superadmin@fitsport.lt", role: "SUPER_ADMIN", assignedRoleIds: ["role-super-admin"], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true },
  { id: "u7", name: "Vytautas", email: "vytautas@sportgates.lt", role: "SUPER_ADMIN", assignedRoleIds: ["role-super-admin"], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true },
  { id: "u6", name: "Buhalterija", email: "accounting@fitsport.lt", role: "ACCOUNTING", assignedRoleIds: [], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true },
  { id: "u8", name: "Administratorius", email: "admin2@sportgates.lt", role: "ADMIN", assignedRoleIds: ["role-admin"], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true },
  { id: "u9", name: "CS Darbuotojas", email: "cs@sportgates.lt", role: "CS", assignedRoleIds: ["role-cs"], assignedRegionIds: ["ALL"], assignedClubIds: ["ALL"], region: "ALL", is_active: true }
];
