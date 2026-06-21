import { Status } from "../types/faults";
import type { WorkflowStatusConfig, WorkflowType } from "../mock-db/workflowTypes";

export const UNKNOWN_STATUS_LANE_ID = "__unknown_status__";

export type WorkflowStatusId = Status;

export type WorkflowSlaBehavior =
  | "running"
  | "paused"
  | "completed"
  | "excluded";

export interface WorkflowStatusDefinition {
  id: WorkflowStatusId;
  labels: string[];
  defaultLabel: string;
  color: string;
  terminal: boolean;
  defaultVisible: boolean;
  slaBehavior: WorkflowSlaBehavior;
  countsAsOverdue: boolean;
  allowedWorkflowUsage: Array<"fault" | "order" | "other" | "periodic">;
}

export const workflowStatusRegistry: WorkflowStatusDefinition[] = [
  {
    id: Status.NEW,
    labels: ["Naujas", "NEW"],
    defaultLabel: "Naujas",
    color: "slate",
    terminal: false,
    defaultVisible: true,
    slaBehavior: "running",
    countsAsOverdue: true,
    allowedWorkflowUsage: ["fault", "other", "periodic"],
  },
  {
    id: Status.IN_PROGRESS,
    labels: ["Vykdoma", "IN_PROGRESS"],
    defaultLabel: "Vykdoma",
    color: "blue",
    terminal: false,
    defaultVisible: true,
    slaBehavior: "running",
    countsAsOverdue: true,
    allowedWorkflowUsage: ["fault", "other", "periodic"],
  },
  {
    id: Status.WAITING_DETAILS,
    labels: [
      "Laukiama",
      "Laukiama detalių",
      "Laukiama detalių",
      "Laukiama detalių",
      "WAITING",
      "WAITING_DETAILS",
    ],
    defaultLabel: "Laukiama",
    color: "amber",
    terminal: false,
    defaultVisible: true,
    slaBehavior: "paused",
    countsAsOverdue: true,
    allowedWorkflowUsage: ["fault", "other", "periodic"],
  },
  {
    id: Status.FIXED,
    labels: ["Atlikta", "Sutvarkyta", "DONE", "FIXED"],
    defaultLabel: "Atlikta",
    color: "emerald",
    terminal: true,
    defaultVisible: true,
    slaBehavior: "completed",
    countsAsOverdue: false,
    allowedWorkflowUsage: ["fault", "other", "periodic"],
  },
  {
    id: Status.REJECTED,
    labels: ["Atmesta", "REJECTED"],
    defaultLabel: "Atmesta",
    color: "red",
    terminal: true,
    defaultVisible: true,
    slaBehavior: "excluded",
    countsAsOverdue: false,
    allowedWorkflowUsage: ["fault", "order", "other", "periodic"],
  },
  {
    id: Status.SOMEDAY,
    labels: ["Kada nors", "SOMEDAY"],
    defaultLabel: "Kada nors",
    color: "violet",
    terminal: false,
    defaultVisible: true,
    slaBehavior: "paused",
    countsAsOverdue: false,
    allowedWorkflowUsage: ["other"],
  },
  {
    id: Status.MOVED,
    labels: ["Perkelta", "PERKELTA", "MOVED"],
    defaultLabel: "Perkelta",
    color: "slate",
    terminal: true,
    defaultVisible: false,
    slaBehavior: "excluded",
    countsAsOverdue: false,
    allowedWorkflowUsage: ["fault", "other"],
  },
];

const statusById = new Map(
  workflowStatusRegistry.map((status) => [status.id, status]),
);

const statusAliasToId = new Map<string, WorkflowStatusId>();
workflowStatusRegistry.forEach((status) => {
  statusAliasToId.set(status.id, status.id);
  status.labels.forEach((label) => statusAliasToId.set(label, status.id));
});

export const isRegisteredWorkflowStatus = (
  statusId?: string | null,
): statusId is WorkflowStatusId =>
  Boolean(statusId && statusById.has(statusId as WorkflowStatusId));

export const normalizeWorkflowStatusId = (
  status?: string | null,
): string => {
  if (!status) return "";
  return statusAliasToId.get(status) || status;
};

export const getWorkflowStatusDefinition = (
  statusId?: string | null,
): WorkflowStatusDefinition | undefined =>
  statusById.get(normalizeWorkflowStatusId(statusId) as WorkflowStatusId);

export const getWorkflowStatusLabel = (status?: string | null): string => {
  const statusId = normalizeWorkflowStatusId(status);
  return getWorkflowStatusDefinition(statusId)?.defaultLabel || statusId;
};

export const getDefaultWorkflowStatuses = (): WorkflowStatusConfig[] =>
  workflowStatusRegistry
    .filter((status) => status.defaultVisible)
    .map((status) => ({
      id: status.id,
      label: status.defaultLabel,
      terminal: status.terminal || undefined,
    }));

export const validateWorkflowStatusIds = (
  statusIds: string[],
  context: string,
): WorkflowStatusId[] => {
  const validStatusIds: WorkflowStatusId[] = [];

  statusIds.forEach((statusId) => {
    const normalizedStatusId = normalizeWorkflowStatusId(statusId);
    if (isRegisteredWorkflowStatus(normalizedStatusId)) {
      validStatusIds.push(normalizedStatusId);
    } else {
      console.warn(
        `[workflow-status] Ignoring unsupported status "${statusId}" in ${context}`,
      );
    }
  });

  return Array.from(new Set(validStatusIds));
};

export const sanitizeWorkflowStatusConfig = (
  statuses: WorkflowStatusConfig[],
  previousStatuses: WorkflowStatusConfig[] = [],
): WorkflowStatusConfig[] => {
  const previousById = new Map(
    previousStatuses.map((status) => [
      normalizeWorkflowStatusId(status.id),
      status,
    ]),
  );

  const sanitized = statuses
    .map((status, index) => {
      const normalizedStatusId = normalizeWorkflowStatusId(status.id);
      const previousStatus = previousStatuses[index];
      const previousStatusId = normalizeWorkflowStatusId(previousStatus?.id);
      const stableId = isRegisteredWorkflowStatus(normalizedStatusId)
        ? normalizedStatusId
        : isRegisteredWorkflowStatus(previousStatusId)
          ? previousStatusId
          : "";

      if (!stableId) {
        console.warn(
          `[workflow-status] Dropping unsupported workflow status "${status.id}"`,
        );
        return null;
      }

      const registryStatus = getWorkflowStatusDefinition(stableId);
      const matchingPrevious = previousById.get(stableId);

      return {
        id: stableId,
        label:
          status.label ||
          matchingPrevious?.label ||
          registryStatus?.defaultLabel ||
          stableId,
        terminal: registryStatus?.terminal || undefined,
      };
    })
    .filter(Boolean) as WorkflowStatusConfig[];

  return sanitized.length ? sanitized : getDefaultWorkflowStatuses();
};

const FAULT_TRANSITIONS: Partial<Record<Status, Status[]>> = {
  [Status.NEW]: [Status.IN_PROGRESS],
  [Status.IN_PROGRESS]: [Status.WAITING_DETAILS, Status.FIXED, Status.REJECTED],
  [Status.WAITING_DETAILS]: [Status.IN_PROGRESS],
  [Status.FIXED]: [],
  [Status.REJECTED]: [],
  [Status.SOMEDAY]: [Status.REJECTED],
};

export const getAllowedTransitions = (currentStatus: string): Status[] => {
  const transitions = FAULT_TRANSITIONS[currentStatus as Status];
  if (transitions !== undefined) return transitions;
  return Object.values(Status).filter((s) => s !== Status.MOVED);
};

export const getSupportedWorkflowLanes = (
  workflow: WorkflowType,
): WorkflowStatusId[] =>
  validateWorkflowStatusIds(
    workflow.kanbanSettings.lanes,
    `workflow "${workflow.id}" kanban lanes`,
  );
