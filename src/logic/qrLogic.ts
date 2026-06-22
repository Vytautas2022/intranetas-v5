import { Fault, Status } from '../types/faults';
import { buildMergedFault } from './faultMergeLogic';
import { clubs } from '../mock-db/clubs';
import { assetObjects as allAssetObjects } from '../mock-db/assetObjects';
import { generateUniqueId } from './idLogic';
import { getFaultEquipmentId } from './equipmentFaultIdentity';
import { getIssueTypesForAssetType } from '../mock-db/assetIssueTypes';
import type { AssetIssueType } from '../mock-db/assetIssueTypes';
import { getFacilityAssetObjectIdFromLegacy, getFaultFacilityAssetObjectId } from './facilityFaultIdentity';
import type { WorkflowObjectType, WorkflowType } from '../mock-db/workflowTypes';
import { buildAssetWorkflowFault } from './assetFaultRegistrationLogic';

export interface QrReportInput {
  equipment_id?: string;
  location_id?: string;
  comment: string;
  issue_type_id?: string;
  media?: { type: "image" | "video"; url: string; name: string }[];
}

export interface QrReportResult {
  success: boolean;
  message: string;
  existingTask?: Fault;
  newTask?: Fault;
}

const activeQrStatuses = [Status.NEW, Status.IN_PROGRESS, Status.WAITING_DETAILS];

const priorityRank: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const getQrObjectType = (input: QrReportInput): WorkflowObjectType => {
  if (input.equipment_id) return "EQUIPMENT";
  if (input.location_id) return "FACILITY";
  return "GENERIC";
};

const isWorkflowEnabled = (workflow: WorkflowType): boolean =>
  Boolean(workflow.active ?? workflow.enabled) && !workflow.archivedAt;

export const getQrWorkflow = (
  input: QrReportInput,
  workflowTypes: WorkflowType[],
): WorkflowType | undefined => {
  const objectType = getQrObjectType(input);
  return workflowTypes.find(
    (workflow) =>
      isWorkflowEnabled(workflow) &&
      workflow.objectType === objectType &&
      workflow.qrMode !== "OFF",
  );
};

const isSameWorkflow = (task: Fault, workflow: WorkflowType): boolean =>
  !task.workflowTypeId || task.workflowTypeId === workflow.id;

export const findActiveQrAssetTask = (
  allTasks: Fault[],
  input: QrReportInput,
  workflow: WorkflowType,
): Fault | undefined => {
  if (workflow.qrMode !== "ASSET_BASED") return undefined;

  if (workflow.objectType === "EQUIPMENT" && input.equipment_id) {
    return allTasks.find(
      (task) =>
        task.entityType === "fault" &&
        isSameWorkflow(task, workflow) &&
        getFaultEquipmentId(task) === input.equipment_id &&
        activeQrStatuses.includes(task.status as Status),
    );
  }

  if (workflow.objectType === "FACILITY" && input.location_id) {
    const assetObjectId = getFacilityAssetObjectIdFromLegacy(input.location_id);
    return allTasks.find(
      (task) =>
        task.entityType === "fault" &&
        isSameWorkflow(task, workflow) &&
        getFaultFacilityAssetObjectId(task) === assetObjectId &&
        activeQrStatuses.includes(task.status as Status),
    );
  }

  return undefined;
};

const resolveQrIssueType = (assetTypeId: string, issueTypeId?: string): AssetIssueType | null => {
  const issueTypes = getIssueTypesForAssetType(assetTypeId);
  if (issueTypeId) {
    const found = issueTypes.find((i) => i.legacyId === issueTypeId);
    if (found) return found;
  }
  const defaultType = issueTypes.find((i) => i.isDefault);
  if (defaultType) return defaultType;
  return (
    [...issueTypes].sort(
      (a, b) => (priorityRank[b.priority] ?? 0) - (priorityRank[a.priority] ?? 0),
    )[0] ?? null
  );
};

export function handleQrReport(
  input: QrReportInput,
  allTasks: Fault[],
  currentUser: { name: string; id: string },
  workflowTypes: WorkflowType[],
  getDefaultAssignee?: (clubId: string) => { id: string; name: string; role: string } | undefined,
): QrReportResult {
  const now = Date.now();

  const workflow = getQrWorkflow(input, workflowTypes);

  if (!workflow || workflow.qrMode === "OFF") {
    return { success: false, message: "QR registracija šiam workflow neleidžiama." };
  }

  if (workflow.objectType === "ORDER") {
    return { success: false, message: "Užsakymų QR registracija MVP versijoje neleidžiama." };
  }

  // 1. Deduplication (QR-specific)
  const existingTask = findActiveQrAssetTask(allTasks, input, workflow);

  if (existingTask) {
    const merged = buildMergedFault({
      existingFault: existingTask,
      author: currentUser.name,
      comment: input.comment,
      media: input.media ?? [],
      source: "QR",
    });
    return {
      success: true,
      message: "Problema jau užregistruota. Jūsų pranešimas pridėtas.",
      existingTask: { ...merged, workflowTypeId: existingTask.workflowTypeId || workflow.id },
    };
  }

  // 2. ASSET_BASED: resolve AssetObject
  if (workflow.qrMode !== "ASSET_BASED") {
    return { success: false, message: "QR registracija šiam workflow neleidžiama." };
  }

  const rawLegacyId = input.equipment_id || input.location_id;
  if (!rawLegacyId) {
    return { success: false, message: "Nerastas objektas pagal nurodytą ID." };
  }

  const assetTypeId =
    workflow.assetTypeId ||
    (workflow.objectType === "EQUIPMENT" ? "asset-type-equipment" : "asset-type-facility");

  const assetObject = allAssetObjects.find(
    (o) =>
      o.assetTypeId === assetTypeId &&
      typeof o.metadata?.legacyId === "string" &&
      o.metadata.legacyId === rawLegacyId,
  );

  if (!assetObject) {
    return { success: false, message: "Nerastas objektas pagal nurodytą ID." };
  }

  // 3. Resolve AssetIssueType (same layer as manual registration)
  const assetIssueType = resolveQrIssueType(assetTypeId, input.issue_type_id);
  if (!assetIssueType) {
    return { success: false, message: "Nerastas aktyvus gedimo tipas QR registracijai." };
  }

  // 4. Resolve default assignee (same logic as manual registration)
  const defaultAssignee =
    assetObject.clubId && getDefaultAssignee
      ? getDefaultAssignee(assetObject.clubId)
      : undefined;

  // 5. Build fault using shared builder — same as manual registration path
  const baseTask = buildAssetWorkflowFault({
    assetObject,
    issueType: assetIssueType,
    workflow,
    description: input.comment,
    attachments: input.media ?? [],
    clubs,
    defaultAssignee,
    authorName: currentUser.name,
    source: "QR",
  });

  const newTask: Fault = {
    ...baseTask,
    location_id: input.location_id,
    repeat_count: 0,
    history: [
      ...(baseTask.history || []),
      {
        id: generateUniqueId("h"),
        timestamp: now,
        user: "Anonimas",
        actionType: "CREATED_VIA_QR",
      },
    ],
  };

  return {
    success: true,
    message: "Pranešimas sėkmingai užregistruotas.",
    newTask,
  };
}
