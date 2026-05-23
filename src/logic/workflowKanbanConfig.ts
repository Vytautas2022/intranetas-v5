import { Status } from "../types/faults";
import type { WorkflowType } from "../mock-db/workflowTypes";
import {
  getSupportedWorkflowLanes,
  UNKNOWN_STATUS_LANE_ID,
} from "./workflowStatusRegistry";

const FALLBACK_KANBAN_LANES = [
  Status.NEW,
  Status.IN_PROGRESS,
  Status.WAITING_DETAILS,
  Status.FIXED,
  Status.REJECTED,
  Status.SOMEDAY,
];

export const getWorkflowKanbanLanes = (
  workflowTypes: WorkflowType[],
  options: {
    includeSomeday: boolean;
    activeWorkflowIds?: string[];
    includeUnknownLane?: boolean;
  },
): string[] => {
  const activeWorkflowIdSet = new Set(options.activeWorkflowIds || []);
  const activeWorkflows = workflowTypes.filter(
    (workflow) =>
      workflow.enabled &&
      workflow.kanbanSettings.enabled &&
      (activeWorkflowIdSet.size === 0 || activeWorkflowIdSet.has(workflow.id)),
  );

  const workflowsForLanes = activeWorkflows.length
    ? activeWorkflows
    : workflowTypes.filter(
        (workflow) => workflow.enabled && workflow.kanbanSettings.enabled,
      );

  const configuredLanes = workflowsForLanes.flatMap((workflow) =>
    getSupportedWorkflowLanes(workflow),
  );

  const lanes = configuredLanes.length ? configuredLanes : FALLBACK_KANBAN_LANES;
  const uniqueLanes = Array.from(new Set(lanes)).filter(
    (lane) => lane && lane !== Status.MOVED,
  );

  const visibleLanes = options.includeSomeday
    ? uniqueLanes
    : uniqueLanes.filter((lane) => lane !== Status.SOMEDAY);

  return options.includeUnknownLane
    ? [...visibleLanes, UNKNOWN_STATUS_LANE_ID]
    : visibleLanes;
};
