import type { Club } from "../mock-db/clubs";
import type { User } from "../mock-db/users";
import type { AuthUser } from "../auth/types";
import type { WorkflowType } from "../mock-db/workflowTypes";
import type { Fault } from "../types/faults";
import { filterFaults } from "./faultFilter";
import { getScopedFaults } from "./regionScopeLogic";
import { getWorkflowKanbanLanes } from "./workflowKanbanConfig";
import {
  isRegisteredWorkflowStatus,
  sanitizeWorkflowStatusConfig,
} from "./workflowStatusRegistry";
import { normalizeWorkflowStatusId } from "./statusLabels";
import { canAccessModule } from "./permissionEngine";
import { canViewWorkflowResolver } from "./permissionPreviewResolver";

type WorkflowVisibilityUser =
  | User
  | (AuthUser & { assignedRoleIds?: string[] });

type PeriodicDestinationTemplate = {
  destinationWorkflowTypeId?: string;
  targetSubmodule?: string;
  category?: string;
  type?: string;
};

export type PeriodicDestinationWorkflowResolutionSource =
  | "explicit"
  | "legacy"
  | "fallback"
  | "none";

export interface PeriodicDestinationWorkflowResolution {
  workflowTypeId?: string;
  source: PeriodicDestinationWorkflowResolutionSource;
  warnings: string[];
}

export interface ResolvePeriodicDestinationWorkflowContext {
  workflowTypes: WorkflowType[];
  fallbackLegacyCategory?: string;
}

const getActiveWorkflowById = (
  workflowTypes: WorkflowType[],
  workflowTypeId?: string,
): WorkflowType | undefined =>
  workflowTypeId
    ? workflowTypes.find(
        (workflow) =>
          workflow.id === workflowTypeId &&
          Boolean(workflow.active ?? workflow.enabled),
      )
    : undefined;

const getActiveWorkflowByLegacyCategory = (
  workflowTypes: WorkflowType[],
  legacyCategory?: string,
): WorkflowType | undefined =>
  legacyCategory
    ? workflowTypes.find(
        (workflow) =>
          workflow.legacyCategory === legacyCategory &&
          Boolean(workflow.active ?? workflow.enabled),
      )
    : undefined;

const getPeriodicLegacyCandidates = (
  template: PeriodicDestinationTemplate,
): string[] => {
  const candidates = [
    template.targetSubmodule,
    template.category,
    template.type,
  ].filter((value): value is string => Boolean(value));

  return Array.from(new Set(candidates));
};

export const resolvePeriodicDestinationWorkflowTypeId = (
  template: PeriodicDestinationTemplate,
  context: ResolvePeriodicDestinationWorkflowContext,
): PeriodicDestinationWorkflowResolution => {
  const warnings: string[] = [];
  const explicitWorkflow = getActiveWorkflowById(
    context.workflowTypes,
    template.destinationWorkflowTypeId,
  );

  if (explicitWorkflow) {
    return {
      workflowTypeId: explicitWorkflow.id,
      source: "explicit",
      warnings,
    };
  }

  if (template.destinationWorkflowTypeId) {
    warnings.push("INVALID_DESTINATION_WORKFLOW_TYPE_ID");
  }

  // Compatibility only: legacy templates did not store a destination workflow.
  for (const legacyCategory of getPeriodicLegacyCandidates(template)) {
    const legacyWorkflow = getActiveWorkflowByLegacyCategory(
      context.workflowTypes,
      legacyCategory,
    );

    if (legacyWorkflow) {
      return {
        workflowTypeId: legacyWorkflow.id,
        source: "legacy",
        warnings,
      };
    }
  }

  const fallbackWorkflow = getActiveWorkflowByLegacyCategory(
    context.workflowTypes,
    context.fallbackLegacyCategory,
  );

  if (fallbackWorkflow) {
    return {
      workflowTypeId: fallbackWorkflow.id,
      source: "fallback",
      warnings,
    };
  }

  return {
    source: "none",
    warnings,
  };
};

export const applyWorkflowMigration = (
  items: Fault[],
  getWorkflowTypeByLegacyCategory: (
    category?: string,
  ) => WorkflowType | undefined,
): Fault[] =>
  items.map((item) => ({
    ...item,
    status: normalizeWorkflowStatusId(item.status) as any,
    history: (item.history || []).map((historyItem: any) => ({
      ...historyItem,
      oldStatus: historyItem.oldStatus
        ? normalizeWorkflowStatusId(historyItem.oldStatus)
        : historyItem.oldStatus,
      newStatus: historyItem.newStatus
        ? normalizeWorkflowStatusId(historyItem.newStatus)
        : historyItem.newStatus,
    })),
    status_history: (item.status_history || []).map((historyItem: any) => ({
      ...historyItem,
      from: historyItem.from
        ? normalizeWorkflowStatusId(historyItem.from)
        : historyItem.from,
      to: historyItem.to
        ? normalizeWorkflowStatusId(historyItem.to)
        : historyItem.to,
    })),
    workflowTypeId:
      item.workflowTypeId ||
      getWorkflowTypeByLegacyCategory(item.category || item.type)?.id ||
      getWorkflowTypeByLegacyCategory("OTHER")?.id,
  }));

export const normalizeWorkflowStatusConfig = (
  nextWorkflows: WorkflowType[],
  previousWorkflows: WorkflowType[],
): WorkflowType[] =>
  nextWorkflows.map((workflow) => {
    const previousWorkflow = previousWorkflows.find(
      (item) => item.id === workflow.id,
    );
    const statuses = sanitizeWorkflowStatusConfig(
      workflow.statuses,
      previousWorkflow?.statuses,
    );

    return {
      ...workflow,
      statuses,
      kanbanSettings: {
        ...workflow.kanbanSettings,
        lanes: statuses.map((status) => status.id),
      },
    };
  });

export const getScopedEntities = (
  faults: Fault[],
  tasks: Fault[],
  currentUser: User,
  selectedRegion: string,
  clubs: Club[],
): Fault[] => {
  const entityMap = new Map<string, Fault>();
  faults.forEach((fault) => {
    if (fault && fault.id) entityMap.set(fault.id, fault);
  });
  tasks.forEach((task) => {
    if (task && task.id) entityMap.set(task.id, task);
  });

  return getScopedFaults(
    Array.from(entityMap.values()),
    currentUser,
    selectedRegion,
    clubs,
  );
};

export const splitScopedEntities = (
  scopedEntities: Fault[],
): { scopedFaults: Fault[]; scopedTasks: Fault[] } => ({
  scopedFaults: scopedEntities.filter((entity) => entity.entityType === "fault"),
  scopedTasks: scopedEntities.filter((entity) => entity.entityType !== "fault"),
});

export interface FilterBoardEntitiesParams {
  scopedEntities: Fault[];
  activeTab: string;
  searchQuery: string;
  clubs: Club[];
  getRemainingTime: (fault: Fault) => { overdue: boolean; text: string };
  slaFilter: string;
  sourceFilter: string;
  appUsers: User[];
  currentUser: WorkflowVisibilityUser;
  assigneeFilter: string;
  quickFilter: string;
  periodicFilter: "ALL" | "PERIODIC" | "SIMPLE";
  clubFilter: string[];
  selectedWorkflowTypeIds?: string[];
  permittedWorkflowTypeIds?: string[];
}

export const filterBoardEntities = ({
  scopedEntities,
  activeTab,
  searchQuery,
  clubs,
  getRemainingTime,
  slaFilter,
  sourceFilter,
  appUsers,
  currentUser,
  assigneeFilter,
  quickFilter,
  periodicFilter,
  clubFilter,
  selectedWorkflowTypeIds,
  permittedWorkflowTypeIds,
}: FilterBoardEntitiesParams): Fault[] => {
  const base = scopedEntities.filter((item) => {
    if (item.isDeleted) return false;
    if (item.archivedAt) return false;
    if (activeTab === "kanban") return item.entityType === "fault";
    if (activeTab === "tasks") return item.entityType !== "fault";
    return false;
  });

  const filtered = base.filter((fault) => {
    const matchesSearch =
      fault.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clubs
        .find((club) => club.id === fault.clubId)
        ?.name.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const sla = getRemainingTime(fault);
    const isDelayed = sla.overdue;
    const matchesSla =
      slaFilter === "visi" ||
      (slaFilter === "delayed" && isDelayed) ||
      (slaFilter === "<24h" && !isDelayed && sla.text.includes("h"));

    const isNear =
      !isDelayed && sla.text.includes("h") && parseInt(sla.text) < 24;

    const source = fault.source || "USER";
    const matchesSource = sourceFilter === "ALL" || source === sourceFilter;

    const assignedToId = fault.assigned_to || fault.assigneeId;
    const assignedToName =
      typeof fault.assignedTo === "object" && fault.assignedTo
        ? fault.assignedTo.name
        : fault.assignedTo ||
          fault.assigneeName ||
          (fault.assigned_to
            ? appUsers.find((user) => user.id === fault.assigned_to)?.name
            : null);

    const matchesAssignee =
      assigneeFilter === "ALL" ||
      (assigneeFilter === "MINE" &&
        (assignedToId === currentUser.id ||
          assignedToName === currentUser.name)) ||
      (assigneeFilter === "UNASSIGNED" && !assignedToId && !assignedToName) ||
      assignedToId === assigneeFilter ||
      assignedToName === assigneeFilter;

    const normalizedQuickFilter = ["all", "delayed", "near"].includes(
      quickFilter,
    )
      ? quickFilter
      : "all";

    const matchesQuick =
      normalizedQuickFilter === "all" ||
      (normalizedQuickFilter === "delayed" && isDelayed) ||
      (normalizedQuickFilter === "near" && isNear);

    const matchesPeriodic =
      periodicFilter === "ALL" ||
      (periodicFilter === "PERIODIC" && fault.source === "PERIODIC") ||
      (periodicFilter === "SIMPLE" && fault.source !== "PERIODIC");

    const matchesWorkflowType =
      selectedWorkflowTypeIds && selectedWorkflowTypeIds.length > 0
        ? Boolean(
            fault.workflowTypeId &&
              selectedWorkflowTypeIds.includes(fault.workflowTypeId) &&
              (!permittedWorkflowTypeIds ||
                permittedWorkflowTypeIds.includes(fault.workflowTypeId)),
          )
        : !permittedWorkflowTypeIds ||
          Boolean(fault.workflowTypeId && permittedWorkflowTypeIds.includes(fault.workflowTypeId));

    return (
      matchesSearch &&
      matchesSla &&
      matchesQuick &&
      matchesSource &&
      matchesAssignee &&
      matchesPeriodic &&
      matchesWorkflowType
    );
  });

  return filterFaults(filtered, "all", clubFilter, clubs);
};

export const getActiveDarbaiWorkflowIds = (
  workflowTypes: WorkflowType[],
  selectedWorkflowTypeIds: string[] = [],
  currentUser?: WorkflowVisibilityUser,
): string[] =>
  workflowTypes
    .filter((workflow) => {
      if (!workflow.enabled) return false;
      if (currentUser && !canViewWorkflowResolver(currentUser, workflow)) {
        return false;
      }
      if (selectedWorkflowTypeIds.length > 0) {
        return selectedWorkflowTypeIds.includes(workflow.id);
      }
      return true;
    })
    .map((workflow) => workflow.id);

export const canViewWorkflowType = (
  workflow: WorkflowType,
  currentUser: WorkflowVisibilityUser,
): boolean => {
  return canViewWorkflowResolver(currentUser, workflow);
};

export const getActiveWorkflowTypesForModule = (
  workflowTypes: WorkflowType[],
  moduleId: string,
  currentUser: WorkflowVisibilityUser,
): WorkflowType[] => {
  if (!canAccessModule(currentUser as any, moduleId)) return [];

  return workflowTypes
    .filter((workflow) => {
      const moduleMatches =
        moduleId === "darbai" || workflow.moduleId === moduleId;
      const active = workflow.active ?? workflow.enabled;
      return moduleMatches && active && canViewWorkflowType(workflow, currentUser);
    })
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
};

export const hasUnmappedWorkflowStatuses = (entities: Fault[]): boolean =>
  entities.some(
    (entity) => !isRegisteredWorkflowStatus(normalizeWorkflowStatusId(entity.status)),
  );

export const getBoardKanbanLanes = (
  workflowTypes: WorkflowType[],
  options: {
    includeSomeday: boolean;
    activeWorkflowIds: string[];
    includeUnknownLane: boolean;
  },
): string[] => getWorkflowKanbanLanes(workflowTypes, options);
