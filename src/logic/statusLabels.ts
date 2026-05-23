import {
  getWorkflowStatusLabel,
  normalizeWorkflowStatusId as normalizeStatusId,
} from "./workflowStatusRegistry";

export const normalizeWorkflowStatusId = (
  status?: string | null,
): string => normalizeStatusId(status);

export const formatWorkflowStatusLabel = (status?: string | null): string =>
  getWorkflowStatusLabel(status);