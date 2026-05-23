import type { Club } from "../mock-db/clubs";
import type { User } from "../mock-db/users";
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
): Fault[] => {
  const entityMap = new Map<string, Fault>();
  faults.forEach((fault) => {
    if (fault && fault.id) entityMap.set(fault.id, fault);
  });
  tasks.forEach((task) => {
    if (task && task.id) entityMap.set(task.id, task);
  });

  return getScopedFaults(Array.from(entityMap.values()), currentUser, selectedRegion);
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
  typeFilters: string[];
  sourceFilter: string;
  appUsers: User[];
  currentUser: User;
  assigneeFilter: string;
  quickFilter: string;
  periodicFilter: "ALL" | "PERIODIC" | "SIMPLE";
  clubFilter: string;
}

export const filterBoardEntities = ({
  scopedEntities,
  activeTab,
  searchQuery,
  clubs,
  getRemainingTime,
  slaFilter,
  typeFilters,
  sourceFilter,
  appUsers,
  currentUser,
  assigneeFilter,
  quickFilter,
  periodicFilter,
  clubFilter,
}: FilterBoardEntitiesParams): Fault[] => {
  const base = scopedEntities.filter((item) => {
    if (item.isDeleted) return false;
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

    const matchesType =
      typeFilters.length === 0
        ? true
        : typeFilters.some(
            (filter) =>
              filter === fault.type ||
              filter === fault.category ||
              filter === fault.workflowTypeId,
          );
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
      (assigneeFilter === "OPS" &&
        (assignedToName === "OPS" || assignedToId === "OPS")) ||
      assignedToId === assigneeFilter ||
      assignedToName === assigneeFilter;

    const mineQuickMatch =
      assignedToId === currentUser.id || assignedToName === currentUser.name;

    const matchesQuick =
      quickFilter === "all" ||
      (quickFilter === "mine" && mineQuickMatch) ||
      (quickFilter === "delayed" && isDelayed) ||
      (quickFilter === "near" && isNear) ||
      (quickFilter === "priority" && fault.priority === "critical");

    const matchesPeriodic =
      periodicFilter === "ALL" ||
      (periodicFilter === "PERIODIC" && fault.source === "PERIODIC") ||
      (periodicFilter === "SIMPLE" && fault.source !== "PERIODIC");

    return (
      matchesSearch &&
      matchesSla &&
      matchesQuick &&
      matchesType &&
      matchesSource &&
      matchesAssignee &&
      matchesPeriodic
    );
  });

  return filterFaults(filtered, "all", clubFilter);
};

export const getActiveDarbaiWorkflowIds = (
  workflowTypes: WorkflowType[],
  typeFilters: string[],
): string[] =>
  workflowTypes
    .filter((workflow) => {
      if (!workflow.enabled || workflow.category !== "DARBAI") return false;
      if (typeFilters.length === 0) return true;
      return typeFilters.some(
        (filter) =>
          filter === workflow.id || filter === workflow.legacyCategory,
      );
    })
    .map((workflow) => workflow.id);

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
