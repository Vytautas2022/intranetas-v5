import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Settings,
  MapPin,
  Wrench,
  Dumbbell,
  Activity,
  Plus,
  Trash2,
  Archive,
  Edit2,
  X,
  AlertCircle,
  Building,
  Users,
  Search,
  QrCode,
  Copy,
  Check,
  Package,
  RotateCcw as History,
  RefreshCw,
  FileText,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { AuditAdmin } from "./AuditAdmin";
import { useAuth } from "../auth/authContext";
import type { AuthUser } from "../auth/types";
import { createAuditLogEntry } from "../logic/auditLogic";
import { cn } from "../lib/utils";
import { getProductAnalytics } from "../logic/inventoryLogic";
import { generateUniqueId } from "../logic/idLogic";
import {
  enforceSystemOwnerUser,
  isSystemOwnerUser,
  SUPER_ADMIN_ROLE_ID,
} from "../logic/systemOwner";
import {
  canAccessAdminTabResolver,
  compareLegacyVsResolverActionAccess,
  compareLegacyVsResolverAccess,
  compareLegacyVsResolverWorkflowAccess,
  loadMockPermissionConfig,
  resetMockPermissionConfig,
  resolveEffectivePermissionPreview,
  resolveUserAssignedRoles,
  saveMockPermissionConfig,
  type PermissionPreviewConfig,
} from "../logic/permissionPreviewResolver";
import { productTransfers } from "../mock-db/transfers";
import { clubs as initialClubs, Club } from "../mock-db/clubs";
import {
  facilityTemplates as initialFacilityTemplates,
  equipmentList as initialEquipment,
  productsList as initialProducts,
  clubInventorySettingsList as initialInventorySettings,
  suppliersList as initialSuppliers,
  Product,
  ClubInventorySetting,
  ProductCategory,
  Supplier,
  printMaterials,
} from "../mock-db/admin";
import { users as initialUsers, User } from "../mock-db/users";
import { initialCities, City } from "../mock-db/cities";
import {
  workflowIconMap,
  workflowTypes as initialWorkflowTypes,
  WorkflowType,
} from "../mock-db/workflowTypes";
import {
  assetTypes as initialAssetTypes,
  type AssetType,
  type AssetTypeMode,
} from "../mock-db/assetTypes";
import {
  assetObjects as initialAssetObjects,
  type AssetObject,
} from "../mock-db/assetObjects";
import {
  assetIssueTypes as initialAssetIssueTypes,
  getLegacyIssueTypes,
  type AssetIssueType,
} from "../mock-db/assetIssueTypes";
import {
  type AdminRightsPermission,
  type ModuleAccessPermission,
  type ObjectScopePermission,
  type ObjectScopeType,
  type PermissionRole,
  type TenantScopePermission,
  type WorkflowAccessPermission,
} from "../mock-db/permissions";
import {
  getAdminTabRoutePath,
  moduleRegistry,
  type AdminModuleTabId,
} from "../modules/moduleRegistry";

interface AdminModuleProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  inventorySettings: ClubInventorySetting[];
  setInventorySettings: React.Dispatch<
    React.SetStateAction<ClubInventorySetting[]>
  >;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  cities: City[];
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
  facilityTemplates: any[];
  setFacilityTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  equipmentList: any[];
  setEquipmentList: React.Dispatch<React.SetStateAction<any[]>>;
  periodicTemplates: any[];
  setPeriodicTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  clubTaskConfigs: any[];
  setClubTaskConfigs: React.Dispatch<React.SetStateAction<any[]>>;
  tasks: any[];
  orders: any[];
  workflowTypes?: WorkflowType[];
  setWorkflowTypes?: React.Dispatch<React.SetStateAction<WorkflowType[]>>;
  onResetTestEnvironment?: () => void;
  renderPeriodicModule?: () => React.ReactNode;
  activeTab?: AdminModuleTabId;
  onTabChange?: (tab: AdminModuleTabId) => void;
  inventorySubTab?: "products" | "suppliers" | "inventory_settings";
  onSubTabChange?: (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => void;
}

type AdminNavigationGroup =
  | "Organization"
  | "Workflow System"
  | "Assets / Objects"
  | "Automations"
  | "Analytics & Monitoring"
  | "Integrations"
  | "Legacy / Internal";

type AdminNavigationVisibility = "visible" | "hidden";

interface AdminNavigationItem {
  id: AdminModuleTabId;
  label: string;
  group: AdminNavigationGroup;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  visibility: AdminNavigationVisibility;
}

const adminNavigationItems: AdminNavigationItem[] = [
  { id: "cities", label: "Miestai / Regionai", group: "Organization", icon: Building, visibility: "visible" },
  { id: "clubs", label: "Padaliniai", group: "Organization", icon: MapPin, visibility: "visible" },
  { id: "users", label: "Vartotojai", group: "Organization", icon: Users, visibility: "visible" },
  { id: "roles_permissions", label: "Roles & Permissions", group: "Organization", icon: ShieldCheck, visibility: "visible" },
  { id: "workflow_types", label: "Workflow Types", group: "Workflow System", icon: Workflow, visibility: "visible" },
  { id: "asset_types", label: "Turtas", group: "Assets / Objects", icon: Package, visibility: "hidden" },
  { id: "asset_objects", label: "Turto vienetai", group: "Assets / Objects", icon: Building, visibility: "hidden" },
  { id: "asset_issue_types", label: "Gedimų tipai", group: "Assets / Objects", icon: Activity, visibility: "hidden" },
  { id: "equipment", label: "Treniruokliai", group: "Assets / Objects", icon: Dumbbell, visibility: "hidden" },
  { id: "facility", label: "Patalpu darbai", group: "Assets / Objects", icon: Wrench, visibility: "hidden" },
  { id: "equipment_issues", label: "Gedimo tipas", group: "Assets / Objects", icon: Activity, visibility: "hidden" },
  { id: "inventory", label: "Užsakymai", group: "Assets / Objects", icon: Package, visibility: "hidden" },
  { id: "periodiniai", label: "Periodiniai darbai", group: "Automations", icon: RefreshCw, visibility: "hidden" },
  { id: "audit", label: "Auditas", group: "Analytics & Monitoring", icon: FileText, visibility: "visible" },
  { id: "periodic_templates", label: "Periodiniai šablonai", group: "Legacy / Internal", icon: History, visibility: "hidden" },
];

const adminNavigationGroups: AdminNavigationGroup[] = [
  "Organization",
  "Workflow System",
  "Assets / Objects",
  "Automations",
  "Analytics & Monitoring",
  "Integrations",
  "Legacy / Internal",
];

const visibleAdminNavigationItems = adminNavigationItems.filter(
  (item) => item.visibility === "visible",
);

function AdminActiveSwitch({
  active,
  onClick,
  className,
}: {
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={`Būsena: ${active ? "Aktyvus" : "Neaktyvus"}`}
      title={active ? "Aktyvus" : "Neaktyvus"}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[11px] font-bold transition-colors",
        active
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500",
        className,
      )}
    >
      <span className="min-w-[58px] text-left">
        {active ? "Aktyvus" : "Neaktyvus"}
      </span>
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          active ? "bg-emerald-500" : "bg-slate-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            active ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="w-6 text-[10px]">{active ? "Taip" : "Ne"}</span>
    </button>
  );
}

type LifecycleDependency = {
  label: string;
  count: number;
};

const formatDependencyBlockMessage = (dependencies: LifecycleDependency[]) => {
  const found = dependencies.filter((dependency) => dependency.count > 0);

  return [
    "Cannot delete.",
    "",
    "Dependencies found:",
    "",
    ...found.map((dependency) => `* ${dependency.count} ${dependency.label}`),
  ].join("\n");
};

const hasMatchingAssignee = (item: any, user: User) => {
  const assignedTo = item?.assignedTo;
  const assignee = item?.assignee;

  return (
    item?.assigneeId === user.id ||
    item?.assigned_to === user.id ||
    item?.assignedBy === user.id ||
    item?.assigned_by === user.id ||
    (typeof assignedTo === "string" &&
      (assignedTo === user.id || assignedTo === user.name)) ||
    assignedTo?.id === user.id ||
    (typeof assignee === "string" &&
      (assignee === user.id || assignee === user.name)) ||
    assignee?.id === user.id
  );
};

export const AdminModule: React.FC<AdminModuleProps> = ({
  products,
  setProducts,
  inventorySettings,
  setInventorySettings,
  suppliers,
  setSuppliers,
  clubs,
  setClubs,
  users,
  setUsers,
  cities,
  setCities,
  facilityTemplates,
  setFacilityTemplates,
  equipmentList,
  setEquipmentList,
  periodicTemplates,
  setPeriodicTemplates,
  clubTaskConfigs,
  setClubTaskConfigs,
  tasks,
  orders,
  workflowTypes = initialWorkflowTypes,
  setWorkflowTypes,
  onResetTestEnvironment,
  renderPeriodicModule,
  inventorySubTab,
  onSubTabChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const path = location.pathname;
  const initialPermissionConfig = useMemo(() => loadMockPermissionConfig(), []);
  const [permissionRoles, setPermissionRoles] =
    useState<PermissionRole[]>(initialPermissionConfig.roles);
  const [permissionModuleAccess, setPermissionModuleAccess] = useState<
    ModuleAccessPermission[]
  >(initialPermissionConfig.moduleAccess);
  const [permissionWorkflowAccess, setPermissionWorkflowAccess] = useState<
    WorkflowAccessPermission[]
  >(initialPermissionConfig.workflowAccess);
  const [permissionObjectScopes, setPermissionObjectScopes] = useState<
    ObjectScopePermission[]
  >(initialPermissionConfig.objectScopes);
  const [permissionTenantScopes, setPermissionTenantScopes] = useState<
    TenantScopePermission[]
  >(initialPermissionConfig.tenantScopes);
  const [permissionAdminRights, setPermissionAdminRights] = useState<
    AdminRightsPermission[]
  >(initialPermissionConfig.adminRights);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>(initialAssetTypes);
  const [assetObjects, setAssetObjects] =
    useState<AssetObject[]>(initialAssetObjects);
  const [assetIssueTypes, setAssetIssueTypes] =
    useState<AssetIssueType[]>(initialAssetIssueTypes);
  const permissionPreviewConfig: PermissionPreviewConfig = {
    roles: permissionRoles,
    moduleAccess: permissionModuleAccess,
    workflowAccess: permissionWorkflowAccess,
    objectScopes: permissionObjectScopes,
    tenantScopes: permissionTenantScopes,
    adminRights: permissionAdminRights,
  };

  useEffect(() => {
    saveMockPermissionConfig(permissionPreviewConfig);
  }, [
    permissionRoles,
    permissionModuleAccess,
    permissionWorkflowAccess,
    permissionObjectScopes,
    permissionTenantScopes,
    permissionAdminRights,
  ]);

  const handleResetMockPermissions = () => {
    const defaults = resetMockPermissionConfig();
    setPermissionRoles(defaults.roles);
    setPermissionModuleAccess(defaults.moduleAccess);
    setPermissionWorkflowAccess(defaults.workflowAccess);
    setPermissionObjectScopes(defaults.objectScopes);
    setPermissionTenantScopes(defaults.tenantScopes);
    setPermissionAdminRights(defaults.adminRights);
  };

  const handleResetWorkflowTestEnvironment = () => {
    const confirmed = window.confirm(
      [
        "Bus ištrinta visa testinė workflow aplinka.",
        "",
        "Ištrinama:",
        "- Workflow Types",
        "- Workflow Cards",
        "- Workflow Forms",
        "- Workflow Permissions",
        "- Periodic Templates",
        "- Periodic Instances",
        "- Periodic History",
        "",
        "Users, Roles, Clubs ir Turtas nebus trinami.",
      ].join("\n"),
    );

    if (!confirmed) return;

    setPermissionWorkflowAccess([]);
    saveMockPermissionConfig({
      ...permissionPreviewConfig,
      workflowAccess: [],
    });
    onResetTestEnvironment?.();
  };
  const legacyPeriodicTemplatesRoute = getAdminTabRoutePath("periodic_templates");
  const isLegacyPeriodicTemplatesRoute = Boolean(
    legacyPeriodicTemplatesRoute && path.includes(legacyPeriodicTemplatesRoute),
  );

  useEffect(() => {
    if (isLegacyPeriodicTemplatesRoute) {
      // Legacy periodic template editing is disabled. Use System Administration → Periodiniai darbai.
      navigate(getAdminTabRoutePath("periodiniai") || "/admin/periodiniai", {
        replace: true,
      });
    }
  }, [isLegacyPeriodicTemplatesRoute, navigate]);

  // console.log("Current route:", path);


  const getTabRoute = (tabId: AdminModuleTabId) =>
    getAdminTabRoutePath(tabId) || "/admin/vartotojai";
  const visibleAdminItemsForUser = visibleAdminNavigationItems.filter((item) =>
    canAccessAdminTabResolver(currentUser, item.id),
  );
  const assetRootPath = getTabRoute("asset_types");
  const isPeriodicRoute = path.includes(getTabRoute("periodiniai"));
  const selectedAssetTypeIdFromPath = path.startsWith(`${assetRootPath}/`)
    ? decodeURIComponent(path.slice(`${assetRootPath}/`.length).split("/")[0])
    : "";
  const activeAssetTypes = assetTypes
    .filter((assetType) => assetType.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name));
  const canAccessAssets = canAccessAdminTabResolver(currentUser, "asset_types");

  return (
    <div
      className={cn(
        "p-0 md:p-6 min-h-full bg-white md:bg-transparent",
        isPeriodicRoute ? "h-auto" : "md:h-full",
      )}
    >
      <div
        className={cn(
          "min-h-0 flex flex-col md:flex-row bg-white md:rounded-3xl md:border md:border-slate-200 md:shadow-sm",
          isPeriodicRoute ? "h-auto overflow-visible" : "h-full overflow-hidden",
        )}
      >
        <aside className="md:w-72 md:shrink-0 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/70">
          <div className="h-full overflow-x-auto md:overflow-x-visible md:overflow-y-auto p-3">
            <nav className="flex md:flex-col gap-4 md:gap-5 min-w-max md:min-w-0">
              {adminNavigationGroups.map((group) => {
                if (group === "Assets / Objects") {
                  if (!canAccessAssets) return null;

                  return (
                    <div key={group} className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(assetRootPath)}
                        className={cn(
                          "w-full px-2 text-left text-[9px] font-black uppercase tracking-[0.18em] whitespace-nowrap transition-colors",
                          path === assetRootPath
                            ? "text-slate-900"
                            : "text-slate-400 hover:text-slate-700",
                        )}
                      >
                        Turtas
                      </button>
                      <div className="flex md:flex-col gap-1">
                        {activeAssetTypes.map((assetType) => {
                          const active =
                            selectedAssetTypeIdFromPath === assetType.id;
                          return (
                            <button
                              key={assetType.id}
                              onClick={() =>
                                navigate(`${assetRootPath}/${assetType.id}`)
                              }
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap text-left",
                                active
                                  ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70"
                                  : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
                              )}
                            >
                              <Package
                                size={15}
                                className={
                                  active ? "text-slate-900" : "text-slate-400"
                                }
                              />
                              <span className="truncate">{assetType.name}</span>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => navigate(assetRootPath)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12px] font-black transition-colors whitespace-nowrap text-left text-slate-400 hover:text-slate-800 hover:bg-white/70"
                        >
                          <Plus size={14} />
                          <span className="truncate">Sukurti turto tipą</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                const groupItems = visibleAdminItemsForUser.filter(
                  (item) => item.group === group,
                );
                if (!groupItems.length) return null;

                return (
                  <div key={group} className="space-y-1.5">
                    <div className="px-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 whitespace-nowrap">
                      {group}
                    </div>
                    <div className="flex md:flex-col gap-1">
                      {groupItems.map((tab) => {
                        const active = path.includes(getTabRoute(tab.id));
                        return (
                          <button
                            key={tab.id}
                            onClick={() => navigate(getTabRoute(tab.id))}
                            className={cn(
                              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors whitespace-nowrap text-left",
                              active
                                ? "bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/70",
                            )}
                          >
                            <tab.icon
                              size={15}
                              className={active ? "text-slate-900" : "text-slate-400"}
                            />
                            <span className="truncate">{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-h-0 w-full overflow-visible">
        {path.includes(getTabRoute("cities")) && (
          <CitiesAdmin cities={cities} setCities={setCities} clubs={clubs} />
        )}
        {path.includes(getTabRoute("users")) && (
          <UsersAdmin
            users={users}
            setUsers={setUsers}
            clubs={clubs}
            permissionRoles={permissionRoles}
            permissionsConfig={permissionPreviewConfig}
            tasks={tasks}
            periodicTemplates={periodicTemplates}
          />
        )}
        {path.includes(getTabRoute("roles_permissions")) &&
          canAccessAdminTabResolver(currentUser, "roles_permissions") && (
          <RolesPermissionsPlaceholder
            roles={permissionRoles}
            setRoles={setPermissionRoles}
            moduleAccess={permissionModuleAccess}
            setModuleAccess={setPermissionModuleAccess}
            workflowAccess={permissionWorkflowAccess}
            setWorkflowAccess={setPermissionWorkflowAccess}
            objectScopes={permissionObjectScopes}
            setObjectScopes={setPermissionObjectScopes}
            tenantScopes={permissionTenantScopes}
            setTenantScopes={setPermissionTenantScopes}
            adminRights={permissionAdminRights}
            setAdminRights={setPermissionAdminRights}
            workflows={workflowTypes}
            users={users}
            currentUser={currentUser}
            onResetMockPermissions={handleResetMockPermissions}
          />
        )}
        {path.includes(getTabRoute("clubs")) && (
          <ClubsAdmin
            clubs={clubs}
            setClubs={setClubs}
            cities={cities}
            users={users}
            equipmentList={equipmentList}
            tasks={tasks}
            orders={orders}
            periodicTemplates={periodicTemplates}
            setPeriodicTemplates={setPeriodicTemplates}
          />
        )}
        {path.includes(getTabRoute("facility")) && (
          <FacilityTemplatesAdmin
            templates={facilityTemplates}
            setTemplates={setFacilityTemplates}
            clubs={clubs}
          />
        )}
        {!isLegacyPeriodicTemplatesRoute && path.includes(getTabRoute("periodic_templates")) && (
          <PeriodicTemplatesAdmin
            templates={periodicTemplates}
            setTemplates={setPeriodicTemplates}
            clubs={clubs}
            clubTaskConfigs={clubTaskConfigs}
            setClubTaskConfigs={setClubTaskConfigs}
          />
        )}
        {path.includes(getTabRoute("periodiniai")) && renderPeriodicModule && (
          <div className="h-auto overflow-visible">{renderPeriodicModule()}</div>
        )}
        {path.includes(getTabRoute("equipment")) && (
          <EquipmentAdmin
            equipmentList={equipmentList}
            setEquipmentList={setEquipmentList}
            clubs={clubs}
          />
        )}
        {path.includes(getTabRoute("asset_types")) && (
          <AssetTypesWorkspace
            assetTypes={assetTypes}
            setAssetTypes={setAssetTypes}
            assetObjects={assetObjects}
            setAssetObjects={setAssetObjects}
            assetIssueTypes={assetIssueTypes}
            setAssetIssueTypes={setAssetIssueTypes}
            clubs={clubs}
            workflows={workflowTypes}
            cards={tasks}
            selectedAssetTypeId={selectedAssetTypeIdFromPath}
            onOpenAssetType={(assetTypeId) =>
              navigate(`${assetRootPath}/${assetTypeId}`)
            }
          />
        )}
        {path.includes(getTabRoute("asset_objects")) && (
          <AssetObjectsAdmin
            assetTypes={assetTypes}
            assetObjects={assetObjects}
            setAssetObjects={setAssetObjects}
            clubs={clubs}
          />
        )}
        {path.includes(getTabRoute("asset_issue_types")) && (
          <AssetIssueTypesAdmin
            assetTypes={assetTypes}
            issueTypes={assetIssueTypes}
            setIssueTypes={setAssetIssueTypes}
          />
        )}
        {path.includes(getTabRoute("equipment_issues")) && (
          <EquipmentIssuesAdmin
            assetTypes={assetTypes}
            issueTypes={assetIssueTypes}
            setIssueTypes={setAssetIssueTypes}
          />
        )}
        {path.includes(getTabRoute("inventory")) && (
          <ProcurementAdmin
            products={products}
            setProducts={setProducts}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
            inventorySettings={inventorySettings}
            setInventorySettings={setInventorySettings}
            clubs={clubs}
            subTab={inventorySubTab as any}
            onSubTabChange={onSubTabChange as any}
          />
        )}
        {path.includes(getTabRoute("workflow_types")) &&
          canAccessAdminTabResolver(currentUser, "workflow_types") && (
          <WorkflowTypesAdmin
            workflows={workflowTypes}
            setWorkflows={setWorkflowTypes}
            users={users}
            assetTypes={assetTypes}
            cards={tasks}
            orders={orders}
            periodicTemplates={periodicTemplates}
            workflowAccess={permissionWorkflowAccess}
            onResetTestEnvironment={handleResetWorkflowTestEnvironment}
            currentUser={currentUser}
          />
        )}
        {path.includes(getTabRoute("audit")) &&
          canAccessAdminTabResolver(currentUser, "audit") && <AuditAdmin />}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Submodules
// ==========================================

function RolesPermissionsPlaceholder({
  roles,
  setRoles,
  moduleAccess,
  setModuleAccess,
  workflowAccess,
  setWorkflowAccess,
  objectScopes,
  setObjectScopes,
  tenantScopes,
  setTenantScopes,
  adminRights,
  setAdminRights,
  workflows,
  users,
  currentUser,
  onResetMockPermissions,
}: {
  roles: PermissionRole[];
  setRoles: React.Dispatch<React.SetStateAction<PermissionRole[]>>;
  moduleAccess: ModuleAccessPermission[];
  setModuleAccess: React.Dispatch<React.SetStateAction<ModuleAccessPermission[]>>;
  workflowAccess: WorkflowAccessPermission[];
  setWorkflowAccess: React.Dispatch<
    React.SetStateAction<WorkflowAccessPermission[]>
  >;
  objectScopes: ObjectScopePermission[];
  setObjectScopes: React.Dispatch<React.SetStateAction<ObjectScopePermission[]>>;
  tenantScopes: TenantScopePermission[];
  setTenantScopes: React.Dispatch<React.SetStateAction<TenantScopePermission[]>>;
  adminRights: AdminRightsPermission[];
  setAdminRights: React.Dispatch<React.SetStateAction<AdminRightsPermission[]>>;
  workflows: WorkflowType[];
  users: User[];
  currentUser: AuthUser | null;
  onResetMockPermissions: () => void;
}) {
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [activePermissionsTab, setActivePermissionsTab] = useState<
    "roles" | "migration"
  >("roles");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id || "");
  const [showMigrationDetails, setShowMigrationDetails] = useState(false);

  type ModulePermissionKey =
    | "canView"
    | "canCreate"
    | "canEdit"
    | "canAdmin";
  type WorkflowPermissionKey =
    | "canView"
    | "canCreate"
    | "canTransition"
    | "canClose"
    | "canApprove"
    | "canViewAnalytics";
  type AdminRightsKey = keyof Omit<AdminRightsPermission, "roleId">;

  const visibleModules = moduleRegistry
    .filter((module) => module.category !== "hidden")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const activeWorkflows = useMemo(
    () =>
      workflows
        .filter(
          (workflow) => workflow.active !== false && workflow.enabled !== false,
        )
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [workflows],
  );
  const workflowAccessRows = useMemo(
    () => [
      ...activeWorkflows.map((workflow) => ({
        id: workflow.id,
        label: workflow.label || workflow.name,
      })),
      { id: "periodiniai", label: "Periodiniai darbai" },
    ],
    [activeWorkflows],
  );
  const modulePermissionKeys: Array<{
    key: ModulePermissionKey;
    label: string;
  }> = [
    { key: "canView", label: "View" },
    { key: "canCreate", label: "Create" },
    { key: "canEdit", label: "Edit" },
    { key: "canAdmin", label: "Admin" },
  ];
  const workflowPermissionKeys: Array<{
    key: WorkflowPermissionKey;
    label: string;
  }> = [
    { key: "canView", label: "View" },
    { key: "canCreate", label: "Create" },
    { key: "canTransition", label: "Transition" },
    { key: "canClose", label: "Close" },
    { key: "canApprove", label: "Approve" },
    { key: "canViewAnalytics", label: "Analytics" },
  ];
  const visibleWorkflowPermissionKeys = workflowPermissionKeys.filter(
    (permission) => permission.key !== "canApprove",
  );
  const adminRightsKeys: Array<{ key: AdminRightsKey; label: string }> = [
    { key: "canManageUsers", label: "Users" },
    { key: "canManageRoles", label: "Roles" },
    { key: "canManageWorkflowTypes", label: "Workflow Types" },
    { key: "canManageSLA", label: "SLA" },
    { key: "canManageAutomations", label: "Automations" },
    { key: "canManageIntegrations", label: "Integrations" },
  ];
  const permissionsConfig: PermissionPreviewConfig = {
    roles,
    moduleAccess,
    workflowAccess,
    objectScopes,
    tenantScopes,
    adminRights,
  };
  const shadowModeComparisons = users.flatMap((user) =>
    compareLegacyVsResolverAccess(user, permissionsConfig),
  );
  const shadowModeMismatches = shadowModeComparisons.filter(
    (comparison) => comparison.mismatch,
  );
  const workflowShadowComparisons = users.flatMap((user) =>
    compareLegacyVsResolverWorkflowAccess(
      user,
      activeWorkflows,
      permissionsConfig,
    ),
  );
  const workflowShadowMismatches = workflowShadowComparisons.filter(
    (comparison) => comparison.mismatch,
  );
  const actionShadowComparisons = users.flatMap((user) =>
    compareLegacyVsResolverActionAccess(
      user,
      activeWorkflows,
      permissionsConfig,
    ),
  );
  const actionShadowMismatches = actionShadowComparisons.filter(
    (comparison) => comparison.mismatch,
  );
  const workflowLegacyFallbackCount = workflowShadowComparisons.filter(
    (comparison) => comparison.resolverDataMissing,
  ).length;
  const canViewMigrationCheck =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.effectiveRoles?.some((role) =>
      `${role.id} ${role.name}`.toUpperCase().includes("DEV"),
    ) ||
    false;
  const getHydratedRolePreview = (user: User) => {
    const preview = resolveEffectivePermissionPreview(user, permissionsConfig);
    return {
      assignedRoles: preview.assignedRoles.map((role) => role.name).join(", "),
      effectiveRoles: preview.assignedRoles.map((role) => role.name).join(", "),
    };
  };

  useEffect(() => {
    if (!canViewMigrationCheck && activePermissionsTab === "migration") {
      setActivePermissionsTab("roles");
    }
  }, [activePermissionsTab, canViewMigrationCheck]);

  useEffect(() => {
    if (!roles.length) {
      setSelectedRoleId("");
      return;
    }

    if (!roles.some((role) => role.id === selectedRoleId)) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const filteredRoles = roles.filter((role) => {
    const query = roleSearchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      role.name.toLowerCase().includes(query) ||
      role.description.toLowerCase().includes(query)
    );
  });
  const selectedRole =
    roles.find((role) => role.id === selectedRoleId) || roles[0];
  const getRoleAssignmentCount = (roleId: string) =>
    users.filter((user) => (user.assignedRoleIds || []).includes(roleId)).length;

  const getModuleAccess = (roleId: string, moduleId: string) =>
    moduleAccess.find(
      (access) => access.roleId === roleId && access.moduleId === moduleId,
    ) || {
      roleId,
      moduleId,
      canView: false,
      canCreate: false,
      canEdit: false,
      canAdmin: false,
    };

  const getWorkflowAccess = (roleId: string, workflowTypeId: string) =>
    workflowAccess.find(
      (access) =>
        access.roleId === roleId && access.workflowTypeId === workflowTypeId,
    ) || {
      roleId,
      workflowTypeId,
      canView: false,
      canCreate: false,
      canTransition: false,
      canClose: false,
      canApprove: false,
      canViewAnalytics: false,
    };

  const getObjectScope = (roleId: string) =>
    objectScopes.find((scope) => scope.roleId === roleId) || {
      roleId,
      scopeType: "OWN_ONLY" as ObjectScopeType,
      regionIds: [],
      clubIds: [],
    };

  const getTenantScope = (roleId: string) =>
    tenantScopes.find((scope) => scope.roleId === roleId) || {
      roleId,
      tenantIds: [],
    };

  const getAdminRights = (roleId: string) =>
    adminRights.find((rights) => rights.roleId === roleId) || {
      roleId,
      canManageUsers: false,
      canManageRoles: false,
      canManageWorkflowTypes: false,
      canManageSLA: false,
      canManageAutomations: false,
      canManageIntegrations: false,
    };

  const updateRole = (
    roleId: string,
    patch: Partial<Pick<PermissionRole, "name" | "description" | "active">>,
  ) => {
    setRoles((currentRoles) =>
      currentRoles.map((role) =>
        role.id === roleId ? { ...role, ...patch } : role,
      ),
    );
  };

  const deleteRole = (role: PermissionRole) => {
    if (role.systemRole) return;

    if (getRoleAssignmentCount(role.id) > 0) {
      alert("Role cannot be deleted because it is assigned to users.");
      return;
    }

    setRoles((currentRoles) =>
      currentRoles.filter((currentRole) => currentRole.id !== role.id),
    );
    setModuleAccess((currentAccess) =>
      currentAccess.filter((access) => access.roleId !== role.id),
    );
    setWorkflowAccess((currentAccess) =>
      currentAccess.filter((access) => access.roleId !== role.id),
    );
    setObjectScopes((currentScopes) =>
      currentScopes.filter((scope) => scope.roleId !== role.id),
    );
    setTenantScopes((currentScopes) =>
      currentScopes.filter((scope) => scope.roleId !== role.id),
    );
    setAdminRights((currentRights) =>
      currentRights.filter((rights) => rights.roleId !== role.id),
    );
  };

  const toggleModuleAccess = (
    roleId: string,
    moduleId: string,
    permission: ModulePermissionKey,
  ) => {
    setModuleAccess((currentAccess) => {
      const existing = currentAccess.find(
        (access) => access.roleId === roleId && access.moduleId === moduleId,
      );
      if (!existing) {
        return [
          ...currentAccess,
          {
            roleId,
            moduleId,
            canView: false,
            canCreate: false,
            canEdit: false,
            canAdmin: false,
            [permission]: true,
          },
        ];
      }

      return currentAccess.map((access) =>
        access.roleId === roleId && access.moduleId === moduleId
          ? { ...access, [permission]: !access[permission] }
          : access,
      );
    });
  };

  const toggleWorkflowAccess = (
    roleId: string,
    workflowTypeId: string,
    permission: WorkflowPermissionKey,
  ) => {
    setWorkflowAccess((currentAccess) => {
      const existing = currentAccess.find(
        (access) =>
          access.roleId === roleId && access.workflowTypeId === workflowTypeId,
      );
      if (!existing) {
        return [
          ...currentAccess,
          {
            roleId,
            workflowTypeId,
            canView: false,
            canCreate: false,
            canTransition: false,
            canClose: false,
            canApprove: false,
            canViewAnalytics: false,
            [permission]: true,
          },
        ];
      }

      return currentAccess.map((access) =>
        access.roleId === roleId && access.workflowTypeId === workflowTypeId
          ? { ...access, [permission]: !access[permission] }
          : access,
      );
    });
  };

  const updateObjectScope = (
    roleId: string,
    patch: Partial<Omit<ObjectScopePermission, "roleId">>,
  ) => {
    setObjectScopes((currentScopes) => {
      const existing = currentScopes.some((scope) => scope.roleId === roleId);
      if (!existing) {
        return [
          ...currentScopes,
          {
            roleId,
            scopeType: "OWN_ONLY",
            regionIds: [],
            clubIds: [],
            ...patch,
          },
        ];
      }

      return currentScopes.map((scope) =>
        scope.roleId === roleId ? { ...scope, ...patch } : scope,
      );
    });
  };

  const updateTenantScope = (roleId: string, tenantIds: string[]) => {
    setTenantScopes((currentScopes) => {
      const existing = currentScopes.some((scope) => scope.roleId === roleId);
      if (!existing) return [...currentScopes, { roleId, tenantIds }];

      return currentScopes.map((scope) =>
        scope.roleId === roleId ? { ...scope, tenantIds } : scope,
      );
    });
  };

  const toggleAdminRight = (roleId: string, permission: AdminRightsKey) => {
    setAdminRights((currentRights) => {
      const existing = currentRights.find((rights) => rights.roleId === roleId);
      if (!existing) {
        return [
          ...currentRights,
          {
            roleId,
            canManageUsers: false,
            canManageRoles: false,
            canManageWorkflowTypes: false,
            canManageSLA: false,
            canManageAutomations: false,
            canManageIntegrations: false,
            [permission]: true,
          },
        ];
      }

      return currentRights.map((rights) =>
        rights.roleId === roleId
          ? { ...rights, [permission]: !rights[permission] }
          : rights,
      );
    });
  };

  const parseCsv = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  useEffect(() => {
    setWorkflowAccess((currentAccess) => {
      const existingKeys = new Set(
        currentAccess.map(
          (access) => `${access.roleId}::${access.workflowTypeId}`,
        ),
      );
      const missingAccess = roles.flatMap((role) =>
        workflowAccessRows
          .filter(
            (workflow) => !existingKeys.has(`${role.id}::${workflow.id}`),
          )
          .map((workflow) => ({
            roleId: role.id,
            workflowTypeId: workflow.id,
            canView: false,
            canCreate: false,
            canTransition: false,
            canClose: false,
            canApprove: false,
            canViewAnalytics: false,
          })),
      );

      return missingAccess.length
        ? [...currentAccess, ...missingAccess]
        : currentAccess;
    });
  }, [roles, setWorkflowAccess, workflowAccessRows]);

  const addRole = () => {
    const roleName = newRoleName.trim();
    if (!roleName) return;

    const roleId = generateUniqueId("role");
    const newRole: PermissionRole = {
      id: roleId,
      name: roleName,
      description: newRoleDescription.trim(),
      active: true,
      systemRole: false,
    };

    setRoles((currentRoles) => [...currentRoles, newRole]);
    setModuleAccess((currentAccess) => [
      ...currentAccess,
      ...visibleModules.map((module) => ({
        roleId,
        moduleId: module.moduleId,
        canView: false,
        canCreate: false,
        canEdit: false,
        canAdmin: false,
      })),
    ]);
    setWorkflowAccess((currentAccess) => [
      ...currentAccess,
      ...workflowAccessRows.map((workflow) => ({
        roleId,
        workflowTypeId: workflow.id,
        canView: false,
        canCreate: false,
        canTransition: false,
        canClose: false,
        canApprove: false,
        canViewAnalytics: false,
      })),
    ]);
    setObjectScopes((currentScopes) => [
      ...currentScopes,
      { roleId, scopeType: "OWN_ONLY", regionIds: [], clubIds: [] },
    ]);
    setTenantScopes((currentScopes) => [
      ...currentScopes,
      { roleId, tenantIds: ["tenant-main"] },
    ]);
    setAdminRights((currentRights) => [
      ...currentRights,
      {
        roleId,
        canManageUsers: false,
        canManageRoles: false,
        canManageWorkflowTypes: false,
        canManageSLA: false,
        canManageAutomations: false,
        canManageIntegrations: false,
      },
    ]);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedRoleId(roleId);
    setActivePermissionsTab("roles");
  };

  return (
    <div className="h-full overflow-y-auto bg-white p-6 md:p-8">
      <div className="max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Organization
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950">
              Roles & Permissions
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Permissions engine placeholder. Full implementation later.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {false && (
            <button
              onClick={onResetMockPermissions}
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            >
              Reset mock permissions
            </button>
            )}
            <div className="inline-flex rounded-2xl bg-slate-100 p-1">
              {(["roles"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePermissionsTab(tab)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                    activePermissionsTab === tab
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:text-slate-800",
                  )}
                >
                  {tab === "roles" ? "Roles" : "Migration Check"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activePermissionsTab === "roles" ? (
          <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Search size={15} className="text-slate-400" />
                <input
                  value={roleSearchQuery}
                  onChange={(event) => setRoleSearchQuery(event.target.value)}
                  placeholder="Search roles"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="mt-4 grid gap-2">
                {filteredRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition-colors",
                      selectedRole?.id === role.id
                        ? "border-slate-300 bg-white shadow-sm"
                        : "border-transparent hover:bg-white/80",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {role.name}
                      </p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          role.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-500",
                        )}
                      >
                        {role.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {role.description || "No description"}
                    </p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {role.systemRole ? "System role" : "Custom role"}
                    </p>
                  </button>
                ))}
                {!filteredRoles.length && (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                    No roles found.
                  </div>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Sukurti rolę
                </p>
                <div className="mt-3 space-y-2">
                  <input
                    value={newRoleName}
                    onChange={(event) => setNewRoleName(event.target.value)}
                    placeholder="Role name"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                  <input
                    value={newRoleDescription}
                    onChange={(event) =>
                      setNewRoleDescription(event.target.value)
                    }
                    placeholder="Description"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                  />
                  <button
                    onClick={addRole}
                    disabled={!newRoleName.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    <Plus size={15} />
                    Sukurti rolę
                  </button>
                </div>
              </div>
            </aside>

            <main className="min-w-0 space-y-5">
              {selectedRole ? (
                <>
                  <section className="rounded-3xl border border-slate-200 bg-white p-5">
                    {(() => {
                      const assignmentCount = getRoleAssignmentCount(
                        selectedRole.id,
                      );
                      const deleteBlocked =
                        selectedRole.systemRole || assignmentCount > 0;

                      return (
                        <div className="mb-4 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (deleteBlocked) {
                                if (assignmentCount > 0) {
                                  alert(
                                    "Role cannot be deleted because it is assigned to users.",
                                  );
                                }
                                return;
                              }

                              deleteRole(selectedRole);
                            }}
                            disabled={selectedRole.systemRole}
                            title={
                              selectedRole.systemRole
                                ? "System roles cannot be deleted"
                                : assignmentCount > 0
                                  ? "Role cannot be deleted because it is assigned to users."
                                  : "Ištrinti rolę"
                            }
                            className={cn(
                              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                              deleteBlocked
                                ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
                                : "border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
                            )}
                          >
                            <Trash2 size={14} />
                            Ištrinti rolę
                          </button>
                        </div>
                      );
                    })()}
                    <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr_auto] lg:items-end">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Role
                        </label>
                        <input
                          value={selectedRole.name}
                          onChange={(event) =>
                            updateRole(selectedRole.id, {
                              name: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Description
                        </label>
                        <input
                          value={selectedRole.description}
                          onChange={(event) =>
                            updateRole(selectedRole.id, {
                              description: event.target.value,
                            })
                          }
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600">
                        <input
                          type="checkbox"
                          checked={selectedRole.active}
                          onChange={(event) =>
                            updateRole(selectedRole.id, {
                              active: event.target.checked,
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300"
                        />
                        Active
                      </label>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        {selectedRole.systemRole ? "System" : "Custom"}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        ID: {selectedRole.id}
                      </span>
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Module Access
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Module-level view, create, edit and admin flags for the
                        selected role only.
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {visibleModules.map((module) => {
                        const access = getModuleAccess(
                          selectedRole.id,
                          module.moduleId,
                        );
                        return (
                          <div
                            key={module.moduleId}
                            className="grid gap-3 p-4 lg:grid-cols-[220px_1fr] lg:items-center"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {module.title}
                            </p>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {modulePermissionKeys.map((permission) => (
                                <label
                                  key={permission.key}
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                                >
                                  <input
                                    type="checkbox"
                                    checked={access[permission.key]}
                                    onChange={() =>
                                      toggleModuleAccess(
                                        selectedRole.id,
                                        module.moduleId,
                                        permission.key,
                                      )
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300"
                                  />
                                  {permission.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Workflow Access
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Workflow-aware preview permissions for future
                        visibility, transition and analytics access.
                      </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {workflowAccessRows.map((workflow) => {
                        const access = getWorkflowAccess(
                          selectedRole.id,
                          workflow.id,
                        );
                        return (
                          <div
                            key={workflow.id}
                            className="grid gap-3 p-4 xl:grid-cols-[220px_1fr] xl:items-center"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {workflow.label}
                            </p>
                            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                              {visibleWorkflowPermissionKeys.map((permission) => (
                                <label
                                  key={permission.key}
                                  className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                                >
                                  <input
                                    type="checkbox"
                                    checked={access[permission.key]}
                                    onChange={() =>
                                      toggleWorkflowAccess(
                                        selectedRole.id,
                                        workflow.id,
                                        permission.key,
                                      )
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300"
                                  />
                                  {permission.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  {false && (
                  <div className="grid gap-5 xl:grid-cols-2">
                    <section className="rounded-3xl border border-slate-200 bg-white">
                      <div className="border-b border-slate-100 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Scope
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Region, club and own-only object boundaries for the
                          selected role.
                        </p>
                      </div>
                      <div className="space-y-3 p-4">
                        {(() => {
                          const scope = getObjectScope(selectedRole.id);
                          return (
                            <>
                              <select
                                value={scope.scopeType}
                                onChange={(event) =>
                                  updateObjectScope(selectedRole.id, {
                                    scopeType:
                                      event.target.value as ObjectScopeType,
                                  })
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              >
                                <option value="ALL">ALL</option>
                                <option value="REGION">REGION</option>
                                <option value="CLUBS">CLUBS</option>
                                <option value="OWN_ONLY">OWN_ONLY</option>
                              </select>
                              <input
                                value={scope.regionIds.join(", ")}
                                onChange={(event) =>
                                  updateObjectScope(selectedRole.id, {
                                    regionIds: parseCsv(event.target.value),
                                  })
                                }
                                placeholder="regionIds"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                              <input
                                value={scope.clubIds.join(", ")}
                                onChange={(event) =>
                                  updateObjectScope(selectedRole.id, {
                                    clubIds: parseCsv(event.target.value),
                                  })
                                }
                                placeholder="clubIds"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                              />
                            </>
                          );
                        })()}
                      </div>
                    </section>

                    <section className="rounded-3xl border border-slate-200 bg-white">
                      <div className="border-b border-slate-100 p-4">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Tenant Scope
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Mock tenant IDs for future franchise, multi-brand and
                          HQ access.
                        </p>
                      </div>
                      <div className="p-4">
                        <input
                          value={getTenantScope(selectedRole.id).tenantIds.join(
                            ", ",
                          )}
                          onChange={(event) =>
                            updateTenantScope(
                              selectedRole.id,
                              parseCsv(event.target.value),
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                      </div>
                    </section>
                  </div>
                  )}

                  {false && (
                  <section className="rounded-3xl border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-4">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Admin Rights
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Future administrative capabilities. These toggles do not
                        affect current permissions.
                      </p>
                    </div>
                    <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
                      {adminRightsKeys.map((permission) => {
                        const rights = getAdminRights(selectedRole.id);
                        return (
                          <label
                            key={permission.key}
                            className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                          >
                            <input
                              type="checkbox"
                              checked={rights[permission.key]}
                              onChange={() =>
                                toggleAdminRight(
                                  selectedRole.id,
                                  permission.key,
                                )
                              }
                              className="h-3.5 w-3.5 rounded border-slate-300"
                            />
                            {permission.label}
                          </label>
                        );
                      })}
                    </div>
                  </section>
                  )}
                </>
              ) : (
                <section className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                  Sukurkite rolę leidimams valdyti.
                </section>
              )}
            </main>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                    Internal diagnostics
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    Migration Check
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm text-slate-500">
                    Compares legacy permissions with resolver-based previews.
                    This panel is diagnostics-only and does not change access.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    Enforcement: OFF
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Workflow visibility enforced
                  </span>
                  <span className="inline-flex w-fit items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    Kūrimo kontrolė įjungta
                  </span>
                </div>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Module mismatches
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {shadowModeMismatches.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Workflow mismatches
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {workflowShadowMismatches.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Action mismatches
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {actionShadowMismatches.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Legacy fallback count
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {workflowLegacyFallbackCount}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold text-slate-500">
                    Enforcement status
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    OFF
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowMigrationDetails((current) => !current)}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                {showMigrationDetails
                  ? "Slėpti detales"
                  : "Peržiūrėti detales"}
              </button>
            </section>

            {showMigrationDetails && (
              <div className="space-y-6">
                <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
                  <div className="border-b border-slate-200/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Module Migration Details
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Legacy module visibility compared with resolver
                          preview. Enforcement remains off.
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          shadowModeMismatches.length
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {shadowModeMismatches.length
                          ? `${shadowModeMismatches.length} mismatch`
                          : "No mismatches"}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="bg-white/60 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Surface</th>
                          <th className="px-4 py-3 font-semibold">Target</th>
                          <th className="px-4 py-3 font-semibold">Legacy</th>
                          <th className="px-4 py-3 font-semibold">Resolver</th>
                          <th className="px-4 py-3 font-semibold">Mode</th>
                          <th className="px-4 py-3 font-semibold">Būsena</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(shadowModeMismatches.length
                          ? shadowModeMismatches
                          : shadowModeComparisons.slice(0, 12)
                        ).map((comparison) => (
                          <tr
                            key={`${comparison.userId}-${comparison.surface}-${comparison.targetId}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {comparison.userName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.surface}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.targetLabel}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.legacyAllowed ? "Allowed" : "Denied"}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.resolverAllowed
                                ? "Allowed"
                                : "Denied"}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.resolverEnforced
                                ? "Resolver enforced"
                                : "Shadow only"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-xs font-bold",
                                  comparison.mismatch
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {comparison.mismatch ? "Mismatch" : "Match"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
                  <div className="border-b border-slate-200/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Workflow Migration Details
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Current workflow.allowedRoles visibility compared
                          with resolver workflow canView preview.
                        </p>
                      </div>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-bold",
                          workflowShadowMismatches.length
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {workflowShadowMismatches.length
                          ? `${workflowShadowMismatches.length} mismatch`
                          : "No mismatches"}
                      </span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-white/60 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Workflow</th>
                          <th className="px-4 py-3 font-semibold">Surface</th>
                          <th className="px-4 py-3 font-semibold">Legacy</th>
                          <th className="px-4 py-3 font-semibold">Resolver</th>
                          <th className="px-4 py-3 font-semibold">
                            Effective roles
                          </th>
                          <th className="px-4 py-3 font-semibold">Fallback</th>
                          <th className="px-4 py-3 font-semibold">Būsena</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(workflowShadowMismatches.length
                          ? workflowShadowMismatches
                          : workflowShadowComparisons.slice(0, 18)
                        ).map((comparison) => (
                          <tr
                            key={`${comparison.userId}-${comparison.surface}-${comparison.workflowTypeId}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {comparison.userName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.workflowName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.surface}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.legacyAllowed ? "Visible" : "Hidden"}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.resolverAllowed
                                ? "Visible"
                                : "Hidden"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.effectiveRoleNames.join(", ") || "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.resolverDataMissing
                                ? "Legacy fallback"
                                : "Resolver data"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-xs font-bold",
                                  comparison.mismatch
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {comparison.mismatch ? "Mismatch" : "Match"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70">
                  <div className="border-b border-slate-200/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Action Permissions Diagnostics
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Current action availability compared with resolver
                          create, edit, transition, close, approve and admin
                          previews. Diagnostics only; no action is blocked.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          No enforcement
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-bold",
                            actionShadowMismatches.length
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700",
                          )}
                        >
                          {actionShadowMismatches.length
                            ? `${actionShadowMismatches.length} mismatch`
                            : "No mismatches"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-sm">
                      <thead className="bg-white/60 text-[11px] uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">User</th>
                          <th className="px-4 py-3 font-semibold">Action</th>
                          <th className="px-4 py-3 font-semibold">Target</th>
                          <th className="px-4 py-3 font-semibold">Legacy UI</th>
                          <th className="px-4 py-3 font-semibold">Resolver</th>
                          <th className="px-4 py-3 font-semibold">Mode</th>
                          <th className="px-4 py-3 font-semibold">Būsena</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(actionShadowMismatches.length
                          ? actionShadowMismatches
                          : actionShadowComparisons.slice(0, 24)
                        ).map((comparison) => (
                          <tr
                            key={`${comparison.userId}-${comparison.action}-${comparison.targetId}`}
                          >
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {comparison.userName}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.action}
                            </td>
                            <td className="px-4 py-3 text-slate-600">
                              {comparison.targetLabel}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.legacyAllowed
                                ? "Available"
                                : "Unavailable"}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.resolverAllowed
                                ? "Allowed"
                                : "Denied"}
                            </td>
                            <td className="px-4 py-3">
                              {comparison.noEnforcement
                                ? "Diagnostics only"
                                : "Enforced"}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-1 text-xs font-bold",
                                  comparison.mismatch
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-500",
                                )}
                              >
                                {comparison.mismatch ? "Mismatch" : "Match"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      Hydrated session role preview
                    </h4>
                  </div>
                  <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                    {users.map((user) => {
                      const rolePreview = getHydratedRolePreview(user);
                      return (
                        <div
                          key={user.id}
                          className="rounded-xl border border-slate-200 bg-white p-3"
                        >
                          <p className="text-sm font-semibold text-slate-900">
                            {user.name}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-slate-500">
                            <p>Legacy role: {user.role}</p>
                            <p>
                              Assigned additive roles:{" "}
                              {rolePreview.assignedRoles || "-"}
                            </p>
                            <p>
                              Hydrated effective roles:{" "}
                              {rolePreview.effectiveRoles || "-"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminModal({
  title,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 flex items-center justify-center p-2 md:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl md:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 md:p-6 overflow-y-auto">{children}</div>
      </motion.div>
    </div>
  );
}

function AssetTypesWorkspace({
  assetTypes,
  setAssetTypes,
  assetObjects,
  setAssetObjects,
  assetIssueTypes,
  setAssetIssueTypes,
  clubs,
  workflows,
  cards,
  selectedAssetTypeId,
  onOpenAssetType,
}: {
  assetTypes: AssetType[];
  setAssetTypes: React.Dispatch<React.SetStateAction<AssetType[]>>;
  assetObjects: AssetObject[];
  setAssetObjects: React.Dispatch<React.SetStateAction<AssetObject[]>>;
  assetIssueTypes: AssetIssueType[];
  setAssetIssueTypes: React.Dispatch<React.SetStateAction<AssetIssueType[]>>;
  clubs: Club[];
  workflows: WorkflowType[];
  cards: any[];
  selectedAssetTypeId?: string;
  onOpenAssetType: (assetTypeId: string) => void;
}) {
  const selectedAssetType = selectedAssetTypeId
    ? assetTypes.find((assetType) => assetType.id === selectedAssetTypeId)
    : null;
  const [activeTab, setActiveTab] = useState<"objects" | "issues">("objects");

  if (!selectedAssetType) {
    return (
      <AssetTypesAdmin
        assetTypes={assetTypes}
        setAssetTypes={setAssetTypes}
        assetObjects={assetObjects}
        assetIssueTypes={assetIssueTypes}
        workflows={workflows}
        cards={cards}
        onOpenAssetType={onOpenAssetType}
      />
    );
  }

  const objectCount = assetObjects.filter(
    (object) => object.assetTypeId === selectedAssetType.id,
  ).length;
  const issueCount = assetIssueTypes.filter(
    (issueType) => issueType.assetTypeId === selectedAssetType.id,
  ).length;

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            {selectedAssetType.name}
          </h2>
          <p className="text-sm text-slate-500 font-medium">
            Turto tipas valdo savo turto vienetus ir gedimų tipus.
          </p>
        </div>
        <AdminActiveSwitch
          active={selectedAssetType.active !== false}
          onClick={() =>
            setAssetTypes(
              assetTypes.map((assetType) =>
                assetType.id === selectedAssetType.id
                  ? { ...assetType, active: !assetType.active }
                  : assetType,
              ),
            )
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("objects")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left transition-colors",
            activeTab === "objects"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <span className="block text-sm font-black">Turto vienetai</span>
          <span className="text-xs font-bold opacity-70">{objectCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("issues")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left transition-colors",
            activeTab === "issues"
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
          )}
        >
          <span className="block text-sm font-black">Gedimų tipai</span>
          <span className="text-xs font-bold opacity-70">{issueCount}</span>
        </button>
      </div>

      {activeTab === "objects" ? (
        <AssetObjectsAdmin
          assetTypes={assetTypes}
          assetObjects={assetObjects}
          setAssetObjects={setAssetObjects}
          clubs={clubs}
          lockedAssetTypeId={selectedAssetType.id}
          heading="Turto vienetai"
        />
      ) : (
        <AssetIssueTypesAdmin
          assetTypes={assetTypes}
          issueTypes={assetIssueTypes}
          setIssueTypes={setAssetIssueTypes}
          lockedAssetTypeId={selectedAssetType.id}
          heading="Gedimų tipai"
        />
      )}
    </div>
  );
}

function AssetTypesAdmin({
  assetTypes,
  setAssetTypes,
  assetObjects,
  assetIssueTypes,
  workflows,
  cards,
  onOpenAssetType,
}: {
  assetTypes: AssetType[];
  setAssetTypes: React.Dispatch<React.SetStateAction<AssetType[]>>;
  assetObjects: AssetObject[];
  assetIssueTypes: AssetIssueType[];
  workflows: WorkflowType[];
  cards: any[];
  onOpenAssetType?: (assetTypeId: string) => void;
}) {
  const [editing, setEditing] = useState<AssetType | null>(null);
  const getAssetTypeModeLabel = (mode?: AssetTypeMode) =>
    mode === "ORDERS" ? "Užsakymų valdymas" : "Turto gedimų valdymas";
  const getModeCapabilities = (mode: AssetTypeMode) =>
    mode === "ORDERS"
      ? {
          usesQr: false,
          usesSla: false,
          usesPriority: false,
          usesIssueTypes: false,
          usesAssets: false,
        }
      : {
          usesQr: true,
          usesSla: true,
          usesPriority: true,
          usesIssueTypes: true,
          usesAssets: true,
        };
  const getCardAssetTypeId = (card: any) => {
    if (typeof card?.assetTypeId === "string") return card.assetTypeId;
    if (typeof card?.workflowTypeId === "string") {
      return (
        workflows.find((workflow) => workflow.id === card.workflowTypeId)
          ?.assetTypeId || null
      );
    }
    if (typeof card?.assetObjectId === "string") {
      return (
        assetObjects.find((object) => object.id === card.assetObjectId)
          ?.assetTypeId || null
      );
    }
    return null;
  };
  const getAssetTypeDeleteState = (assetTypeId: string) => {
    const hasWorkflowReferences = workflows.some(
      (workflow) => workflow.assetTypeId === assetTypeId,
    );
    const hasAssetObjects = assetObjects.some(
      (object) => object.assetTypeId === assetTypeId,
    );
    const hasIssueTypes = assetIssueTypes.some(
      (issueType) => issueType.assetTypeId === assetTypeId,
    );
    const hasCardReferences = cards.some(
      (card) => getCardAssetTypeId(card) === assetTypeId,
    );

    return {
      canDelete:
        !hasWorkflowReferences &&
        !hasAssetObjects &&
        !hasIssueTypes &&
        !hasCardReferences,
      hasWorkflowReferences,
      hasAssetObjects,
      hasIssueTypes,
      hasCardReferences,
    };
  };
  const getAssetTypeCode = (name: string) =>
    name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_|_$/g, "") || "ASSET";
  const getAssetTypeId = (name: string) =>
    `asset-type-${name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || Date.now()}`;

  const saveAssetType = () => {
    if (!editing) return;

    const exists = assetTypes.some((assetType) => assetType.id === editing.id);
    const name = editing.name.trim();
    if (!name || !editing.mode) return;
    const mode = editing.mode;
    const nextAssetType: AssetType = {
      ...editing,
      id: editing.id || getAssetTypeId(name),
      code:
        editing.code && editing.code !== "NEW"
          ? editing.code.trim().toUpperCase()
          : getAssetTypeCode(name),
      name,
      description: editing.description?.trim() || undefined,
      mode,
      ...getModeCapabilities(mode),
    };

    setAssetTypes(
      exists
        ? assetTypes.map((assetType) =>
            assetType.id === editing.id ? nextAssetType : assetType,
          )
        : [...assetTypes, nextAssetType],
    );
    setEditing(null);
    if (!exists) {
      onOpenAssetType?.(nextAssetType.id);
    }
  };

  const createAssetType = () => {
    const mode: AssetTypeMode = "ASSET_FAULTS";
    setEditing({
      id: `asset-type-${Date.now()}`,
      code: "NEW",
      name: "",
      description: "",
      mode,
      active: true,
      ...getModeCapabilities(mode),
    });
  };
  const deleteAssetType = (assetType: AssetType) => {
    const deleteState = getAssetTypeDeleteState(assetType.id);
    if (!deleteState.canDelete) return;
    if (!window.confirm("Ištrinti turto tipą?")) return;
    setAssetTypes(assetTypes.filter((item) => item.id !== assetType.id));
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Turtas</h2>
          <p className="text-sm text-slate-500 font-medium">
            Sukurkite turto tipą, tada valdykite jo turto vienetus ir gedimų tipus.
          </p>
        </div>
        <button
          onClick={createAssetType}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Sukurti turto tipą
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-400 font-black">
            <tr>
              <th className="px-4 py-3 text-left">Pavadinimas</th>
              <th className="px-4 py-3 text-left">Veikimo logika</th>
              <th className="px-4 py-3 text-left">Statusas</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {assetTypes.map((assetType) => {
              const deleteState = getAssetTypeDeleteState(assetType.id);
              return (
                <tr key={assetType.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => onOpenAssetType?.(assetType.id)}
                      className="font-bold text-slate-900 hover:underline"
                    >
                      {assetType.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">
                    {getAssetTypeModeLabel(assetType.mode)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminActiveSwitch
                      active={assetType.active}
                      onClick={() =>
                        setAssetTypes(
                          assetTypes.map((item) =>
                            item.id === assetType.id
                              ? { ...item, active: !item.active }
                              : item,
                          ),
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(assetType)}
                      className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                      title="Redaguoti"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteAssetType(assetType)}
                      disabled={!deleteState.canDelete}
                      className={cn(
                        "inline-flex items-center justify-center p-2 rounded-lg",
                        deleteState.canDelete
                          ? "text-slate-500 hover:bg-red-50 hover:text-red-600"
                          : "text-slate-300 cursor-not-allowed",
                      )}
                      title={
                        deleteState.canDelete
                          ? "Ištrinti"
                          : "Turto tipas naudojamas sistemoje"
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminModal
        title="Turto tipas"
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Pavadinimas
              </span>
              <input
                value={editing.name}
                onChange={(event) =>
                  setEditing({ ...editing, name: event.target.value })
                }
                required
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Veikimo logika
              </span>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="asset-type-mode"
                  value="ASSET_FAULTS"
                  checked={editing.mode === "ASSET_FAULTS"}
                  onChange={() =>
                    setEditing({
                      ...editing,
                      mode: "ASSET_FAULTS",
                      ...getModeCapabilities("ASSET_FAULTS"),
                    })
                  }
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-black text-slate-900">
                    Turto gedimų valdymas
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    Turto vienetai, gedimų tipai, SLA, prioritetas, QR, sporto klubas ir statusas.
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="asset-type-mode"
                  value="ORDERS"
                  checked={editing.mode === "ORDERS"}
                  onChange={() =>
                    setEditing({
                      ...editing,
                      mode: "ORDERS",
                      ...getModeCapabilities("ORDERS"),
                    })
                  }
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-black text-slate-900">
                    Užsakymų valdymas
                  </span>
                  <span className="block text-xs font-semibold text-slate-500">
                    SKU, minimalus kiekis, tiekėjas, sporto klubas ir statusas.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold"
              >
                Atšaukti
              </button>
              <button
                onClick={saveAssetType}
                disabled={!editing.name.trim() || !editing.mode}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-bold"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function AssetObjectsAdmin({
  assetTypes,
  assetObjects,
  setAssetObjects,
  clubs,
  lockedAssetTypeId,
  heading = "Turto vienetai",
}: {
  assetTypes: AssetType[];
  assetObjects: AssetObject[];
  setAssetObjects: React.Dispatch<React.SetStateAction<AssetObject[]>>;
  clubs: Club[];
  lockedAssetTypeId?: string;
  heading?: string;
}) {
  const [editing, setEditing] = useState<AssetObject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const defaultAssetTypeId =
    lockedAssetTypeId ||
    assetTypes.find((assetType) => assetType.usesAssets)?.id ||
    assetTypes[0]?.id ||
    "asset-type-equipment";
  const getAssetTypeLabel = (assetTypeId: string) =>
    assetTypes.find((assetType) => assetType.id === assetTypeId)?.name ||
    assetTypeId;
  const getPriorityLabel = (priority: AssetIssueType["priority"]) => {
    if (priority === "low") return "Žemas";
    if (priority === "high") return "Aukštas";
    if (priority === "critical") return "Kritinis";
    return "Vidutinis";
  };
  const getClubLabel = (clubId?: string) =>
    clubId ? clubs.find((club) => club.id === clubId)?.name || clubId : "-";
  const filteredObjects = assetObjects.filter((object) => {
    if (lockedAssetTypeId && object.assetTypeId !== lockedAssetTypeId) {
      return false;
    }
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      object.name.toLowerCase().includes(query) ||
      object.code.toLowerCase().includes(query) ||
      getAssetTypeLabel(object.assetTypeId).toLowerCase().includes(query)
    );
  });

  const saveAssetObject = () => {
    if (!editing || !editing.name.trim()) return;

    const exists = assetObjects.some((object) => object.id === editing.id);
    const club = clubs.find((candidate) => candidate.id === editing.clubId);
    const nextObject: AssetObject = {
      ...editing,
      id:
        editing.id ||
        `asset-object-${editing.assetTypeId}-${Date.now()}`,
      code: editing.code.trim() || editing.name.trim(),
      name: editing.name.trim(),
      active: editing.active !== false,
      regionId: club?.region || editing.regionId,
    };

    setAssetObjects(
      exists
        ? assetObjects.map((object) =>
            object.id === editing.id ? nextObject : object,
          )
        : [...assetObjects, nextObject],
    );
    setEditing(null);
  };

  const createAssetObject = () => {
    setEditing({
      id: `asset-object-${Date.now()}`,
      assetTypeId: defaultAssetTypeId,
      code: "NEW",
      name: "Naujas turto vienetas",
      active: true,
      clubId: "",
      regionId: "",
      qrUrl: "",
      metadata: {},
    });
  };
  const deleteAssetObject = (objectId: string) => {
    if (!window.confirm("Ištrinti turto vienetą?")) return;
    setAssetObjects(assetObjects.filter((object) => object.id !== objectId));
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">{heading}</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti turto vieneto..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
        <button
          onClick={createAssetObject}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Sukurti turto vienetą
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-400 font-black">
            <tr>
              <th className="px-4 py-3 text-left">Pavadinimas</th>
              {!lockedAssetTypeId && (
                <th className="px-4 py-3 text-left">Turto tipas</th>
              )}
              <th className="px-4 py-3 text-left">Kodas</th>
              <th className="px-4 py-3 text-left">Klubas</th>
              <th className="px-4 py-3 text-left">Statusas</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredObjects.map((object) => (
              <tr key={object.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-bold text-slate-900">
                  {object.name}
                </td>
                {!lockedAssetTypeId && (
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {getAssetTypeLabel(object.assetTypeId)}
                  </td>
                )}
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {object.code}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {getClubLabel(object.clubId)}
                </td>
                <td className="px-4 py-3">
                  <AdminActiveSwitch
                    active={object.active !== false}
                    onClick={() =>
                      setAssetObjects(
                        assetObjects.map((item) =>
                          item.id === object.id
                            ? { ...item, active: item.active === false }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(object)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Redaguoti"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteAssetObject(object.id)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Ištrinti"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredObjects.length === 0 && (
              <tr>
                <td
                  colSpan={lockedAssetTypeId ? 5 : 6}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AdminModal
        title="Turto vienetas"
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-4">
            {!lockedAssetTypeId && (
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Turto tipas
              </span>
              <select
                value={editing.assetTypeId}
                onChange={(event) =>
                  setEditing({ ...editing, assetTypeId: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              >
                {assetTypes
                  .filter(
                    (assetType) =>
                      assetType.usesAssets ||
                      assetType.id === editing.assetTypeId,
                  )
                  .map((assetType) => (
                    <option key={assetType.id} value={assetType.id}>
                      {assetType.name}
                    </option>
                ))}
              </select>
            </label>
            )}

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Pavadinimas
              </span>
              <input
                value={editing.name}
                onChange={(event) =>
                  setEditing({ ...editing, name: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Kodas
                </span>
                <input
                  value={editing.code}
                  onChange={(event) =>
                    setEditing({ ...editing, code: event.target.value })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Klubas
                </span>
                <select
                  value={editing.clubId || ""}
                  onChange={(event) => {
                    const club = clubs.find(
                      (candidate) => candidate.id === event.target.value,
                    );
                    setEditing({
                      ...editing,
                      clubId: event.target.value || undefined,
                      regionId: club?.region || undefined,
                    });
                  }}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="">Be klubo</option>
                  {clubs
                    .filter(
                      (club) =>
                        club.is_active !== false ||
                        club.id === editing.clubId,
                    )
                    .map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                QR URL
              </span>
              <input
                value={editing.qrUrl || ""}
                onChange={(event) =>
                  setEditing({ ...editing, qrUrl: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                placeholder="https://..."
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold"
              >
                Atšaukti
              </button>
              <button
                onClick={saveAssetObject}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-bold"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function AssetIssueTypesAdmin({
  assetTypes,
  issueTypes,
  setIssueTypes,
  lockedAssetTypeId,
  heading = "Gedimo tipai",
}: {
  assetTypes: AssetType[];
  issueTypes: AssetIssueType[];
  setIssueTypes: React.Dispatch<React.SetStateAction<AssetIssueType[]>>;
  lockedAssetTypeId?: string;
  heading?: string;
}) {
  const [editing, setEditing] = useState<AssetIssueType | null>(null);
  const defaultAssetTypeId =
    lockedAssetTypeId ||
    assetTypes.find((assetType) => assetType.code === "EQUIPMENT")?.id ||
    assetTypes[0]?.id ||
    "asset-type-equipment";
  const getAssetTypeLabel = (assetTypeId: string) =>
    assetTypes.find((assetType) => assetType.id === assetTypeId)?.name ||
    assetTypeId;

  const filteredIssueTypes = issueTypes.filter(
    (issueType) =>
      !lockedAssetTypeId || issueType.assetTypeId === lockedAssetTypeId,
  );

  const saveIssueType = () => {
    if (!editing) return;

    const exists = issueTypes.some((issueType) => issueType.id === editing.id);
    const nextIssueType: AssetIssueType = {
      ...editing,
      id:
        editing.id ||
        `asset-issue-${editing.assetTypeId}-${Date.now()}`,
      code:
        editing.code.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_") ||
        editing.name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      name: editing.name.trim() || editing.code.trim(),
      slaHours: Number(editing.slaHours) || 24,
    };

    setIssueTypes(
      exists
        ? issueTypes.map((issueType) =>
            issueType.id === editing.id ? nextIssueType : issueType,
          )
        : [...issueTypes, nextIssueType],
    );
    setEditing(null);
  };

  const createIssueType = () => {
    setEditing({
      id: `asset-issue-${Date.now()}`,
      assetTypeId: defaultAssetTypeId,
      code: "NEW",
      name: "Naujas gedimo tipas",
      active: true,
      isDefault: false,
      priority: "medium",
      slaHours: 24,
      legacySource: "equipmentIssueTypesList",
      legacyId: `asset-${Date.now()}`,
    });
  };
  const deleteIssueType = (issueTypeId: string) => {
    if (!window.confirm("Ištrinti gedimo tipą?")) return;
    setIssueTypes(issueTypes.filter((issueType) => issueType.id !== issueTypeId));
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">{heading}</h2>
          <p className="text-sm text-slate-500 font-medium">
            Gedimo tipai naudojami SLA ir prioriteto valdymui pagal turto tipą.
          </p>
        </div>
        <button
          onClick={createIssueType}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Sukurti gedimo tipą
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase text-slate-400 font-black">
            <tr>
              <th className="px-4 py-3 text-left">Pavadinimas</th>
              {!lockedAssetTypeId && (
                <th className="px-4 py-3 text-left">Turto tipas</th>
              )}
              <th className="px-4 py-3 text-left">Prioritetas</th>
              <th className="px-4 py-3 text-left">SLA</th>
              <th className="px-4 py-3 text-left">Numatytasis</th>
              <th className="px-4 py-3 text-left">Statusas</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredIssueTypes.map((issueType) => (
              <tr key={issueType.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">
                    {issueType.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-400">
                    {issueType.code}
                  </div>
                </td>
                {!lockedAssetTypeId && (
                  <td className="px-4 py-3 font-semibold text-slate-600">
                    {getAssetTypeLabel(issueType.assetTypeId)}
                  </td>
                )}
                <td className="px-4 py-3 font-bold uppercase text-slate-600">
                  {getPriorityLabel(issueType.priority)}
                </td>
                <td className="px-4 py-3 font-bold text-slate-600">
                  {issueType.slaHours}h
                </td>
                <td className="px-4 py-3">
                  {issueType.isDefault ? "Taip" : "Ne"}
                </td>
                <td className="px-4 py-3">
                  <AdminActiveSwitch
                    active={issueType.active}
                    onClick={() =>
                      setIssueTypes(
                        issueTypes.map((item) =>
                          item.id === issueType.id
                            ? { ...item, active: !item.active }
                            : item,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setEditing(issueType)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                    title="Redaguoti"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteIssueType(issueType.id)}
                    className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                    title="Ištrinti"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminModal
        title="Gedimo tipas"
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-4">
            {!lockedAssetTypeId && (
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Turto tipas
              </span>
              <select
                value={editing.assetTypeId}
                onChange={(event) =>
                  setEditing({ ...editing, assetTypeId: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              >
                {assetTypes
                  .filter(
                    (assetType) =>
                      assetType.usesIssueTypes ||
                      assetType.id === editing.assetTypeId,
                  )
                  .map((assetType) => (
                    <option key={assetType.id} value={assetType.id}>
                      {assetType.name}
                    </option>
                ))}
              </select>
            </label>
            )}

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Pavadinimas
              </span>
              <input
                value={editing.name}
                onChange={(event) =>
                  setEditing({ ...editing, name: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Kodas
              </span>
              <input
                value={editing.code}
                onChange={(event) =>
                  setEditing({ ...editing, code: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Prioritetas
                </span>
                <select
                  value={editing.priority}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      priority: event.target.value as AssetIssueType["priority"],
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="low">Žemas</option>
                  <option value="medium">Vidutinis</option>
                  <option value="high">Aukštas</option>
                  <option value="critical">Kritinis</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  SLA val.
                </span>
                <input
                  type="number"
                  value={editing.slaHours}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      slaHours: Number(event.target.value),
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={editing.isDefault}
                onChange={(event) =>
                  setEditing({ ...editing, isDefault: event.target.checked })
                }
              />
              Numatytasis gedimo tipas
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold"
              >
                Atšaukti
              </button>
              <button
                onClick={saveIssueType}
                className="px-4 py-2 rounded-xl bg-black text-white text-sm font-bold"
              >
                Išsaugoti
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function WorkflowTypesAdmin({
  workflows,
  setWorkflows,
  users,
  assetTypes,
  cards,
  orders,
  periodicTemplates,
  workflowAccess,
  onResetTestEnvironment,
  currentUser,
}: {
  workflows: WorkflowType[];
  setWorkflows?: React.Dispatch<React.SetStateAction<WorkflowType[]>>;
  users: User[];
  assetTypes: AssetType[];
  cards: any[];
  orders: any[];
  periodicTemplates: any[];
  workflowAccess: WorkflowAccessPermission[];
  onResetTestEnvironment?: () => void;
  currentUser?: AuthUser | null;
}) {
  const [editing, setEditing] = useState<WorkflowType | null>(null);
  const [pendingDeleteWorkflow, setPendingDeleteWorkflow] =
    useState<WorkflowType | null>(null);
  const [workflowArchiveFilter, setWorkflowArchiveFilter] = useState<
    "active" | "archive"
  >("active");
  const activeUsers = useMemo(
    () => users.filter((user) => user.is_active !== false),
    [users],
  );
  const getOwnerLabel = useCallback(
    (ownerUserId?: string | null) => {
      if (!ownerUserId) return "No owner";
      return users.find((user) => user.id === ownerUserId)?.name || ownerUserId;
    },
    [users],
  );
  const getAssetTypeLabel = (assetTypeId?: string | null) =>
    assetTypes.find((assetType) => assetType.id === assetTypeId)?.name ||
    "Be turto tipo";

  const getWorkflowUsage = useCallback(
    (workflow: WorkflowType) => {
      const matchesWorkflowId = (item: any) =>
        item?.workflowTypeId === workflow.id ||
        item?.destinationWorkflowTypeId === workflow.id ||
        item?.workflowId === workflow.id;

      return {
        cards: [...cards, ...orders].filter(matchesWorkflowId).length,
        periodic: periodicTemplates.filter(matchesWorkflowId).length,
        registrationForms: workflow.requiredFields?.length ? 1 : 0,
        permissionReferences: workflowAccess.filter(
          (access) => access.workflowTypeId === workflow.id,
        ).length,
      };
    },
    [cards, orders, periodicTemplates, workflowAccess],
  );

  const archiveWorkflow = (workflow: WorkflowType) => {
    if (!setWorkflows || workflow.archivedAt) return;

    const usage = getWorkflowUsage(workflow);
    const confirmed = window.confirm(
      [
        `Archyvuoti workflow "${workflow.name}"?`,
        "",
        "Workflow naudojamas:",
        `kortelės: ${usage.cards}`,
        `periodiniai: ${usage.periodic}`,
        `registracijos formos: ${usage.registrationForms}`,
        "",
        "Archyvuotas workflow nebus rodomas registracijoje ir nebus naudojamas naujoms kortelėms.",
      ].join("\n"),
    );

    if (!confirmed) return;

    setWorkflows(
      workflows.map((item) =>
        item.id === workflow.id
          ? {
              ...item,
              active: false,
              enabled: false,
              archivedAt: Date.now(),
              archivedBy: currentUser?.name || currentUser?.email || "System",
              archiveReason: "Manual workflow archive",
            }
          : item,
      ),
    );
  };

  const requestDeleteWorkflow = (workflow: WorkflowType) => {
    const usage = getWorkflowUsage(workflow);
    if (
      usage.cards > 0 ||
      usage.periodic > 0 ||
      usage.registrationForms > 0 ||
      usage.permissionReferences > 0
    ) {
      window.alert(
        [
          "Negalima ištrinti workflow.",
          "",
          "Naudojamas sistemoje:",
          "",
          `Kortelės: ${usage.cards}`,
          `Periodiniai: ${usage.periodic}`,
          `Registracijos: ${usage.registrationForms}`,
          `Teisės: ${usage.permissionReferences}`,
        ].join("\n"),
      );
      return;
    }

    setPendingDeleteWorkflow(workflow);
  };

  const confirmDeleteWorkflow = () => {
    if (!pendingDeleteWorkflow || !setWorkflows) return;

    setWorkflows(
      workflows.filter((workflow) => workflow.id !== pendingDeleteWorkflow.id),
    );
    if (editing?.id === pendingDeleteWorkflow.id) {
      setEditing(null);
    }
    setPendingDeleteWorkflow(null);
  };

  const saveWorkflow = () => {
    if (!editing || !setWorkflows) return;

    const exists = workflows.some((workflow) => workflow.id === editing.id);
    const nextWorkflow = {
      ...editing,
      id:
        editing.id ||
        editing.name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      legacyCategory: editing.legacyCategory || editing.id || "OTHER",
      statuses: editing.statuses.length ? editing.statuses : initialWorkflowTypes[0].statuses,
      priorities: editing.priorities.length
        ? editing.priorities
        : initialWorkflowTypes[0].priorities,
      objectType: editing.objectType || "GENERIC",
      assetTypeId: editing.assetTypeId || null,
      qrMode: editing.qrMode || "OFF",
      usesScope: editing.usesScope ?? false,
      ownerUserId: editing.ownerUserId ?? null,
      archivedAt: editing.archivedAt,
      archivedBy: editing.archivedBy,
      archiveReason: editing.archiveReason,
      kanbanSettings: {
        ...editing.kanbanSettings,
        lanes: editing.statuses.map((status) => status.id),
      },
    };

    setWorkflows(
      exists
        ? workflows.map((workflow) =>
            workflow.id === editing.id ? nextWorkflow : workflow,
          )
        : [...workflows, nextWorkflow],
    );
    setEditing(null);
  };

  const createWorkflow = () => {
    const base = initialWorkflowTypes[0];
    setEditing({
      ...base,
      id: `workflow-${Date.now()}`,
      legacyCategory: "OTHER",
      action: "other",
      name: "Naujas workflow",
      description: "Naujas konfiguruojamas procesas",
      icon: "AlertCircle",
      category: "DARBAI",
      enabled: true,
      objectType: "GENERIC",
      assetTypeId: null,
      qrMode: "OFF",
      usesScope: false,
      ownerUserId: null,
      linkedConfigs: {},
      templates: [],
    });
  };

  const filteredWorkflows = workflows.filter((workflow) =>
    workflowArchiveFilter === "archive"
      ? Boolean(workflow.archivedAt)
      : !workflow.archivedAt,
  );

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold">Workflow Types</h2>
          <p className="text-sm text-slate-500 font-medium">
            Universal workflow engine konfiguracija is mock DB sluoksnio.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setWorkflowArchiveFilter("active")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black",
                workflowArchiveFilter === "active"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500",
              )}
            >
              Aktyvūs
            </button>
            <button
              type="button"
              onClick={() => setWorkflowArchiveFilter("archive")}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-black",
                workflowArchiveFilter === "archive"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500",
              )}
            >
              Archyvas
            </button>
          </div>
          <button
            onClick={createWorkflow}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
          >
            <Plus size={16} /> Sukurti workflow
          </button>
          <button
            type="button"
            onClick={onResetTestEnvironment}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold hover:bg-red-100 text-sm"
          >
            <RefreshCw size={16} /> Reset Test Environment
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredWorkflows.map((workflow) => {
          const Icon =
            workflowIconMap[workflow.icon as keyof typeof workflowIconMap] ||
            AlertCircle;
          const usage = getWorkflowUsage(workflow);

          return (
            <div
              key={workflow.id}
              className={cn(
                "border rounded-2xl p-4 bg-white shadow-sm space-y-4",
                workflow.archivedAt
                  ? "border-amber-200 bg-amber-50/30"
                  : "border-slate-200",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                    workflow.bg,
                  )}
                >
                  <Icon size={20} className={workflow.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 truncate">
                      {workflow.name}
                    </h3>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase rounded-full px-2 py-0.5",
                        workflow.archivedAt
                          ? "bg-amber-100 text-amber-700"
                          : workflow.enabled
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {workflow.archivedAt ? "Archived" : workflow.enabled ? "On" : "Off"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {workflow.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px] font-black">
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-slate-400 uppercase">Kortelės</span>
                  {usage.cards}
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-slate-400 uppercase">Periodiniai</span>
                  {usage.periodic}
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-slate-400 uppercase">Formos</span>
                  {usage.registrationForms}
                </div>
                <div className="rounded-xl bg-slate-50 p-2">
                  <span className="block text-slate-400 uppercase">Teisės</span>
                  {usage.permissionReferences}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="block text-slate-400 uppercase">
                    Turto tipas
                  </span>
                  {getAssetTypeLabel(workflow.assetTypeId)}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="block text-slate-400 uppercase">Statuses</span>
                  {workflow.statuses.length}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="block text-slate-400 uppercase">QR</span>
                  {workflow.qrMode || "OFF"}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="block text-slate-400 uppercase">Scope</span>
                  {workflow.usesScope ? "ON" : "OFF"}
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <span className="block text-slate-400 uppercase">Owner</span>
                  <span className="block truncate">
                    {getOwnerLabel(workflow.ownerUserId)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  role="switch"
                  aria-checked={workflow.enabled}
                  title={workflow.enabled ? "ON" : "OFF"}
                  disabled={Boolean(workflow.archivedAt)}
                  onClick={() =>
                    setWorkflows?.(
                      workflows.map((item) =>
                        item.id === workflow.id
                          ? { ...item, enabled: !item.enabled }
                          : item,
                      ),
                    )
                  }
                  className={cn(
                    "flex-1 px-3 py-2 rounded-xl border text-xs font-black transition-colors flex items-center justify-between gap-3",
                    workflow.archivedAt
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : workflow.enabled
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-500 border-slate-200",
                  )}
                >
                  <span>{workflow.enabled ? "ON" : "OFF"}</span>
                  <span
                    className={cn(
                      "relative inline-flex h-5 w-9 rounded-full transition-colors",
                      workflow.enabled ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        workflow.enabled ? "translate-x-4" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
                <button
                  onClick={() => setEditing(workflow)}
                  className="flex-1 px-3 py-2 rounded-xl bg-black text-white text-xs font-black hover:bg-slate-800"
                >
                  Redaguoti
                </button>
                {!workflow.archivedAt && (
                  <button
                    type="button"
                    onClick={() => archiveWorkflow(workflow)}
                    className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black hover:bg-amber-100"
                    title="Archyvuoti"
                  >
                    <Archive size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => requestDeleteWorkflow(workflow)}
                  className="px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-black hover:bg-red-100"
                  title="Ištrinti"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AdminModal
        title="Ištrinti workflow"
        isOpen={Boolean(pendingDeleteWorkflow)}
        onClose={() => setPendingDeleteWorkflow(null)}
      >
        {pendingDeleteWorkflow && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-black text-red-900">
                Tikrai ištrinti workflow?
              </p>
              <p className="text-xs font-semibold text-red-700 mt-1">
                {pendingDeleteWorkflow.name}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteWorkflow(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-sm font-black hover:bg-slate-200"
              >
                Atšaukti
              </button>
              <button
                type="button"
                onClick={confirmDeleteWorkflow}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-black hover:bg-red-700"
              >
                Ištrinti
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      <AdminModal
        title="Workflow konfiguracija"
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Pavadinimas
              </span>
              <input
                value={editing.name}
                onChange={(event) =>
                  setEditing({ ...editing, name: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Aprasymas
              </span>
              <textarea
                value={editing.description}
                onChange={(event) =>
                  setEditing({ ...editing, description: event.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-medium min-h-[90px]"
              />
            </label>

            <div className="grid grid-cols-1 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Turto tipas
                </span>
                <select
                  value={editing.assetTypeId || ""}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      assetTypeId: event.target.value || null,
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="">Be turto tipo</option>
                  {assetTypes
                    .filter(
                      (assetType) =>
                        assetType.active ||
                        assetType.id === editing.assetTypeId,
                    )
                    .map((assetType) => (
                      <option key={assetType.id} value={assetType.id}>
                        {assetType.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  QR Mode
                </span>
                <select
                  value={editing.qrMode || "OFF"}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      qrMode: event.target.value as WorkflowType["qrMode"],
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="OFF">OFF</option>
                  <option value="GENERIC">GENERIC</option>
                  <option value="ASSET_BASED">ASSET_BASED</option>
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-[11px] font-black uppercase text-slate-400">
                  Owner
                </span>
                <select
                  value={editing.ownerUserId || ""}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      ownerUserId: event.target.value || null,
                    })
                  }
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="">No owner</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-1">
              <span className="text-[11px] font-black uppercase text-slate-400">
                Statusai
              </span>
              <input
                value={editing.statuses.map((status) => status.label).join(", ")}
                onChange={(event) => {
                  const statuses = event.target.value
                    .split(",")
                    .map((value) => value.trim())
                    .filter(Boolean)
                    .map((value) => ({ id: value, label: value }));
                  setEditing({
                    ...editing,
                    statuses,
                    kanbanSettings: {
                      ...editing.kanbanSettings,
                      lanes: statuses.map((status) => status.id),
                    },
                  });
                }}
                className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </label>

            <div className="rounded-xl bg-slate-50 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase text-slate-400">
                    Uses Region / Club Scope
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {editing.usesScope
                      ? "Workflow uses region/club filtering and routing."
                      : "Workflow is global. Examples: Marketing, Camera Monitoring, IT."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={editing.usesScope}
                  onClick={() =>
                    setEditing({ ...editing, usesScope: !editing.usesScope })
                  }
                  className={cn(
                    "shrink-0 px-3 py-2 rounded-xl border text-xs font-black transition-colors flex items-center gap-3",
                    editing.usesScope
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200",
                  )}
                >
                  <span>{editing.usesScope ? "ON" : "OFF"}</span>
                  <span
                    className={cn(
                      "relative inline-flex h-5 w-9 rounded-full transition-colors",
                      editing.usesScope ? "bg-emerald-500" : "bg-slate-300",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                        editing.usesScope ? "translate-x-4" : "translate-x-0.5",
                      )}
                    />
                  </span>
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold">
              <input
                type="checkbox"
                checked={editing.enabled}
                onChange={(event) =>
                  setEditing({ ...editing, enabled: event.target.checked })
                }
                className="h-4 w-4 accent-black"
              />
              Workflow ijungtas
            </label>

            <button
              onClick={saveWorkflow}
              className="w-full py-3 bg-black text-white rounded-xl font-black"
            >
              Issaugoti
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

function ClubsAdmin({
  clubs,
  setClubs,
  cities,
  users,
  equipmentList,
  tasks,
  orders,
  periodicTemplates,
  setPeriodicTemplates,
}: {
  clubs: Club[];
  setClubs: React.Dispatch<React.SetStateAction<Club[]>>;
  cities: City[];
  users: User[];
  equipmentList: any[];
  tasks: any[];
  orders: any[];
  periodicTemplates: any[];
  setPeriodicTemplates: React.Dispatch<React.SetStateAction<any[]>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Club>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredClubs = clubs.filter((club) => {
    const cityName =
      (club.city_id
        ? cities.find((c) => c.id === club.city_id)?.name
        : club.city) || "";
    const query = searchQuery.toLowerCase();
    const matchesArchiveFilter = showArchived || club.is_active !== false;
    const matchesSearch =
      club.name.toLowerCase().includes(query) ||
      cityName.toLowerCase().includes(query);

    return matchesArchiveFilter && matchesSearch;
  });

  const getClubDependencies = (club: Club): LifecycleDependency[] => [
    {
      label: "equipment",
      count: equipmentList.filter((equipment) => equipment.club_id === club.id || equipment.clubId === club.id).length,
    },
    {
      label: "faults",
      count: tasks.filter((task) => task.clubId === club.id || task.club_id === club.id).length,
    },
    {
      label: "orders",
      count: orders.filter((order) => order.clubId === club.id || order.club_id === club.id).length,
    },
    {
      label: "periodic templates",
      count: periodicTemplates.filter(
        (template) =>
          template.club_id === club.id ||
          template.clubId === club.id ||
          template.applies_to?.includes?.(club.id),
      ).length,
    },
    {
      label: "users",
      count: users.filter(
        (user) =>
          user.assigned_clubs?.includes(club.id) ||
          user.assignedClubIds?.includes(club.id),
      ).length,
    },
  ];

  const archiveClub = (clubId: string, isActive: boolean) =>
    setClubs(
      clubs.map((club) =>
        club.id === clubId ? { ...club, is_active: isActive } : club,
      ),
    );

  const deleteClub = (club: Club) => {
    const dependencies = getClubDependencies(club);
    if (dependencies.some((dependency) => dependency.count > 0)) {
      alert(formatDependencyBlockMessage(dependencies));
      return;
    }

    setClubs(clubs.filter((item) => item.id !== club.id));
  };

  const handleSave = () => {
    const trimmedId = (editing.id || "").trim().toLowerCase();

    if (!trimmedId) {
      alert("ID yra privalomas");
      return;
    }

    const isEditing = clubs.some((c) => c.id === editing.originalId);

    if (isEditing) {
      // Check if trying to change ID to an existing one
      if (
        trimmedId !== editing.originalId &&
        clubs.some((c) => c.id === trimmedId)
      ) {
        alert("Šis ID jau naudojamas");
        return;
      }
      const existingClub = clubs.find(c => c.id === editing.originalId);
      setClubs(
        clubs.map((c) =>
          c.id === editing.originalId
            ? ({ ...c, ...editing, id: trimmedId } as Club)
            : c,
        ),
      );

      createAuditLogEntry({
        moduleId: "clubs",
        moduleName: "Padaliniai",
        entityType: "CLUB",
        entityId: trimmedId,
        entityTitle: editing.name || existingClub?.name || "Neįvardintas padalinys",
        actionType: "UPDATED",
        changeDescription: `Redaguotas padalinys: ${editing.name}`,
        locationLabel: "Sistemos administravimas > Padaliniai",
        canRestore: true,
        oldValue: existingClub,
        newValue: { ...existingClub, ...editing, id: trimmedId },
        snapshotBefore: existingClub,
        snapshotAfter: { ...existingClub, ...editing, id: trimmedId }
      });
    } else {
      // Check for uniqueness on creation
      if (clubs.some((c) => c.id === trimmedId)) {
        alert("Šis ID jau naudojamas");
        return;
      }
      const newClub = {
        ...editing,
        id: trimmedId,
        name: editing.name || "",
        city: editing.city || "",
        region: editing.region || editing.city || "",
        is_active: editing.is_active !== false,
      } as Club;
      setClubs([
        ...clubs,
        newClub,
      ]);

      createAuditLogEntry({
        moduleId: "clubs",
        moduleName: "Padaliniai",
        entityType: "CLUB",
        entityId: trimmedId,
        entityTitle: newClub.name,
        actionType: "CREATED",
        changeDescription: `Sukurtas naujas padalinys: ${newClub.name}`,
        locationLabel: "Sistemos administravimas > Padaliniai",
        canRestore: false
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Padaliniai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti padalinio..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Rodyti archyvuotus
          </label>
        </div>
        <button
          onClick={() => {
            setEditing({ is_active: true });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti padalinį
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Miestas</th>
              <th className="pb-3 font-medium">Periodiniai šablonai</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredClubs.length > 0 ? (
              filteredClubs.map((club) => {
                const clubTemplates = periodicTemplates.filter(
                  (t) => t.club_id === club.id,
                );
                return (
                  <tr
                    key={club.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-4 font-semibold">{club.name}</td>
                    <td className="py-4 text-slate-500">
                      {club.city_id && cities.find((c) => c.id === club.city_id)
                        ? cities.find((c) => c.id === club.city_id)?.name
                        : club.city}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {clubTemplates.length} Šablonai
                        </span>
                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Ar norite sukurti bazines periodines užduotis klubui ${club.name}?`,
                              )
                            ) {
                              const standardTemplates = periodicTemplates.filter(
                                (t) =>
                                  t.club_id === "global" || t.club_id === null,
                              );
                              const newTemplates = standardTemplates.map((t) => ({
                                ...t,
                                id: generateUniqueId("pt"),
                                club_id: club.id,
                                club_name: club.name,
                              }));
                              setPeriodicTemplates([
                                ...periodicTemplates,
                                ...newTemplates,
                              ]);
                              alert(`Sukurta ${newTemplates.length} šablonų.`);
                            }
                          }}
                          className="p-1 px-2 border border-slate-200 rounded hover:bg-slate-100 text-[10px] font-bold text-slate-600 flex items-center gap-1"
                          title="Kopijuoti bazinius šablonus tam klubui"
                        >
                          <Copy size={12} /> Kopijuoti bazinius
                        </button>
                      </div>
                    </td>
                    <td className="py-4 flex justify-end gap-2">
                      {club.is_active !== false ? (
                        <>
                          <button
                            onClick={() => {
                              setEditing({ ...club, originalId: club.id });
                              setModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                            title="Redaguoti"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => archiveClub(club.id, false)}
                            className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                          >
                            Archyvuoti
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => archiveClub(club.id, true)}
                            className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => deleteClub(club)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                            title="Ištrinti"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredClubs.map((club) => {
          const clubTemplates = periodicTemplates.filter(
            (t) => t.club_id === club.id,
          );
          return (
            <div
              key={club.id}
              className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{club.name}</h3>
                  <p className="text-sm text-slate-500">
                    {club.city_id && cities.find((c) => c.id === club.city_id)
                      ? cities.find((c) => c.id === club.city_id)?.name
                      : club.city}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${club.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {club.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-slate-50">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  {clubTemplates.length} Šablonai
                </div>
                <button
                  onClick={() => {
                    const standardTemplates = periodicTemplates.filter(
                      (t) => t.club_id === "global" || t.club_id === null,
                    );
                    const newTemplates = standardTemplates.map((t) => ({
                      ...t,
                      id: generateUniqueId("pt"),
                      club_id: club.id,
                      club_name: club.name,
                    }));
                    setPeriodicTemplates([...periodicTemplates, ...newTemplates]);
                    alert(`Sukurta ${newTemplates.length} šablonų.`);
                  }}
                  className="text-[10px] font-bold text-blue-600 flex items-center gap-1"
                >
                  <Copy size={12} /> Kopijuoti bazinius
                </button>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-50">
                {club.is_active !== false ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing({ ...club, originalId: club.id });
                        setModalOpen(true);
                      }}
                      className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                    >
                      Redaguoti
                    </button>
                    <button
                      onClick={() => archiveClub(club.id, false)}
                      className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"
                    >
                      Archyvuoti
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => archiveClub(club.id, true)}
                      className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => deleteClub(club)}
                      className="flex-1 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filteredClubs.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.originalId ? "Redaguoti padalinį" : "Naujas padalinys"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID (Unikalus kodas)
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Miestas
            </label>
            {cities.filter((c) => c.is_active).length > 0 ? (
              <select
                value={editing.city_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, city_id: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              >
                <option value="">Pasirinkite miestą...</option>
                {cities
                  .filter((c) => c.is_active)
                  .map((c, index) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            ) : (
              <input
                value={editing.city || ""}
                onChange={(e) =>
                  setEditing({ ...editing, city: e.target.value })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Adresas
            </label>
            <input
              value={editing.address || ""}
              onChange={(e) =>
                setEditing({ ...editing, address: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Koordinatorius
            </label>
            <select
              value={editing.coordinator_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, coordinator_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Nepriskirtas</option>
              {users
                .filter((u) => u.is_active !== false)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function CitiesAdmin({
  cities,
  setCities,
  clubs,
}: {
  cities: City[];
  setCities: React.Dispatch<React.SetStateAction<City[]>>;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<City>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const filteredCities = cities.filter((city) => {
    const query = searchQuery.toLowerCase();
    return (
      (showArchived || city.is_active !== false) &&
      city.name.toLowerCase().includes(query)
    );
  });

  const getCityDependencies = (city: City): LifecycleDependency[] => [
    {
      label: "clubs",
      count: clubs.filter(
        (club) =>
          club.city_id === city.id ||
          club.city === city.name ||
          club.region === city.name,
      ).length,
    },
  ];

  const archiveCity = (cityId: string, isActive: boolean) =>
    setCities(
      cities.map((city) =>
        city.id === cityId ? { ...city, is_active: isActive } : city,
      ),
    );

  const deleteCity = (city: City) => {
    const dependencies = getCityDependencies(city);
    if (dependencies.some((dependency) => dependency.count > 0)) {
      alert(formatDependencyBlockMessage(dependencies));
      return;
    }

    setCities(cities.filter((item) => item.id !== city.id));
  };

  const handleSave = () => {
    if (editing.id) {
      const existingCity = cities.find((c) => c.id === editing.id);
      if (existingCity) {
        setCities(
          cities.map((c) =>
            c.id === editing.id ? ({ ...c, ...editing } as City) : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "cities",
          moduleName: "Miestai",
          entityType: "CITY",
          entityId: editing.id,
          entityTitle: editing.name || existingCity.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas miestas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Miestai",
          canRestore: true,
          oldValue: existingCity,
          newValue: { ...existingCity, ...editing },
          snapshotBefore: existingCity,
          snapshotAfter: { ...existingCity, ...editing }
        });
      } else {
        const newCity = {
          ...editing,
          id: editing.id || generateUniqueId("c"),
          name: editing.name || "",
          is_active: editing.is_active !== false,
        } as City;
        setCities([
          ...cities,
          newCity,
        ]);
        createAuditLogEntry({
          moduleId: "cities",
          moduleName: "Miestai",
          entityType: "CITY",
          entityId: newCity.id,
          entityTitle: newCity.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas miestas: ${newCity.name}`,
          locationLabel: "Sistemos administravimas > Miestai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Miestai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti miesto..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Rodyti archyvuotus
          </label>
        </div>
        <button
          onClick={() => {
            setEditing({ id: generateUniqueId("c"), is_active: true });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti miestą
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredCities.length > 0 ? (
              filteredCities.map((city, index) => (
                <tr
                  key={city.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{city.name}</td>
                  <td className="py-4 flex justify-end gap-2">
                    {city.is_active !== false ? (
                      <>
                        <button
                          onClick={() => {
                            setEditing(city);
                            setModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                          title="Redaguoti"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => archiveCity(city.id, false)}
                          className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                        >
                          Archyvuoti
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => archiveCity(city.id, true)}
                          className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => deleteCity(city)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                          title="Ištrinti"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={2}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredCities.map((city) => (
          <div
            key={city.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{city.name}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${city.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {city.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                </span>
              </div>
              <div className="flex gap-1">
                {city.is_active !== false ? (
                  <>
                    <button
                      onClick={() => {
                        setEditing(city);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => archiveCity(city.id, false)}
                      className="px-3 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold"
                    >
                      Archyvuoti
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => archiveCity(city.id, true)}
                      className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => deleteCity(city)}
                      className="px-3 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredCities.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.id && cities.find((c) => c.id === editing.id)
            ? "Redaguoti miestą"
            : "Naujas miestas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID (Unikalus kodas)
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              disabled={!!cities.find((c) => c.id === editing.id)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
            disabled={!editing.name || !editing.id}
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function UsersAdmin({
  users,
  setUsers,
  clubs,
  permissionRoles,
  permissionsConfig,
  tasks,
  periodicTemplates,
}: {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  clubs: Club[];
  permissionRoles: PermissionRole[];
  permissionsConfig: PermissionPreviewConfig;
  tasks: any[];
  periodicTemplates: any[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<User>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [permissionsUser, setPermissionsUser] = useState<User | null>(null);

  const ROLES = [
    "SUPER_ADMIN",
    "ADMIN",
    "OPS",
    "COORDINATOR",
    "CS",
    "ACCOUNTING",
    "EXTERNAL",
  ];

  const isPendingAccessUser = (user: User) =>
    user.id.startsWith("pending-") && user.is_active === false;
  // Preview-only additive role resolver. Enforcement not enabled yet.
  const getPreview = (user: Partial<User>) =>
    resolveEffectivePermissionPreview(user, permissionsConfig);
  const getAssignedRoleIds = (user: Partial<User>) =>
    resolveUserAssignedRoles(user, permissionRoles).map((role) => role.id);
  const getAssignedPermissionRoles = (user: Partial<User>) =>
    resolveUserAssignedRoles(user, permissionRoles);
  const getRoleIdByName = (roleName?: string) =>
    resolveUserAssignedRoles({ role: roleName as User["role"] }, permissionRoles)[0]
      ?.id;
  const toggleAssignedRole = (roleId: string) => {
    if (isSystemOwnerUser(editing as User)) return;

    const currentRoleIds = getAssignedRoleIds(editing);
    const nextRoleIds = currentRoleIds.includes(roleId)
      ? currentRoleIds.filter((id) => id !== roleId)
      : [...currentRoleIds, roleId];

    setEditing({ ...editing, assignedRoleIds: nextRoleIds });
  };
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const assignedRoleText = getAssignedPermissionRoles(user)
      .map((role) => role.name)
      .join(" ")
      .toLowerCase();
    const matchesArchiveFilter = showArchived || user.is_active !== false;
    const matchesSearch =
      user.name.toLowerCase().includes(query) ||
      (user.email || "").toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query) ||
      assignedRoleText.includes(query);

    return matchesArchiveFilter && matchesSearch;
  });

  const getUserDependencies = (user: User): LifecycleDependency[] => [
    {
      label: "assignments",
      count: tasks.filter((task) => hasMatchingAssignee(task, user)).length,
    },
    {
      label: "periodic tasks",
      count: periodicTemplates.filter((template) => hasMatchingAssignee(template, user)).length,
    },
  ];

  const archiveUser = (userId: string, isActive: boolean) => {
    const user = users.find((candidate) => candidate.id === userId);
    if (isSystemOwnerUser(user)) {
      alert("Negalima pašalinti sistemos savininko.");
      return;
    }

    setUsers(
      users.map((user) =>
        user.id === userId ? { ...user, is_active: isActive } : user,
      ),
    );
  };

  const deleteUser = (user: User) => {
    if (isSystemOwnerUser(user)) {
      alert("Negalima pašalinti sistemos savininko.");
      return;
    }

    const dependencies = getUserDependencies(user);
    if (dependencies.some((dependency) => dependency.count > 0)) {
      alert(formatDependencyBlockMessage(dependencies));
      return;
    }

    setUsers(users.filter((item) => item.id !== user.id));
  };

  const handleSave = () => {
    const normalizedEmail = editing.email?.trim().toLowerCase();

    if (!editing.name?.trim()) {
      alert("Vardas yra privalomas");
      return;
    }

    if (!normalizedEmail) {
      alert("El. paštas yra privalomas");
      return;
    }

    const normalizedRole = (editing.role || "OPS").toUpperCase() as User["role"];
    const assignedRoleIds = getAssignedRoleIds({
      ...editing,
      role: normalizedRole,
    });
    const assignedClubIds = editing.assigned_clubs || editing.assignedClubIds || [];
    const assignedRegionIds =
      editing.region ? (editing.region === "ALL" ? ["ALL"] : [editing.region]) : editing.assignedRegionIds || ["ALL"];
    const duplicateEmail = users.find(
      (user) =>
        user.id !== editing.id &&
        (user.email || "").trim().toLowerCase() === normalizedEmail,
    );

    if (duplicateEmail) {
      alert("Šis el. paštas jau naudojamas");
      return;
    }

    if (editing.id) {
      const existingUser = users.find((c) => c.id === editing.id);
      if (existingUser) {
        const nextUser = isSystemOwnerUser(existingUser)
          ? enforceSystemOwnerUser({
              ...existingUser,
              ...editing,
              email: normalizedEmail,
            } as User)
          : ({
              ...existingUser,
              ...editing,
              email: normalizedEmail,
              role: normalizedRole,
              assignedRoleIds,
              assignedRegionIds,
              assignedClubIds,
              assigned_clubs: assignedClubIds,
            } as User);

        setUsers(
          users.map((c) =>
            c.id === editing.id ? nextUser : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "users",
          moduleName: "Vartotojai",
          entityType: "USER",
          entityId: editing.id,
          entityTitle: editing.name || existingUser.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas vartotojas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Vartotojai",
          canRestore: true,
          oldValue: existingUser,
          newValue: nextUser,
          snapshotBefore: existingUser,
          snapshotAfter: nextUser
        });
      } else {
        const newUser = {
          ...editing,
          id: editing.id || generateUniqueId("u"),
          name: editing.name.trim(),
          email: normalizedEmail,
          role: normalizedRole,
          assignedRoleIds,
          assignedRegionIds,
          assignedClubIds,
          is_active: editing.is_active !== false,
          assigned_clubs: assignedClubIds,
        } as User;
        setUsers([
          ...users,
          newUser,
        ]);
        createAuditLogEntry({
          moduleId: "users",
          moduleName: "Vartotojai",
          entityType: "USER",
          entityId: newUser.id,
          entityTitle: newUser.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas vartotojas: ${newUser.name}`,
          locationLabel: "Sistemos administravimas > Vartotojai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  const handleToggleClub = (clubId: string) => {
    const current = editing.assigned_clubs || [];
    if (current.includes(clubId)) {
      setEditing({
        ...editing,
        assigned_clubs: current.filter((id) => id !== clubId),
      });
    } else {
      setEditing({ ...editing, assigned_clubs: [...current, clubId] });
    }
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Vartotojai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti vartotojo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Rodyti archyvuotus
          </label>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              is_active: true,
              role: "OPS",
              assignedRoleIds: getRoleIdByName("OPS")
                ? [getRoleIdByName("OPS") as string]
                : [],
              assigned_clubs: [],
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti vartotoją
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Vardas</th>
              <th className="pb-3 font-medium">El. paštas</th>
              <th className="pb-3 font-medium">Priskirtos rolės</th>
              <th className="pb-3 font-medium">Regionai / Klubai</th>
              <th className="pb-3 font-medium">Statusas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">
                    <div className="flex flex-col gap-1">
                      <span>{user.name}</span>
                      {isSystemOwnerUser(user) && (
                        <span className="w-fit rounded-full bg-black px-2 py-0.5 text-[9px] font-black uppercase text-white">
                          Sistemos savininkas
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-xs text-slate-500">{user.email}</td>
                  <td className="py-4">
                    <div className="flex max-w-[220px] flex-wrap gap-1.5">
                      {getAssignedPermissionRoles(user).length ? (
                        getAssignedPermissionRoles(user).map((role) => (
                          <span
                            key={role.id}
                            className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600"
                          >
                            {role.name}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600">
                          {user.role}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 text-xs text-slate-500 max-w-[200px] truncate">
                    {user.assigned_clubs?.length
                      ? user.assigned_clubs
                          .map(
                            (cid) => clubs.find((c) => c.id === cid)?.name || cid,
                          )
                          .join(", ")
                      : "-"}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                        user.is_active !== false
                          ? "bg-emerald-50 text-emerald-700"
                          : isPendingAccessUser(user)
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {user.is_active !== false
                        ? "Aktyvus"
                        : isPendingAccessUser(user)
                          ? "Laukia patvirtinimo"
                          : "Neaktyvus"}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    {user.is_active !== false ? (
                      <>
                        <button
                          onClick={() => setPermissionsUser(user)}
                          className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                          title="Valdyti teises"
                        >
                          <ShieldCheck size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setEditing(user);
                            setModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                          title="Redaguoti"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => archiveUser(user.id, false)}
                          disabled={isSystemOwnerUser(user)}
                          className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                          title={
                            isSystemOwnerUser(user)
                              ? "Negalima pašalinti sistemos savininko."
                              : "Archyvuoti"
                          }
                        >
                          Archyvuoti
                        </button>
                        {isSystemOwnerUser(user) && (
                          <button
                            type="button"
                            disabled
                            className="p-2 text-rose-500 bg-rose-50 rounded-lg cursor-not-allowed opacity-50"
                            title="Negalima pašalinti sistemos savininko."
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => archiveUser(user.id, true)}
                          className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => deleteUser(user)}
                          disabled={isSystemOwnerUser(user)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
                          title="Ištrinti"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{user.name}</h3>
                {isSystemOwnerUser(user) && (
                  <span className="mt-1 inline-block rounded-full bg-black px-2 py-0.5 text-[9px] font-black uppercase text-white">
                    Sistemos savininkas
                  </span>
                )}
                <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {getAssignedPermissionRoles(user).length ? (
                    getAssignedPermissionRoles(user).map((role) => (
                      <span
                        key={role.id}
                        className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600"
                      >
                        {role.name}
                      </span>
                    ))
                  ) : (
                    <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                      {user.role}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                  user.is_active !== false
                    ? "bg-emerald-50 text-emerald-700"
                    : isPendingAccessUser(user)
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                }`}
              >
                {user.is_active !== false
                  ? "Aktyvus"
                  : isPendingAccessUser(user)
                    ? "Laukia patvirtinimo"
                    : "Neaktyvus"}
              </span>
            </div>

            <div className="text-xs text-slate-500">
              <span className="font-bold text-slate-400 uppercase mr-1">
                Regionai / Klubai:
              </span>
              {user.assigned_clubs?.length
                ? user.assigned_clubs
                    .map((cid) => clubs.find((c) => c.id === cid)?.name || cid)
                    .join(", ")
                : "-"}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
              {user.is_active !== false ? (
                <>
                  <button
                    onClick={() => setPermissionsUser(user)}
                    className="px-3 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                    title="Valdyti teises"
                  >
                    <ShieldCheck size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditing(user);
                      setModalOpen(true);
                    }}
                    className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                  >
                    Redaguoti
                  </button>
                  <button
                    onClick={() => archiveUser(user.id, false)}
                    disabled={isSystemOwnerUser(user)}
                    className="flex-1 py-2 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Archyvuoti
                  </button>
                  {isSystemOwnerUser(user) && (
                    <button
                      type="button"
                      disabled
                      className="px-3 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold cursor-not-allowed opacity-50"
                      title="Negalima pašalinti sistemos savininko."
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={() => archiveUser(user.id, true)}
                    className="flex-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => deleteUser(user)}
                    disabled={isSystemOwnerUser(user)}
                    className="flex-1 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.id && users.find((u) => u.id === editing.id)
            ? "Redaguoti vartotoją"
            : "Naujas vartotojas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              ID
            </label>
            <input
              value={editing.id || ""}
              onChange={(e) => setEditing({ ...editing, id: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
              disabled={!!users.find((u) => u.id === editing.id)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Vardas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              El. paštas
            </label>
            <input
              type="email"
              value={editing.email || ""}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="vardas@sportgates.lt"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pagrindinė rolė (legacy)
            </label>
            <select
              value={editing.role || "OPS"}
              disabled={isSystemOwnerUser(editing as User)}
              onChange={(e) => {
                const nextRole = e.target.value as User["role"];
                const nextRoleId = getRoleIdByName(nextRole);
                const currentAssignedRoleIds = getAssignedRoleIds(editing);
                setEditing({
                  ...editing,
                  role: nextRole,
                  assignedRoleIds:
                    nextRoleId && !currentAssignedRoleIds.includes(nextRoleId)
                      ? [...currentAssignedRoleIds, nextRoleId]
                      : currentAssignedRoleIds,
                });
              }}
              className="w-full p-2 border border-slate-200 rounded-lg disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            >
              {isSystemOwnerUser(editing as User) && (
                <option value="SYSTEM_OWNER">SYSTEM_OWNER</option>
              )}
              {ROLES.map((r, index) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Priskirtos rolės
            </label>
            <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {permissionRoles.map((role) => (
                <label
                  key={role.id}
                  className={cn(
                    "flex items-start gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer",
                    isSystemOwnerUser(editing as User) && "cursor-not-allowed opacity-60",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={
                      isSystemOwnerUser(editing as User) && role.id === SUPER_ADMIN_ROLE_ID
                        ? true
                        : getAssignedRoleIds(editing).includes(role.id)
                    }
                    disabled={isSystemOwnerUser(editing as User)}
                    onChange={() => toggleAssignedRole(role.id)}
                    className="mt-0.5 w-4 h-4 text-brand-lime rounded border-slate-300"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-700">
                      {role.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {role.description || "No description"}
                    </span>
                  </span>
                </label>
              ))}
              {permissionRoles.length === 0 && (
                <span className="text-xs text-slate-400 p-2">
                  Roles & Permissions source has no roles yet.
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Priskirti klubai
            </label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
              {clubs.map((club, index) => (
                <label
                  key={`${club.id}-${index}`}
                  className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={(editing.assigned_clubs || []).includes(club.id)}
                    onChange={() => handleToggleClub(club.id)}
                    className="w-4 h-4 text-brand-lime rounded border-slate-300"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {club.name}
                  </span>
                </label>
              ))}
              {clubs.length === 0 && (
                <span className="text-xs text-slate-400 p-2">Klubų nėra.</span>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-bold text-slate-900">
              Effective access preview
            </h4>
            <div className="mt-3 grid gap-3 text-xs text-slate-600 md:grid-cols-2">
              <div>
                <p className="font-bold uppercase text-slate-400">
                  Assigned Roles
                </p>
                <p className="mt-1">
                  {getAssignedPermissionRoles(editing)
                    .map((role) => role.name)
                    .join(", ") || "-"}
                </p>
              </div>
              <div>
                <p className="font-bold uppercase text-slate-400">
                  Regionai / Klubai
                </p>
                <p className="mt-1">{getPreview(editing).scopeLabel}</p>
              </div>
            </div>
            <p className="mt-3 text-xs font-medium text-slate-400">
              Permissions enforcement coming later.
            </p>
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
            disabled={!editing.name || !editing.id}
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
      <AdminModal
        title="Valdyti teises"
        isOpen={Boolean(permissionsUser)}
        onClose={() => setPermissionsUser(null)}
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-bold text-slate-900">
              {permissionsUser?.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Permissions management placeholder. Full implementation later.
            </p>
          </div>
          <button
            onClick={() => setPermissionsUser(null)}
            className="w-full py-3 bg-slate-950 text-white rounded-xl font-bold"
          >
            Uždaryti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function FacilityTemplatesAdmin({
  templates,
  setTemplates,
  clubs,
}: {
  templates: any[];
  setTemplates: any;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter((t) => {
    const clubName =
      t.club_id === null
        ? "Visi (Globalus)"
        : clubs.find((c) => c.id === t.club_id)?.name || t.club_id;
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      clubName.toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    if (editing.id) {
      const existing = templates.find((c) => c.id === editing.id);
      if (existing) {
        setTemplates(
          templates.map((c: any) =>
            c.id === editing.id ? { ...c, ...editing } : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "facility",
          moduleName: "Patalpų darbai",
          entityType: "FACILITY_TEMPLATE",
          entityId: editing.id,
          entityTitle: editing.name || existing.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas patalpų darbo šablonas: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Patalpų darbai",
          canRestore: true,
          oldValue: existing,
          newValue: { ...existing, ...editing },
          snapshotBefore: existing,
          snapshotAfter: { ...existing, ...editing }
        });
      } else {
        const newTemp = { ...editing, id: editing.id || generateUniqueId("ft") };
        setTemplates([
          ...templates,
          newTemp,
        ]);
        createAuditLogEntry({
          moduleId: "facility",
          moduleName: "Patalpų darbai",
          entityType: "FACILITY_TEMPLATE",
          entityId: newTemp.id,
          entityTitle: newTemp.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas patalpų darbo šablonas: ${newTemp.name}`,
          locationLabel: "Sistemos administravimas > Patalpų darbai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Patalpų darbai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti darbo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              priority: "medium",
              sla_hours: 24,
              club_id: null,
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
        >
          <Plus size={16} /> Pridėti
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((t, index) => (
                <tr
                  key={t.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{t.name}</td>
                  <td className="py-4 text-slate-600">
                    {t.club_id === null
                      ? "Visi (Globalus)"
                      : clubs.find((c) => c.id === t.club_id)?.name || t.club_id}
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(t);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() =>
                        setTemplates(templates.filter((x: any) => x.id !== t.id))
                      }
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={3}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredTemplates.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{t.name}</h4>
                <p className="text-[10px] text-slate-400 uppercase mt-0.5">
                  {t.club_id === null
                    ? "Visi (Globalus)"
                    : clubs.find((c) => c.id === t.club_id)?.name || t.club_id}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(t);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() =>
                    setTemplates(templates.filter((x: any) => x.id !== t.id))
                  }
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti" : "Naujas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value || null })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Visi (Globalus)</option>
              {clubs
                .filter((c) => c.is_active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              SOP nuoroda
            </label>
            <input
              value={editing.sop_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, sop_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Trumpas SOP aprašymas (neprivaloma)
            </label>
            <input
              value={editing.sop_description || ""}
              onChange={(e) =>
                setEditing({ ...editing, sop_description: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function EquipmentAdmin({
  equipmentList,
  setEquipmentList,
  clubs,
}: {
  equipmentList: any[];
  setEquipmentList: any;
  clubs: Club[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [csvError, setCsvError] = useState("");
  const [importStats, setImportStats] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQrUrl, setSelectedQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const filteredEquipmentList = equipmentList.filter((eq) => {
    const query = searchQuery.toLowerCase();
    return (
      eq.name.toLowerCase().includes(query) ||
      eq.number.toLowerCase().includes(query) ||
      (eq.zone || "").toLowerCase().includes(query)
    );
  });

  const handleSave = () => {
    if (!editing.club_id) {
      setError("Būtina pasirinkti klubą");
      return;
    }
    // duplicate number check
    const dup = equipmentList.find(
      (e: any) =>
        e.club_id === editing.club_id &&
        e.number === editing.number &&
        e.id !== editing.id,
    );
    if (dup) {
      setError(
        `Klaida: numeris ${editing.number} jau egzistuoja pasirinktame klube.`,
      );
      return;
    }

    if (editing.id) {
      const existing = equipmentList.find((c) => c.id === editing.id);
      if (existing) {
        setEquipmentList(
          equipmentList.map((c: any) =>
            c.id === editing.id
              ? { ...c, ...editing, is_active: editing.is_active !== false }
              : c,
          ),
        );
        createAuditLogEntry({
          moduleId: "equipment",
          moduleName: "Treniruokliai",
          entityType: "EQUIPMENT",
          entityId: editing.id,
          entityTitle: editing.name || existing.name,
          actionType: "UPDATED",
          changeDescription: `Redaguotas treniruoklis: ${editing.name}`,
          locationLabel: "Sistemos administravimas > Treniruokliai",
          canRestore: true,
          oldValue: existing,
          newValue: { ...existing, ...editing, is_active: editing.is_active !== false },
          snapshotBefore: existing,
          snapshotAfter: { ...existing, ...editing, is_active: editing.is_active !== false }
        });
      } else {
        const newEq = {
          ...editing,
          id: editing.id || generateUniqueId("eq"),
          is_active: editing.is_active !== false,
        };
        setEquipmentList([
          ...equipmentList,
          newEq,
        ]);
        createAuditLogEntry({
          moduleId: "equipment",
          moduleName: "Treniruokliai",
          entityType: "EQUIPMENT",
          entityId: newEq.id,
          entityTitle: newEq.name,
          actionType: "CREATED",
          changeDescription: `Sukurtas naujas treniruoklis: ${newEq.name}`,
          locationLabel: "Sistemos administravimas > Treniruokliai",
          canRestore: false
        });
      }
    }
    setModalOpen(false);
    setError("");
  };

  const handleCsvImport = () => {
    setCsvError("");
    setImportStats(null);
    if (!csvData.trim()) {
      setCsvError("Pridėkite CSV duomenis");
      return;
    }

    const rows = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;

    // We will accumulate updates into a new array to preserve existing
    const newEquipmentList = [...equipmentList];

    for (const row of rows) {
      const parts = row.split(",").map((p) => p.trim());
      if (parts.length < 3) {
        skipped++;
        continue;
      }

      const club_name = parts[0];
      const number = parts[1];
      const name = parts[2];
      const zone = parts[3] || "";
      const qr_url = parts[4] || "";

      const club = clubs.find(
        (c) => c.name.toLowerCase() === club_name.toLowerCase(),
      );
      if (!club) {
        skipped++;
        continue;
      }

      const existingIndex = newEquipmentList.findIndex(
        (e) => e.club_id === club.id && e.number === number,
      );
      if (existingIndex >= 0) {
        newEquipmentList[existingIndex] = {
          ...newEquipmentList[existingIndex],
          name: name,
          zone: zone,
          qr_url: qr_url || newEquipmentList[existingIndex].qr_url,
          is_active: true,
        };
        updated++;
      } else {
        newEquipmentList.push({
          id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          club_id: club.id,
          number: number,
          name: name,
          zone: zone,
          qr_url: qr_url,
          is_active: true,
        });
        created++;
      }
    }

    setEquipmentList(newEquipmentList);
    setImportStats({
      total: rows.length,
      created,
      updated,
      skipped,
    });
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Treniruokliai</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti treniruoklio (pavadinimas / nr.)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setCsvData("");
              setCsvError("");
              setImportStats(null);
              setCsvModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold hover:bg-slate-200 text-sm"
          >
            Importuoti CSV
          </button>
          <button
            onClick={() => {
              setEditing({
                id: Date.now().toString(),
                club_id: clubs[0]?.id || "",
                is_active: true,
              });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl font-bold hover:bg-slate-800 text-sm"
          >
            <Plus size={16} /> Pridėti
          </button>
        </div>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Foto</th>
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium">Numeris</th>
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Zona</th>
              <th className="pb-3 font-medium text-center">QR</th>
              <th className="pb-3 font-medium">Statusas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipmentList.length > 0 ? (
              filteredEquipmentList.map((eq, index) => (
                <tr
                  key={eq.id}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4">
                    {eq.image_url ? (
                      <img
                        src={eq.image_url}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase" >
                        EQ
                      </div>
                    )}
                  </td>
                  <td className="py-4 text-slate-600">
                    {clubs.find((c) => c.id === eq.club_id)?.name || eq.club_id}
                  </td>
                  <td className="py-4 font-bold text-black">{eq.number}</td>
                  <td className="py-4 font-semibold">{eq.name}</td>
                  <td className="py-4 text-slate-500">{eq.zone}</td>
                  <td className="py-4 text-center">
                    {eq.qr_url ? (
                      <button
                        onClick={() => {
                          setSelectedQrUrl(eq.qr_url);
                          setQrModalOpen(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Tikrumo QR"
                      >
                        <QrCode size={18} />
                      </button>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-bold uppercase ${eq.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {eq.is_active !== false ? "Aktyvus" : "Neaktyvus"}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(eq);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <AdminActiveSwitch
                      active={eq.is_active !== false}
                      onClick={() =>
                        setEquipmentList(
                          equipmentList.map((x: any) =>
                            x.id === eq.id
                              ? {
                                  ...x,
                                  is_active: x.is_active === false ? true : false,
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {filteredEquipmentList.map((eq) => (
          <div
            key={eq.id}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                {eq.image_url ? (
                  <img
                    src={eq.image_url}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-[10px] uppercase">
                    EQ
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-slate-900 leading-tight">
                    {eq.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No. {eq.number} • {eq.zone}
                  </p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${eq.is_active !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
                {eq.is_active !== false ? "Aktyvus" : "Neaktyvus"}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-slate-50 text-xs">
              <span className="text-slate-500 italic">
                {clubs.find((c) => c.id === eq.club_id)?.name || eq.club_id}
              </span>
              {eq.qr_url && (
                <button
                  onClick={() => {
                    setSelectedQrUrl(eq.qr_url);
                    setQrModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 text-blue-600 font-bold"
                >
                  <QrCode size={16} /> QR Kodas
                </button>
              )}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-50">
              <button
                onClick={() => {
                  setEditing(eq);
                  setModalOpen(true);
                }}
                className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
              >
                Redaguoti
              </button>
              <AdminActiveSwitch
                active={eq.is_active !== false}
                onClick={() =>
                  setEquipmentList(
                    equipmentList.map((x: any) =>
                      x.id === eq.id
                        ? { ...x, is_active: x.is_active === false ? true : false }
                        : x,
                    ),
                  )
                }
              />
            </div>
          </div>
        ))}
        {filteredEquipmentList.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti treniruoklį" : "Naujas treniruoklis"}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setError("");
        }}
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-center">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="" disabled>
                Pasirinkite klubą
              </option>
              {clubs
                .filter((c) => c.is_active !== false)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Numeris
            </label>
            <input
              value={editing.number || ""}
              onChange={(e) =>
                setEditing({ ...editing, number: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="Pvz. T-01"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Zona
            </label>
            <input
              value={editing.zone || ""}
              onChange={(e) => setEditing({ ...editing, zone: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Nuotraukos URL
            </label>
            <input
              value={editing.image_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, image_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              QR nuoroda
            </label>
            <input
              value={editing.qr_url || ""}
              onChange={(e) =>
                setEditing({ ...editing, qr_url: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
              placeholder="Įklijuokite QR URL (Pvz. http...)"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>

      <AdminModal
        title="Importuoti CSV"
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      >
        <div className="space-y-4">
          {!importStats ? (
            <>
              <div className="text-sm text-slate-600">
                Įklijuokite CSV duomenis. Stulpeliai:{" "}
                <strong>club_name, number, name, zone, qr_url</strong>
                <br />
                <br />
                <span className="text-xs text-slate-400">
                  Pvz:
                  <br />
                  SG Akropolis, BT-01, Bėgimo takelis, Kardio,
                  https://example.com/report?id=123
                </span>
              </div>
              {csvError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2 items-center">
                  <AlertCircle size={16} />
                  {csvError}
                </div>
              )}
              <textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="SG Akropolis, BT-01, Bėgimo takelis, Kardio..."
                className="w-full p-3 border border-slate-200 rounded-lg min-h-[200px] text-sm font-mono whitespace-nowrap overflow-x-auto"
              />
              <button
                onClick={handleCsvImport}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
              >
                Pradėti importavimą
              </button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <h3 className="font-bold text-xl text-slate-800">
                Importavimas baigtas
              </h3>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="text-xs text-slate-500 uppercase font-bold">
                    Viso eilučių
                  </div>
                  <div className="text-xl font-black text-slate-800">
                    {importStats.total}
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="text-xs text-blue-500 uppercase font-bold">
                    Sukurta naujų
                  </div>
                  <div className="text-xl font-black text-blue-700">
                    {importStats.created}
                  </div>
                </div>
                <div className="p-3 bg-green-50 border border-green-100 rounded-lg">
                  <div className="text-xs text-green-500 uppercase font-bold">
                    Atnaujinta
                  </div>
                  <div className="text-xl font-black text-green-700">
                    {importStats.updated}
                  </div>
                </div>
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                  <div className="text-xs text-red-500 uppercase font-bold">
                    Praleista
                  </div>
                  <div className="text-xl font-black text-red-700">
                    {importStats.skipped}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCsvModalOpen(false)}
                className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold mt-4"
              >
                Uždaryti
              </button>
            </div>
          )}
        </div>
      </AdminModal>

      <AdminModal
        title="Treniruoklio QR"
        isOpen={qrModalOpen}
        onClose={() => {
          setQrModalOpen(false);
          setCopied(false);
        }}
      >
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm">
            <QrCode size={120} className="text-slate-800" />
          </div>
          <div className="w-full space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase">
              QR URL
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                value={selectedQrUrl}
                className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-600 truncate"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedQrUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`p-3 rounded-xl transition-all ${copied ? "bg-green-500 text-white" : "bg-slate-800 text-white hover:bg-slate-700"}`}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          <div className="w-full pt-2">
            <button
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
              onClick={() => {
                const link = document.createElement("a");
                link.href = "#";
                link.download = "qr_code.png";
                link.click();
              }}
            >
              Atsisiųsti QR nuotrauką
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}

function EquipmentIssuesAdmin({
  assetTypes,
  issueTypes,
  setIssueTypes,
}: {
  assetTypes: AssetType[];
  issueTypes: AssetIssueType[];
  setIssueTypes: React.Dispatch<React.SetStateAction<AssetIssueType[]>>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const equipmentAssetTypeId =
    assetTypes.find((assetType) => assetType.code === "EQUIPMENT")?.id ||
    "asset-type-equipment";
  const facilityAssetTypeId =
    assetTypes.find((assetType) => assetType.code === "FACILITY")?.id ||
    "asset-type-facility";
  const issues = useMemo(() => getLegacyIssueTypes(issueTypes), [issueTypes]);

  const filteredIssues = issues.filter((iss) =>
    iss.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSave = () => {
    if (!editing.id || !editing.name?.trim()) return;

    const targetAssetTypeIds =
      editing.applies_to === "EQUIPMENT"
        ? [equipmentAssetTypeId]
        : editing.applies_to === "FACILITY"
          ? [facilityAssetTypeId]
          : [equipmentAssetTypeId, facilityAssetTypeId];
    const existingByAssetType = new Map(
      issueTypes
        .filter((issueType) => issueType.legacyId === editing.id)
        .map((issueType) => [issueType.assetTypeId, issueType]),
    );
    const code =
      editing.name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_|_$/g, "") || editing.id.toUpperCase();
    const nextIssueTypes = [
      ...issueTypes.filter(
        (issueType) =>
          issueType.legacyId !== editing.id ||
          targetAssetTypeIds.includes(issueType.assetTypeId),
      ),
    ];

    targetAssetTypeIds.forEach((assetTypeId) => {
      const existing = existingByAssetType.get(assetTypeId);
      const nextIssueType: AssetIssueType = {
        ...(existing || {
          id: `asset-issue-${assetTypeId}-${editing.id}`,
          legacySource: "equipmentIssueTypesList" as const,
          legacyId: editing.id,
          active: true,
          isDefault: false,
        }),
        assetTypeId,
        code,
        name: editing.name.trim(),
        priority: editing.priority || "medium",
        slaHours: Number(editing.sla_hours) || 24,
      };
      const index = nextIssueTypes.findIndex(
        (issueType) => issueType.id === nextIssueType.id,
      );
      if (index >= 0) {
        nextIssueTypes[index] = nextIssueType;
      } else {
        nextIssueTypes.push(nextIssueType);
      }
    });

    setIssueTypes(nextIssueTypes);
    setModalOpen(false);
  };

  const handleDelete = (legacyId: string) => {
    setIssueTypes(
      issueTypes.filter((issueType) => issueType.legacyId !== legacyId),
    );
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
          <h2 className="text-xl font-bold">Gedimo tipas</h2>
          <div className="relative w-full md:w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Ieškoti gedimo tipo..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => {
            setEditing({
              id: Date.now().toString(),
              priority: "medium",
              sla_hours: 24,
            });
            setModalOpen(true);
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm"
        >
          <Plus size={16} /> Pridėti
        </button>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Pavadinimas</th>
              <th className="pb-3 font-medium">Taikoma</th>
              <th className="pb-3 font-medium">Prioritetas</th>
              <th className="pb-3 font-medium">SLA (Valandos)</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.length > 0 ? (
              filteredIssues.map((iss, index) => (
                <tr
                  key={`${iss.id}-${index}`}
                  className="border-b border-slate-100 hover:bg-slate-50"
                >
                  <td className="py-4 font-semibold">{iss.name}</td>
                  <td className="py-4 text-xs font-semibold text-slate-600">
                    {iss.applies_to === "FACILITY"
                      ? "Patalpoms"
                      : iss.applies_to === "EQUIPMENT"
                        ? "Treniruokliams"
                        : "Visiems"}
                  </td>
                  <td className="py-4 uppercase text-xs font-bold">
                    {iss.priority}
                  </td>
                  <td className="py-4">{iss.sla_hours}h</td>
                  <td className="py-4 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(iss);
                        setModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(iss.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 text-center text-slate-500 font-medium"
                >
                  Nerasta rezultatų
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {filteredIssues.map((iss, index) => (
          <div
            key={`${iss.id}-${index}`}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">{iss.name}</h4>
                <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                  Taikoma: {iss.applies_to === 'FACILITY' ? 'Patalpoms' : iss.applies_to === 'EQUIPMENT' ? 'Treniruokliams' : 'Visiems'}
                </p>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase">
                {iss.priority}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-50">
              <span className="text-slate-500">SLA: <span className="font-bold text-slate-800">{iss.sla_hours}h</span></span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing(iss);
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(iss.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredIssues.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
        )}
      </div>

      <AdminModal
        title={editing.name ? "Redaguoti tipą" : "Naujas tipas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Pavadinimas
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Taikoma
            </label>
            <select
              value={editing.applies_to || "BOTH"}
              onChange={(e) =>
                setEditing({ ...editing, applies_to: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="BOTH">
                Visiems (Patalpoms ir Treniruokliams)
              </option>
              <option value="FACILITY">Tik Patalpoms</option>
              <option value="EQUIPMENT">Tik Treniruokliams</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Prioritetas
            </label>
            <select
              value={editing.priority || "medium"}
              onChange={(e) =>
                setEditing({ ...editing, priority: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              SLA (Valandos)
            </label>
            <input
              type="number"
              value={editing.sla_hours || 0}
              onChange={(e) =>
                setEditing({ ...editing, sla_hours: Number(e.target.value) })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>
    </div>
  );
}

function InventorySettingsAdmin({
  settings,
  setSettings,
  clubs,
  products,
}: {
  settings: ClubInventorySetting[];
  setSettings: React.Dispatch<React.SetStateAction<ClubInventorySetting[]>>;
  clubs: Club[];
  products: Product[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editing, setEditing] = useState<
    Partial<ClubInventorySetting> & { index?: number }
  >({});
  const [csvText, setCsvText] = useState("");
  const [importStats, setImportStats] = useState<{
    total: number;
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const handleSave = () => {
    if (editing.club_id && editing.product_id) {
      const newSetting: ClubInventorySetting = {
        club_id: editing.club_id,
        product_id: editing.product_id,
        target_quantity: Number(editing.target_quantity) || 0,
        refill_quantity: Number(editing.refill_quantity) || 0,
        local_stock:
          editing.local_stock !== undefined
            ? Number(editing.local_stock)
            : undefined,
      };

      if (editing.index !== undefined) {
        const newList = [...settings];
        newList[editing.index] = newSetting;
        setSettings(newList);
      } else {
        setSettings([...settings, newSetting]);
      }
    }
    setModalOpen(false);
  };

  const handleImport = () => {
    if (!csvText) return;
    const rows = csvText.split("\n").filter((r) => r.trim());
    let created = 0,
      updated = 0,
      skipped = 0;
    const newSettings = [...settings];

    rows.forEach((row) => {
      const parts = row.split(",").map((p) => p.trim());
      if (parts.length < 4) {
        skipped++;
        return;
      }

      const [clubName, productName, targetQty, refillQty, localStock] = parts;
      const club = clubs.find(
        (c) => c.name.toLowerCase() === clubName.toLowerCase(),
      );
      const product = products.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );

      if (club && product) {
        const existingIndex = newSettings.findIndex(
          (s) => s.club_id === club.id && s.product_id === product.id,
        );
        const entry = {
          club_id: club.id,
          product_id: product.id,
          target_quantity: parseInt(targetQty) || 0,
          refill_quantity: parseInt(refillQty) || 0,
          local_stock: localStock ? parseInt(localStock) : undefined,
        };

        if (existingIndex > -1) {
          newSettings[existingIndex] = entry;
          updated++;
        } else {
          newSettings.push(entry);
          created++;
        }
      } else {
        skipped++;
      }
    });

    setSettings(newSettings);
    setImportStats({ total: rows.length, created, updated, skipped });
  };

  return (
    <div className="p-4 md:p-6 overflow-x-auto h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-xl font-bold">Inventoriaus nustatymai</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => {
              setImportStats(null);
              setCsvText("");
              setImportModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 text-sm"
          >
            Importuoti CSV
          </button>
          <button
            onClick={() => {
              setEditing({});
              setModalOpen(true);
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-sm"
          >
            <Plus size={16} /> Pridėti
          </button>
        </div>
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-sm">
              <th className="pb-3 font-medium">Klubas</th>
              <th className="pb-3 font-medium">Produktas</th>
              <th className="pb-3 font-medium text-center">Turi būti</th>
              <th className="pb-3 font-medium text-center">Vietinis sandėlis</th>
              <th className="pb-3 font-medium text-center">Papildymas</th>
              <th className="pb-3 font-medium text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s, idx) => (
              <tr
                key={`${s.club_id}-${s.product_id}`}
                className="border-b border-slate-100 hover:bg-slate-50"
              >
                <td className="py-4 font-semibold">
                  {clubs.find((c) => c.id === s.club_id)?.name}
                </td>
                <td className="py-4 text-slate-600">
                  {products.find((p) => p.id === s.product_id)?.name}
                </td>
                <td className="py-4 text-center font-bold text-blue-600">
                  {s.target_quantity}
                </td>
                <td className="py-4 text-center text-slate-500">
                  {s.local_stock !== undefined ? (
                    <span className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
                      <Check size={12} /> {s.local_stock}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="py-4 text-center text-slate-500">
                  {s.refill_quantity}
                </td>
                <td className="py-4 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditing({ ...s, index: idx });
                      setModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setSettings(settings.filter((_, i) => i !== idx))
                    }
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {settings.map((s, idx) => (
          <div
            key={`${s.club_id}-${s.product_id}`}
            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-slate-900">
                  {products.find((p) => p.id === s.product_id)?.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {clubs.find((c) => c.id === s.club_id)?.name}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditing({ ...s, index: idx });
                    setModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => setSettings(settings.filter((_, i) => i !== idx))}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Norma</p>
                <p className="font-black text-blue-600">{s.target_quantity}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Sandėlys</p>
                <p className="font-black text-emerald-600">{s.local_stock ?? '-'}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Papild.</p>
                <p className="font-black text-slate-800">{s.refill_quantity}</p>
              </div>
            </div>
          </div>
        ))}
        {settings.length === 0 && (
          <p className="py-8 text-center text-slate-400">Nerasta nustatymų</p>
        )}
      </div>

      <AdminModal
        title={
          editing.index !== undefined
            ? "Redaguoti nustatymą"
            : "Naujas nustatymas"
        }
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Klubas
            </label>
            <select
              value={editing.club_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, club_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Pasirinkite klubą...</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Produktas
            </label>
            <select
              value={editing.product_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, product_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              <option value="">Pasirinkite produktą...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Turi būti
              </label>
              <input
                type="number"
                value={editing.target_quantity || 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    target_quantity: Number(e.target.value),
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Papildymas
              </label>
              <input
                type="number"
                value={editing.refill_quantity || 0}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    refill_quantity: Number(e.target.value),
                  })
                }
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={cn(
                  "w-10 h-5 rounded-full transition-colors relative",
                  editing.local_stock !== undefined
                    ? "bg-blue-600"
                    : "bg-slate-300",
                )}
              >
                <input
                  type="checkbox"
                  className="hidden"
                  checked={editing.local_stock !== undefined}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditing({ ...editing, local_stock: 0 });
                    } else {
                      const { local_stock, ...rest } = editing;
                      setEditing(rest);
                    }
                  }}
                />
                <div
                  className={cn(
                    "absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform",
                    editing.local_stock !== undefined
                      ? "translate-x-5"
                      : "translate-x-0",
                  )}
                />
              </div>
              <span className="text-sm font-bold text-slate-700">
                Naudojamas vietinis sandėlis
              </span>
            </label>
            {editing.local_stock !== undefined && (
              <div className="animate-in slide-in-from-top-1 fade-in duration-200">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                  Kiekis sandėlyje (vnt.)
                </label>
                <input
                  type="number"
                  value={editing.local_stock}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      local_stock: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg bg-white"
                />
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4"
          >
            Išsaugoti
          </button>
        </div>
      </AdminModal>

      <AdminModal
        title="CSV Importas"
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      >
        {!importStats ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-500">
              Formatas:{" "}
              <strong>
                club_name, product_name, target_quantity, refill_quantity
              </strong>
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              className="w-full h-40 p-3 border border-slate-200 rounded-xl font-mono text-xs"
              placeholder="SG Akropolis, Popierinis rankšluostis, 20, 10"
            />
            <button
              onClick={handleImport}
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700"
            >
              Importuoti
            </button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 rounded-2xl">
              <div className="text-2xl font-bold text-green-600">
                {importStats.total}
              </div>
              <div className="text-sm text-green-700">Iš viso eilučių</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-blue-600">
                  {importStats.created}
                </div>
                <div className="text-[10px] text-slate-500">Sukurta</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-slate-700">
                  {importStats.updated}
                </div>
                <div className="text-[10px] text-slate-500">Atnaujinta</div>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl">
                <div className="font-bold text-red-600">
                  {importStats.skipped}
                </div>
                <div className="text-[10px] text-slate-500">Praleista</div>
              </div>
            </div>
            <button
              onClick={() => setImportModalOpen(false)}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold"
            >
              Gerai
            </button>
          </div>
        )}
      </AdminModal>
    </div>
  );
}

const CATEGORY_MAP: Record<ProductCategory, string> = {
  INVENTORY: "Smulkus inventorius",
  VENDING: "Vending prekės",
  CLEANING: "Švaros prekės",
  PRINT: "Spauda",
  FIRST_AID_KIT: "Vaistinėlės turinys",
  OTHER: "Kita",
};

function ProcurementAdmin({
  products,
  setProducts,
  suppliers,
  setSuppliers,
  inventorySettings,
  setInventorySettings,
  clubs,
  subTab: externalSubTab,
  onSubTabChange,
}: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  inventorySettings: ClubInventorySetting[];
  setInventorySettings: React.Dispatch<
    React.SetStateAction<ClubInventorySetting[]>
  >;
  clubs: Club[];
  subTab?: "products" | "suppliers" | "inventory_settings";
  onSubTabChange?: (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => void;
}) {
  const [internalActiveTab, setInternalActiveTab] = useState<
    "products" | "suppliers" | "inventory_settings"
  >("products");
  const activeTab = externalSubTab || internalActiveTab;
  const setActiveTab = (
    tab: "products" | "suppliers" | "inventory_settings",
  ) => {
    if (onSubTabChange) {
      onSubTabChange(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };
  const [editing, setEditing] = useState<Partial<any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // CSV Import state
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvConfigModalOpen, setCsvConfigModalOpen] = useState(false);
  const [csvData, setCsvData] = useState("");
  const [csvResult, setCsvResult] = useState<string>("");

  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleUpdateConfig = (
    clubId: string,
    field: "target_quantity" | "local_stock",
    value: number,
  ) => {
    if (!editingProduct) return;
    const existingIndex = inventorySettings.findIndex(
      (s) => s.club_id === clubId && s.product_id === editingProduct.id,
    );
    const newSettings = [...inventorySettings];
    if (existingIndex >= 0) {
      newSettings[existingIndex] = {
        ...newSettings[existingIndex],
        [field]: value,
      };
    } else {
      newSettings.push({
        club_id: clubId,
        product_id: editingProduct.id,
        target_quantity: field === "target_quantity" ? value : 0,
        refill_quantity: 0,
        [field]: value,
      } as ClubInventorySetting);
    }
    setInventorySettings(newSettings);
  };

  const importConfigCsv = () => {
    // CSV format: club_name,product_name,target_quantity,local_stock_quantity
    const lines = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const newSettings = [...inventorySettings];

    lines.forEach((line, idx) => {
      if (idx === 0) return; // skip header
      const parts = line.split(",");
      if (parts.length < 4) {
        skipped++;
        return;
      }
      const [clubName, productName, targetQty, localStock] = parts;

      const club = clubs.find(
        (c) => c.name.toLowerCase() === clubName.toLowerCase(),
      );
      const product = products.find(
        (p) => p.name.toLowerCase() === productName.toLowerCase(),
      );

      if (!club || !product) {
        skipped++;
        return;
      }

      const existingIndex = newSettings.findIndex(
        (s) => s.club_id === club.id && s.product_id === product.id,
      );
      if (existingIndex >= 0) {
        newSettings[existingIndex] = {
          ...newSettings[existingIndex],
          target_quantity: parseInt(targetQty),
          local_stock: parseInt(localStock),
        };
        updated++;
      } else {
        newSettings.push({
          club_id: club.id,
          product_id: product.id,
          target_quantity: parseInt(targetQty),
          local_stock: parseInt(localStock),
          refill_quantity: 0,
        });
        created++;
      }
    });
    setInventorySettings(newSettings);
    setCsvResult(
      `Sukurta: ${created}, Atnaujinta: ${updated}, Praleista: ${skipped}`,
    );
  };

  const handleSaveSupplier = () => {
    if (editing.id) {
      if (suppliers.find((s) => s.id === editing.id)) {
        setSuppliers(
          suppliers.map((s) =>
            s.id === editing.id ? ({ ...s, ...editing } as Supplier) : s,
          ),
        );
      } else {
        setSuppliers([
          ...suppliers,
          {
            ...editing,
            id: editing.id || Date.now().toString(),
            name: editing.name || "",
            email: editing.email || "",
            is_internal: !!editing.is_internal,
            requires_approval: !!editing.requires_approval,
          } as Supplier,
        ]);
      }
    }
    setModalOpen(false);
  };

  const handleSaveProduct = () => {
    const target = parseInt(editing.target_quantity) || 0;
    const local = parseInt(editing.local_stock_quantity) || 0;

    if (target < 0 || local < 0) {
      alert("Kiekiai negali būti neigiami");
      return;
    }

    const finalLocalStock = editing.has_local_stock ? local : 0;
    const productData = {
      ...editing,
      target_quantity: target,
      local_stock_quantity: finalLocalStock,
    };

    if (editing.id) {
      if (products.find((p) => p.id === editing.id)) {
        setProducts(
          products.map((p) =>
            p.id === editing.id ? ({ ...p, ...productData } as Product) : p,
          ),
        );
      } else {
        setProducts([
          ...products,
          {
            ...productData,
            id: editing.id || Date.now().toString(),
            name: editing.name || "",
            category: editing.category || "OTHER",
            supplier_id: editing.supplier_id || "",
            sku: editing.sku || "",
            is_active: true,
          } as Product,
        ]);
      }
    }
    setModalOpen(false);
  };

  const importCsv = () => {
    const lines = csvData.trim().split("\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;
    const newProducts = [...products];

    lines.forEach((line, idx) => {
      if (idx === 0) return; // skip header
      const parts = line.split(",");
      if (parts.length < 3) {
        skipped++;
        return;
      }
      const [name, category, supplierName, hasLocalStock, sku, image_url] =
        parts;

      const supplier = suppliers.find((s) => s.name === supplierName);
      if (!supplier || !Object.keys(CATEGORY_MAP).includes(category)) {
        skipped++;
        return;
      }

      const existingProd = newProducts.find((p) => p.name === name);
      if (existingProd) {
        Object.assign(existingProd, {
          category: category as ProductCategory,
          supplier_id: supplier.id,
          has_local_stock: hasLocalStock === "true",
          sku,
          image_url,
        });
        updated++;
      } else {
        newProducts.push({
          id: Date.now().toString() + Math.random(),
          name,
          category: category as ProductCategory,
          supplier_id: supplier.id,
          has_local_stock: hasLocalStock === "true",
          sku,
          image_url,
          is_active: true,
        });
        created++;
      }
    });
    setProducts(newProducts);
    setCsvResult(
      `Sukurta: ${created}, Atnaujinta: ${updated}, Praleista: ${skipped}`,
    );
  };

  const matches = (query: string, fields: string[]) => {
    return fields.some((f) => f?.toLowerCase().includes(query.toLowerCase()));
  };

  const filteredProducts = products.filter(
    (p) =>
      p.is_active !== false &&
      matches(searchQuery, [
        p.name,
        CATEGORY_MAP[p.category] || p.category,
        suppliers.find((s) => s.id === p.supplier_id)?.name || "",
      ]),
  );

  return (
    <div className="flex flex-col w-full h-auto min-h-0 overflow-visible">
      <div className="flex gap-1 p-2 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-hide shrink-0">
        <button
          onClick={() => setActiveTab("products")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "products"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Produktai
        </button>
        <button
          onClick={() => setActiveTab("suppliers")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "suppliers"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Tiekėjai
        </button>
        <button
          onClick={() => setActiveTab("inventory_settings")}
          className={cn(
            "whitespace-nowrap px-4 py-2 font-bold rounded-lg text-sm transition-colors",
            activeTab === "inventory_settings"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:border-slate-300 font-medium",
          )}
        >
          Nustatymai
        </button>
      </div>
      <div className="flex-1 overflow-visible p-0 md:p-4">
        {activeTab === "products" ? (
          <div className="p-4 md:p-0 overflow-x-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className="font-bold">Produktai</h3>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder="Ieškoti produkto..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCsvModalOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Importuoti CSV
                  </button>
                  <button
                    onClick={() => setCsvConfigModalOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm"
                  >
                    Nustatymai
                  </button>
                </div>
                <button
                  onClick={() => {
                    setEditing({
                      id: Date.now().toString(),
                      is_active: true,
                      has_local_stock: false,
                      category: "OTHER",
                    });
                    setModalOpen(true);
                  }}
                  className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
                >
                  + Pridėti
                </button>
              </div>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Foto</th>
                    <th className="pb-3 font-medium">Pavadinimas</th>
                    <th className="pb-3 font-medium">Kategorija</th>
                    <th className="pb-3 font-medium">Tiekėjas</th>
                    <th className="pb-3 font-medium">Liko dienų</th>
                    <th className="pb-3 font-medium">Statusas</th>
                    <th className="pb-3 font-medium text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, index) => {
                    const totalStock = inventorySettings
                      .filter((s) => s.product_id === p.id)
                      .reduce((acc, s) => acc + (s.local_stock || 0), 0);

                    const analytics = getProductAnalytics(
                      p.id,
                      totalStock,
                      productTransfers,
                      1,
                    );

                    return (
                      <tr
                        key={`${p.id}-${index}`}
                        className="border-b border-slate-100 items-center hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-4">
                          <img
                            src={p.image_url || "https://placehold.co/40x40"}
                            className="w-8 h-8 rounded object-cover"
                          />
                        </td>
                        <td className="py-4">
                          <div className="font-semibold text-slate-900">
                            {p.name}
                          </div>
                          {p.has_local_stock && (
                            <div className="text-[10px] text-blue-600 font-bold uppercase mt-0.5">
                              Bendras likutis: {totalStock} vnt.
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {CATEGORY_MAP[p.category]}
                        </td>
                        <td className="py-4 text-slate-500 text-sm">
                          {suppliers.find((s) => s.id === p.supplier_id)?.name}
                        </td>
                        <td className="py-4">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold",
                              analytics.days_left > 30
                                ? "bg-emerald-50 text-emerald-700"
                                : analytics.days_left >= 14
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-700",
                            )}
                          >
                            {Math.round(analytics.days_left)} d.
                          </div>
                        </td>
                        <td className="py-4">
                          {analytics.alert_level === "critical" ? (
                            <div className="flex items-center gap-1 text-red-600 text-xs font-black uppercase">
                              <AlertCircle size={14} /> Kritinis
                            </div>
                          ) : analytics.alert_level === "warning" ? (
                            <div className="flex items-center gap-1 text-amber-600 text-xs font-black uppercase">
                              <AlertCircle size={14} /> Įspėjimas
                            </div>
                          ) : (
                            <div className="text-emerald-600 text-xs font-black uppercase">
                              Optimalus
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditing(p);
                                setModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg text-xs font-bold"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setConfigModalOpen(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg text-xs font-bold"
                            >
                              <Settings size={16} />
                            </button>
                            <button
                              onClick={() =>
                                setProducts(
                                  products.map((prod) =>
                                    prod.id === p.id
                                      ? { ...prod, is_active: false }
                                      : prod,
                                  ),
                                )
                              }
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-4">
              {filteredProducts.map((p) => {
                const totalStock = inventorySettings
                  .filter((s) => s.product_id === p.id)
                  .reduce((acc, s) => acc + (s.local_stock || 0), 0);

                const analytics = getProductAnalytics(
                  p.id,
                  totalStock,
                  productTransfers,
                  1,
                );

                return (
                  <div
                    key={p.id}
                    className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <img
                          src={p.image_url || "https://placehold.co/40x40"}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-900 leading-tight">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-semibold">
                            {CATEGORY_MAP[p.category]}
                          </p>
                        </div>
                      </div>
                      <div
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                          analytics.days_left > 30
                            ? "bg-emerald-50 text-emerald-700"
                            : analytics.days_left >= 14
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700",
                        )}
                      >
                        {Math.round(analytics.days_left)} d.
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-t border-slate-50 text-[10px] font-bold text-slate-500 uppercase">
                      <span>Tiekėjas: <span className="text-slate-800">{suppliers.find((s) => s.id === p.supplier_id)?.name}</span></span>
                      {p.has_local_stock && (
                        <span className="text-blue-600">Likutis: {totalStock} vnt.</span>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => {
                          setEditing(p);
                          setModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-50 text-slate-600 rounded-lg text-xs font-bold"
                      >
                        Redaguoti
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setConfigModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold"
                      >
                        Klubams
                      </button>
                      <button
                        onClick={() =>
                          setProducts(
                            products.map((prod) =>
                              prod.id === p.id
                                ? { ...prod, is_active: false }
                                : prod,
                            ),
                          )
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="py-8 text-center text-slate-400">Nerasta rezultatų</p>
              )}
            </div>
          </div>
        ) : activeTab === "suppliers" ? (
          <div className="space-y-4 p-4 md:p-0 overflow-x-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Tiekėjai</h3>
              <button
                onClick={() => {
                  setEditing({
                    id: Date.now().toString(),
                    is_internal: false,
                    requires_approval: true,
                  });
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm"
              >
                + Pridėti
              </button>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="pb-3 font-medium">Pavadinimas</th>
                    <th className="pb-3 font-medium">El. paštas</th>
                    <th className="pb-3 font-medium">Tipas</th>
                    <th className="pb-3 font-medium">Reikia patvirtinimo</th>
                    <th className="pb-3 font-medium text-right">Veiksmai</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s, index) => (
                    <tr
                      key={`${s.id}-${index}`}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 font-semibold text-slate-900">{s.name}</td>
                      <td className="py-4 text-slate-500">{s.email}</td>
                      <td className="py-4 text-slate-500">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${s.is_internal ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {s.is_internal ? "Vidinis" : "Išorinis"}
                        </span>
                      </td>
                      <td className="py-4 text-slate-500">
                        {s.requires_approval ? "Taip" : "Ne"}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() => {
                            setEditing(s);
                            setModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {suppliers.map((s) => (
                <div
                  key={s.id}
                  className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900">{s.name}</h4>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${s.is_internal ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                      {s.is_internal ? "Vidinis" : "Išorinis"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-bold pt-2 border-t border-slate-50">
                    <span>Patvirtinimas: <span className="text-slate-800">{s.requires_approval ? "Taip" : "Ne"}</span></span>
                    <button
                      onClick={() => {
                        setEditing(s);
                        setModalOpen(true);
                      }}
                      className="text-blue-600 font-black"
                    >
                      Redaguoti
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <InventorySettingsAdmin
            settings={inventorySettings}
            setSettings={setInventorySettings}
            clubs={clubs}
            products={products}
          />
        )}
      </div>

      <AdminModal
        title={activeTab === "products" ? "Produktas" : "Tiekėjas"}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        {activeTab === "products" ? (
          <div className="space-y-4">
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Pavadinimas (required)"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <select
              value={editing.category || "OTHER"}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  category: e.target.value as ProductCategory,
                })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {Object.keys(CATEGORY_MAP).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_MAP[c as ProductCategory]}
                </option>
              ))}
            </select>
            {editing.category === "PRINT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={editing.dimensions || ""}
                  onChange={(e) =>
                    setEditing({ ...editing, dimensions: e.target.value })
                  }
                  placeholder="Išmatavimai (pvz: A4)"
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
                <select
                  value={editing.material || "Popierius"}
                  onChange={(e) =>
                    setEditing({ ...editing, material: e.target.value })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                >
                  <option value="">Pasirinkite pagrindą</option>
                  {printMaterials.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <select
              value={editing.supplier_id || ""}
              onChange={(e) =>
                setEditing({ ...editing, supplier_id: e.target.value })
              }
              className="w-full p-2 border border-slate-200 rounded-lg"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              value={editing.sku || ""}
              onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              placeholder="SKU"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Turi būti klube (vnt.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editing.target_quantity || 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      target_quantity: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Vietinis sandėlis (vnt.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={editing.local_stock_quantity || 0}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      local_stock_quantity: Number(e.target.value),
                    })
                  }
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.has_local_stock}
                onChange={(e) =>
                  setEditing({ ...editing, has_local_stock: e.target.checked })
                }
              />{" "}
              Naudojamas vietinis sandėlis
            </label>
            <button
              onClick={handleSaveProduct}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Išsaugoti
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Pavadinimas"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <input
              value={editing.email || ""}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
              placeholder="El. paštas"
              className="w-full p-2 border border-slate-200 rounded-lg"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.is_internal}
                onChange={(e) =>
                  setEditing({ ...editing, is_internal: e.target.checked })
                }
              />{" "}
              Vidinis
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editing.requires_approval}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    requires_approval: e.target.checked,
                  })
                }
              />{" "}
              Reikia patvirtinimo
            </label>
            <button
              onClick={handleSaveSupplier}
              className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              Išsaugoti
            </button>
          </div>
        )}
      </AdminModal>

      <AdminModal
        title="Importuoti produktus"
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
      >
        <div className="space-y-4">
          <textarea
            className="w-full h-32 border border-slate-200 rounded-lg p-2 text-xs"
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
            placeholder="name,category,supplier_name,has_local_stock,sku,image_url..."
          />
          <button
            onClick={importCsv}
            className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
          >
            Importuoti
          </button>
          {csvResult && (
            <p className="text-sm text-center font-bold text-green-600">
              {csvResult}
            </p>
          )}
        </div>
      </AdminModal>

      <AdminModal
        title="Produkto nustatymai pagal klubą"
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
      >
        <div className="space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Klubas
                </th>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Salėje
                </th>
                <th className="text-left font-bold text-slate-500 pb-2">
                  Sandėlyje
                </th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => {
                const setting = inventorySettings.find(
                  (s) =>
                    s.club_id === club.id &&
                    s.product_id === editingProduct?.id,
                );
                return (
                  <tr key={club.id} className="border-b border-slate-100">
                    <td className="py-2 font-medium">{club.name}</td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="w-16 border rounded p-1"
                        value={setting?.target_quantity || 0}
                        onChange={(e) =>
                          handleUpdateConfig(
                            club.id,
                            "target_quantity",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </td>
                    <td className="py-2">
                      <input
                        type="number"
                        className="w-16 border rounded p-1"
                        value={setting?.local_stock || 0}
                        onChange={(e) =>
                          handleUpdateConfig(
                            club.id,
                            "local_stock",
                            parseInt(e.target.value),
                          )
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AdminModal>
    </div>
  );
}

function PeriodicTemplatesAdmin({
  templates,
  setTemplates,
  clubs,
  clubTaskConfigs,
  setClubTaskConfigs,
}: {
  templates: any[];
  setTemplates: any;
  clubs: Club[];
  clubTaskConfigs?: any[];
  setClubTaskConfigs?: any;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>({});
  const [selectedClub, setSelectedClub] = useState<string | null>(null);

  // Group clubs by region
  const clubsByRegion = clubs.reduce(
    (acc, club) => {
      const region = club.region || "Kiti";
      if (!acc[region]) acc[region] = [];
      acc[region].push(club);
      return acc;
    },
    {} as Record<string, Club[]>,
  );

  const handleConfirm = () => {
    if (!setClubTaskConfigs || !clubTaskConfigs) return;

    setClubTaskConfigs(
      clubTaskConfigs.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              ...editing,
              status: "APPROVED",
              reviewed: true,
              reviewed_by: "ADMIN",
              reviewed_at: new Date().toISOString(),
            }
          : c,
      ),
    );
    setModalOpen(false);
  };

  const handleAddTask = () => {
    if (!setClubTaskConfigs || !clubTaskConfigs) return;

    if (!editing.name || !editing.frequency) {
      alert("Užpildykite visus laukus");
      return;
    }

    const templateId = "tpl_" + Date.now().toString();

    if (editing.apply_to_all) {
      // Add to global templates
      setTemplates([
        ...templates,
        {
          id: templateId,
          name: editing.name,
          description: editing.description || "",
          frequency: editing.frequency,
          targetMode: "ALL_CLUBS",
          club_id: null,
        },
      ]);
      // The useEffect will pick this up and auto-generate drafts for all clubs!
    } else {
      if (!editing.club_id) {
        alert("Pasirinkite klubą arba pažymėkite 'Taikyti visiems'");
        return;
      }
      setClubTaskConfigs([
        ...clubTaskConfigs,
        {
          id: "conf_" + Date.now(),
          template_id: templateId,
          club_id: editing.club_id,
          name: editing.name,
          description: editing.description || "",
          frequency: editing.frequency,
          status: "APPROVED", // Since they manually added it, can be approved directly
          reviewed: true,
          modified: true,
        },
      ]);
    }

    setAddTaskModalOpen(false);
  };

  return (
    <div className="p-3 md:p-6 w-full h-auto min-h-0 overflow-visible bg-white md:bg-slate-50 flex flex-col gap-4 md:gap-6">
      <div className="flex justify-between items-start md:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
            Periodinių darbų konfigūracija
          </h2>
          <p className="text-slate-500 text-xs md:text-sm mt-1">
            Peržiūrėkite ir patvirtinkite periodinius darbus kiekvienam klubui
          </p>
        </div>
        <button
          onClick={() => {
            setEditing({ apply_to_all: true, frequency: "monthly" });
            setAddTaskModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-[#d9f945] text-black rounded-xl font-semibold shadow-sm hover:scale-105 transition-all text-xs md:text-sm relative z-10 shrink-0"
        >
          <Plus size={18} /> <span className="hidden sm:inline">Pridėti užduotį</span><span className="sm:hidden">Pridėti</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6 min-h-0">
        {/* Sidebar: Regions & Clubs */}
        <div className="lg:col-span-1 bg-white md:rounded-2xl md:border md:border-slate-200 overflow-y-auto w-full p-0 md:p-2 border-b lg:border-0 pb-4">
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide gap-1 md:gap-0">
          {Object.keys(clubsByRegion).map((region) => (
            <div key={region} className="mb-0 lg:mb-4 shrink-0 lg:shrink w-[200px] lg:w-full">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-3 pt-2">
                {region}
              </h3>
              <div className="space-y-1">
                {clubsByRegion[region].map((club) => {
                  const clubConfigs = (clubTaskConfigs || []).filter(
                    (c) => c.club_id === club.id,
                  );
                  const hasDrafts = clubConfigs.some(
                    (c) => c.status === "DRAFT",
                  );

                  return (
                    <button
                      key={club.id}
                      onClick={() => setSelectedClub(club.id)}
                      className={cn(
                        "w-full flex flex-col p-3 rounded-xl transition-all text-left",
                        selectedClub === club.id
                          ? "bg-slate-100 ring-1 ring-slate-200"
                          : "hover:bg-slate-50",
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-sm text-slate-800 truncate pr-2">
                          {club.name}
                        </span>
                        {hasDrafts && (
                          <AlertCircle
                            size={14}
                            className="text-red-500 flex-shrink-0"
                          />
                        )}
                      </div>
                      {hasDrafts && (
                        <span className="text-[10px] text-red-500 font-medium mt-1">
                          Draft
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Main Area: Task List */}
        <div className="lg:col-span-3 bg-white md:rounded-2xl md:border md:border-slate-200 p-0 md:p-6 overflow-y-auto md:shadow-sm">
          {!selectedClub ? (
            <div className="h-full py-12 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-center px-6">
                Pasirinkite klubą, kad matytumėte konfigūraciją
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 py-4 md:pt-0 md:pb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {clubs.find((c) => c.id === selectedClub)?.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
                {(clubTaskConfigs || [])
                  .filter((c) => c.club_id === selectedClub)
                  .map((config) => (
                    <div
                      key={config.id}
                      onClick={() => {
                        setEditing(config);
                        setModalOpen(true);
                      }}
                      className={cn(
                        "relative overflow-hidden border p-5 rounded-2xl cursor-pointer hover:-translate-y-1 transition-all bg-white group",
                        config.status === "DRAFT"
                          ? "border-red-200 shadow-sm shadow-red-50"
                          : "border-slate-200 hover:border-slate-300 shadow-sm",
                      )}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide",
                            config.status === "DRAFT"
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-green-50 text-green-600 border border-green-100",
                          )}
                        >
                          {config.status === "DRAFT"
                            ? "Reikia peržiūrėti (Draft)"
                            : "Patvirtinta"}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase">
                          {config.frequency}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-[15px] mb-2 leading-tight pr-4">
                        {config.name}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit2 size={14} className="text-slate-400" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      <AdminModal
        title="Užduoties peržiūra"
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-2">
            <div className="text-xs text-slate-500 font-bold mb-1 uppercase tracking-wider">
              Pavadinimas
            </div>
            <div className="font-semibold text-slate-800 text-lg">
              {editing.name}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Dažnumas
            </label>
            <select
              value={editing.frequency || ""}
              onChange={(e) =>
                setEditing({ ...editing, frequency: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#d9f945] font-medium text-slate-700"
            >
              <option value="daily">Kasdien</option>
              <option value="weekly">Kas savaitę</option>
              <option value="monthly">Kas mėnesį</option>
              <option value="quarterly">Kas ketvirtį</option>
              <option value="yearly">Kartą metuose</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Instrukcija / Užduotis
            </label>
            <textarea
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#d9f945] min-h-[120px] font-medium text-slate-700"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Uždaryti
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 bg-[#d9f945] text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#c8e63f] transition-colors"
            >
              <Check size={18} /> Patvirtinti
            </button>
          </div>
        </div>
      </AdminModal>

      {/* Add Task Modal */}
      <AdminModal
        title="Pridėti naują"
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Pavadinimas *
            </label>
            <input
              value={editing.name || ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
              placeholder="Pvz. Filtru pakeitimas"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Dažnumas *
            </label>
            <select
              value={editing.frequency || "monthly"}
              onChange={(e) =>
                setEditing({ ...editing, frequency: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
            >
              <option value="daily">Kasdien</option>
              <option value="weekly">Kas savaitę</option>
              <option value="monthly">Kas mėnesį</option>
              <option value="quarterly">Kas ketvirtį</option>
              <option value="yearly">Kartą metuose</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
              Aprašymas
            </label>
            <textarea
              value={editing.description || ""}
              onChange={(e) =>
                setEditing({ ...editing, description: e.target.value })
              }
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium min-h-[100px]"
            />
          </div>

          <label className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={editing.apply_to_all || false}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  apply_to_all: e.target.checked,
                  club_id: null,
                })
              }
              className="w-5 h-5 text-black border-slate-300 rounded focus:ring-black"
            />
            <span className="font-semibold text-slate-800 text-sm">
              Taikyti visiems klubams
            </span>
          </label>

          {!editing.apply_to_all && (
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2">
                Pasirinkite klubą *
              </label>
              <select
                value={editing.club_id || ""}
                onChange={(e) =>
                  setEditing({ ...editing, club_id: e.target.value })
                }
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#d9f945] font-medium"
              >
                <option value="">-- Nepasirinkta --</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-4">
            <button
              onClick={handleAddTask}
              className="w-full py-3.5 bg-black text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
            >
              Pridėti užduotį
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
