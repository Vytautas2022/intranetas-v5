import { Status } from "../types/faults";

export const WORKFLOW_STATUS_LABELS: Record<string, string> = {
  [Status.NEW]: "Naujas",
  [Status.IN_PROGRESS]: "Vykdoma",
  [Status.WAITING_DETAILS]: "Laukiama",
  [Status.FIXED]: "Atlikta",
  [Status.REJECTED]: "Atmesta",
  [Status.SOMEDAY]: "Kada nors",
  [Status.MOVED]: "Perkelta",
};

const LEGACY_STATUS_TO_ID: Record<string, Status> = {
  Naujas: Status.NEW,
  Vykdoma: Status.IN_PROGRESS,
  "Laukiama detalių": Status.WAITING_DETAILS,
  "Laukiama detaliÅ³": Status.WAITING_DETAILS,
  Laukiama: Status.WAITING_DETAILS,
  Sutvarkyta: Status.FIXED,
  Atlikta: Status.FIXED,
  Atmesta: Status.REJECTED,
  "Kada nors": Status.SOMEDAY,
  PERKELTA: Status.MOVED,
};

export const normalizeWorkflowStatusId = (
  status?: string | null,
): string => {
  if (!status) return "";
  return LEGACY_STATUS_TO_ID[status] || status;
};

export const formatWorkflowStatusLabel = (status?: string | null): string => {
  const statusId = normalizeWorkflowStatusId(status);
  return WORKFLOW_STATUS_LABELS[statusId] || statusId;
};
