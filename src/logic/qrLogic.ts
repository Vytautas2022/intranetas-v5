import { Fault, Status, FaultComment } from '../types/faults';
import { clubs } from '../mock-db/clubs';
import {
  getEquipmentAssetObjects,
  getFacilityAssetObjects,
} from '../mock-db/assetObjects';
import { generateUniqueId, generateId } from './idLogic';
import { getEquipmentIdentityFields, getFaultEquipmentId } from './equipmentFaultIdentity';
import {
  getDefaultEquipmentIssueTypeForQr,
  getDefaultFacilityIssueTypeForQr,
} from './equipmentIssueTypeLogic';
import {
  getFacilityAssetObjectIdFromLegacy,
  getFaultFacilityAssetObjectId,
} from './facilityFaultIdentity';
import { getSlaDeadline } from './slaEngine';
import type { WorkflowObjectType, WorkflowType } from '../mock-db/workflowTypes';

const adminEquipment = getEquipmentAssetObjects();
const facilityObjects = getFacilityAssetObjects();

export interface QrReportInput {
  equipment_id?: string;
  location_id?: string;
  comment: string;
}

export interface QrReportResult {
  success: boolean;
  message: string;
  existingTask?: Fault;
  newTask?: Fault;
}

const activeQrStatuses = [Status.NEW, Status.IN_PROGRESS, Status.WAITING_DETAILS];

const getQrObjectType = (input: QrReportInput): WorkflowObjectType => {
  if (input.equipment_id) return "EQUIPMENT";
  if (input.location_id) return "FACILITY";
  return "GENERIC";
};

const isWorkflowEnabled = (workflow: WorkflowType): boolean =>
  Boolean(workflow.active ?? workflow.enabled);

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

const getCompatibilityTaskType = (workflow: WorkflowType): string => {
  if (workflow.objectType === "EQUIPMENT") return "EQUIPMENT_FAULT";
  if (workflow.objectType === "FACILITY") return "FACILITY_FAULT";
  if (workflow.objectType === "ORDER") return "ORDER";
  return workflow.id;
};

export function handleQrReport(
  input: QrReportInput,
  allTasks: Fault[],
  currentUser: { name: string; id: string },
  workflowTypes: WorkflowType[],
): QrReportResult {
  const now = Date.now();

  const workflow = getQrWorkflow(input, workflowTypes);

  if (!workflow || workflow.qrMode === "OFF") {
    return {
      success: false,
      message: "QR registracija šiam workflow neleidžiama.",
    };
  }

  if (workflow.objectType === "ORDER") {
    return {
      success: false,
      message: "Užsakymų QR registracija MVP versijoje neleidžiama.",
    };
  }

  // 1. Asset deduplication
  const existingTask = findActiveQrAssetTask(allTasks, input, workflow);

  if (existingTask) {
    // Add comment to existing task
    const newComment: FaultComment = {
      id: generateUniqueId('c'),
      text: input.comment || "Pakartotinai užregistruota per QR",
      author: currentUser.name,
      createdAt: now,
      mentions: [],
      edited: false,
      history: [],
      deleted: false,
      source: "QR"
    };

    const updatedTask: Fault = {
      ...existingTask,
      workflowTypeId: existingTask.workflowTypeId || workflow.id,
      comments: [...existingTask.comments, newComment],
      repeat_count: (existingTask.repeat_count || 0) + 1,
      updatedAt: now,
      updatedBy: currentUser.name
    };

    return {
      success: true,
      message: "Problema jau užregistruota. Jūsų pranešimas pridėtas.",
      existingTask: updatedTask
    };
  }

  // 2. Create new task
  let clubId = '';
  let title = '';
  const compatibilityTaskType = getCompatibilityTaskType(workflow);

  if (
    workflow.qrMode === "ASSET_BASED" &&
    workflow.objectType === "EQUIPMENT" &&
    input.equipment_id
  ) {
    const adminEq = adminEquipment.find(e => e.id === input.equipment_id);
    let eq: any = null;
    if (adminEq) {
      eq = {
        id: adminEq.id,
        name: adminEq.name,
        number: adminEq.number,
        clubId: adminEq.club_id
      };
    }

    if (eq) {
      clubId = eq.clubId;
      title = `${eq.name} (${eq.number})`;
    }
  } else if (
    workflow.qrMode === "ASSET_BASED" &&
    workflow.objectType === "FACILITY" &&
    input.location_id
  ) {
    const loc = facilityObjects.find(l => l.id === input.location_id);
    if (loc) {
      clubId = loc.clubId || loc.club_id || '';
      title = loc.name;
    }
  } else if (workflow.qrMode === "GENERIC") {
    title = workflow.name || 'QR PraneÅ¡imas';
  }

  if (workflow.qrMode === "ASSET_BASED" && !clubId) {
    return { success: false, message: "Nerastas objektas pagal nurodytą ID." };
  }

  const club = clubs.find(c => c.id === clubId);
  const clubName = club ? club.name : clubId;
  const assetIssueType =
    workflow.qrMode === "ASSET_BASED" && workflow.objectType === "EQUIPMENT"
      ? getDefaultEquipmentIssueTypeForQr()
      : workflow.qrMode === "ASSET_BASED" && workflow.objectType === "FACILITY"
        ? getDefaultFacilityIssueTypeForQr()
        : null;

  if (
    workflow.qrMode === "ASSET_BASED" &&
    workflow.objectType === "EQUIPMENT" &&
    !assetIssueType
  ) {
    return {
      success: false,
      message: "Nerastas aktyvus treniruoklio gedimo tipas QR registracijai.",
    };
  }

  if (
    workflow.qrMode === "ASSET_BASED" &&
    workflow.objectType === "FACILITY" &&
    !assetIssueType
  ) {
    return {
      success: false,
      message: "Nerastas aktyvus patalpų gedimo tipas QR registracijai.",
    };
  }

  const slaHours = assetIssueType?.sla_hours ?? 24;
  const priority = assetIssueType?.priority ?? 'medium';
  const facilityAssetObjectId =
    workflow.objectType === "FACILITY"
      ? getFacilityAssetObjectIdFromLegacy(input.location_id)
      : undefined;

  const newTask: Fault = {
    id: generateUniqueId('f'),
    title: title || 'QR Pranešimas',
    description: input.comment,
    clubId,
    clubName,
    status: Status.NEW,
    type: compatibilityTaskType,
    entityType: 'fault',
    workflowTypeId: workflow.id,
    category: compatibilityTaskType,
    createdAt: now,
    updatedAt: now,
    assigneeId: '',
    assigneeName: 'Nepriskirta',
    priority,
    slaHours,
    slaDeadline: getSlaDeadline({ createdAt: now, slaHours }),
    assignedTo: 'Nepriskirta',
    comments: [],
    media: [],
    watchers: [],
    rejected: false,
    rejectReason: '',
    updatedBy: currentUser.name,
    code: generateId(),
    ...getEquipmentIdentityFields(input.equipment_id),
    assetObjectId: facilityAssetObjectId,
    issue_type_id: assetIssueType?.id,
    typeId: assetIssueType?.id,
    location_id: input.location_id,
    repeat_count: 0,
    history: [
      {
        id: generateUniqueId('h'),
        timestamp: now,
        user: 'Anonimas',
        actionType: 'CREATED_VIA_QR'
      }
    ],
    source: 'QR'
  };

  return {
    success: true,
    message: "Pranešimas sėkmingai užregistruotas.",
    newTask
  };
}
