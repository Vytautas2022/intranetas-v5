import type {
  PeriodicAssignmentSource,
  PeriodicAssignmentStrategy,
  PeriodicChecklistItem,
  PeriodicCriticality,
  PeriodicDestinationType,
  PeriodicTemplate,
  RecurrenceType,
} from "./periodicTemplates";
import type {
  PeriodicTaskInstance,
  PeriodicTaskTemplate,
} from "./periodicTasks";
import type { PeriodicExecutionRecord } from "./periodicHistory";
import type { Club } from "./clubs";
import type { User } from "./users";

export type PeriodicTargetType = "CLUB" | "REGION" | "GENERAL";

// STEP 1: Added "SKIPPED" — tasks skipped due to closure, holiday, or force majeure
export type PeriodicInstanceStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "OVERDUE"
  | "SKIPPED";

export type PeriodicPrioritySource =
  | "TEMPLATE"
  | "ASSET_ISSUE_TYPE"
  | "WORKFLOW_DEFAULT";
export type PeriodicSlaSource =
  | "TEMPLATE"
  | "ASSET_ISSUE_TYPE"
  | "WORKFLOW_DEFAULT";
export type PeriodicProofStatus =
  | "NOT_REQUIRED"
  | "REQUIRED"
  | "SUBMITTED"
  | "MISSING";

// STEP 5: Assignment resolution status
export type PeriodicAssignmentStatus = "ASSIGNED" | "UNASSIGNED" | "ROLE_QUEUE";

export interface PeriodicInstanceEvent {
  id: string;
  type: string;
  timestamp: number;
  user?: string;
  reason?: string;
  meta?: Record<string, any>;
}

// STEP 3: Frozen snapshot of template fields at instance creation time.
// Immutable after creation — preserves audit context even if template changes.
export interface PeriodicChecklistProgress {
  itemId: string;
  checked: boolean;
  checkedAt?: string;
  checkedBy?: string;
}

export interface PeriodicTemplateSnapshot {
  name: string;
  recurrence: RecurrenceType;
  isMandatory: boolean;
  criticality?: PeriodicCriticality;
  slaHours: number;
  proofRequired: boolean;
  destinationType: PeriodicDestinationType;
  snapshotAt: string;
  executionChecklistItems?: PeriodicChecklistItem[];
}

export interface PeriodicInstance {
  id: string;
  templateId: string;
  periodKey: string;
  occurrenceDate: string;
  visibleFrom?: number;
  dueDate?: number;
  overdueAt?: number;
  dueAt: number;
  targetType: PeriodicTargetType;
  clubId?: string;
  regionId?: string;
  workflowTypeId?: string;
  titleSnapshot: string;
  descriptionSnapshot: string;
  destinationType: PeriodicDestinationType;
  destinationWorkflowTypeId?: string;
  // STEP 2: generatedWorkflowCardId removed — workflowCardId is the single canonical FK
  workflowCardId?: string;
  generatedOrderId?: string;
  assetTypeId?: string;
  assetObjectId?: string;
  assetIssueTypeId?: string;
  orderType?: string;
  status: PeriodicInstanceStatus;
  priority: "low" | "medium" | "high" | "critical";
  prioritySource: PeriodicPrioritySource;
  slaHours: number;
  slaSource: PeriodicSlaSource;
  assigneeId?: string;
  assignmentStrategy: PeriodicAssignmentStrategy;
  assignmentSource: PeriodicAssignmentSource;
  assignmentReason: string;
  // STEP 5: Derived from assigneeId + strategy at creation time
  assignmentStatus: PeriodicAssignmentStatus;
  roleQueueId?: string;
  proofRequired: boolean;
  proofStatus: PeriodicProofStatus;
  checklistSnapshot: any[];
  sopUrlSnapshot?: string;
  supplierIdSnapshot?: string;
  estimatedBudgetSnapshot?: number;
  actualCost?: number;
  completedAt?: number;
  completedBy?: string;
  completionComment?: string;
  photoProofIds?: string[];
  requiresComment?: boolean;
  requiresPhotoProof?: boolean;
  isMandatory?: boolean;
  checklistProgress?: PeriodicChecklistProgress[];
  // STEP 4: Copied from Fault.inspection_decision on terminal sync
  inspectionDecision?: "OK_NO_ACTION" | "ACTION_NEEDED" | "EXECUTE" | "REJECT";
  cancelledAt?: number;
  cancelledBy?: string;
  cancelReason?: string;
  skippedAt?: number;
  skippedBy?: string;
  skipReason?: string;
  rescheduleCount: number;
  originalDueAt?: number;
  // STEP 6: Denormalized mirror of linked workflow card status for fast queries
  linkedCardStatus?: string;
  linkedCardUpdatedAt?: number;
  // STEP 3: Frozen template snapshot — populated at creation, never mutated
  templateSnapshot?: PeriodicTemplateSnapshot;
  history: PeriodicInstanceEvent[];
  createdAt: number;
  generatedAt?: number;
  updatedAt: number;
}

// ─── STEP 1: Status label and color helpers ────────────────────────────────

export const getPeriodicInstanceStatusLabel = (
  status: PeriodicInstanceStatus,
): string =>
  ({
    SCHEDULED: "Suplanuota",
    IN_PROGRESS: "Vykdoma",
    COMPLETED: "Atlikta",
    REJECTED: "Atmesta",
    OVERDUE: "Vėluoja",
    SKIPPED: "Praleista",
  })[status] ?? status;

export const getPeriodicInstanceStatusColor = (
  status: PeriodicInstanceStatus,
): string =>
  ({
    SCHEDULED: "text-blue-600 bg-blue-50",
    IN_PROGRESS: "text-yellow-700 bg-yellow-50",
    COMPLETED: "text-green-700 bg-green-50",
    REJECTED: "text-red-700 bg-red-50",
    OVERDUE: "text-red-700 bg-red-100",
    SKIPPED: "text-gray-600 bg-gray-100",
  })[status] ?? "text-gray-500 bg-gray-50";

// ─── Internal utilities ────────────────────────────────────────────────────

const toTimestamp = (value?: string | number): number => {
  if (!value) return Date.now();
  return typeof value === "number" ? value : new Date(value).getTime();
};

const toIsoDate = (value: number): string =>
  new Date(value).toISOString().slice(0, 10);

const getPeriodKey = (value: number): string =>
  new Date(value).toISOString().slice(0, 7);

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

const endOfPlannedWeek = (value: number): number => {
  const date = new Date(value);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  date.setHours(23, 59, 59, 999);
  return date.getTime();
};

const getVisibleFrom = (dueAt: number, visibleWeeksBeforeDue = 0): number =>
  dueAt - Math.max(0, visibleWeeksBeforeDue) * MS_PER_WEEK;

const getOverdueAt = (dueAt: number): number => dueAt + MS_PER_WEEK;

const isTemplateMandatory = (template: PeriodicTemplate): boolean =>
  template.isMandatory ?? template.type === "MANDATORY";

const resolveAssignmentStatus = (
  assigneeId: string | undefined,
  strategy: PeriodicAssignmentStrategy,
): PeriodicAssignmentStatus => {
  if (assigneeId) return "ASSIGNED";
  if (strategy === "ROLE_QUEUE") return "ROLE_QUEUE";
  return "UNASSIGNED";
};

export const resolvePeriodicDestinationType = (
  template: Pick<PeriodicTemplate, "destinationType" | "targetSubmodule">,
): PeriodicDestinationType => {
  if (template.destinationType) return template.destinationType;
  if (template.targetSubmodule === "UZSAKYMAI") return "ORDER";
  return "WORKFLOW_CARD";
};

export const resolvePeriodicAssignmentStrategy = (
  template: Pick<
    PeriodicTemplate,
    "assignmentStrategy" | "assigned_to" | "assignedTo" | "responsibleMode"
  >,
): PeriodicAssignmentStrategy => {
  if (template.assignmentStrategy) return template.assignmentStrategy;
  if (template.assigned_to || template.assignedTo) return "TEMPLATE_ASSIGNEE";
  if (template.responsibleMode === "MANUAL") return "MANUAL_UNASSIGNED";
  return "ROLE_QUEUE";
};

// ─── Factory functions ─────────────────────────────────────────────────────

// STEP 2: param renamed generatedWorkflowCardId → workflowCardId (single canonical FK)
// STEP 3: populates templateSnapshot at creation time
// STEP 5: populates assignmentStatus
export const createPeriodicInstanceFromTemplate = ({
  template,
  club,
  responsibleUser,
  dueAt,
  now = Date.now(),
  workflowCardId,
  generatedOrderId,
}: {
  template: PeriodicTemplate;
  club?: Club;
  responsibleUser?: User;
  dueAt: number;
  now?: number;
  workflowCardId?: string;
  generatedOrderId?: string;
}): PeriodicInstance => {
  const destinationType = resolvePeriodicDestinationType(template);
  const assignmentStrategy = resolvePeriodicAssignmentStrategy(template);
  const dueDate = endOfPlannedWeek(dueAt);
  const visibleFrom = getVisibleFrom(dueDate, template.visibleWeeksBeforeDue ?? 2);
  const overdueAt = getOverdueAt(dueDate);
  const assigneeId =
    template.assigned_to ||
    template.assignedTo?.id ||
    responsibleUser?.id ||
    undefined;

  return {
    id: `pi-${template.id}-${club?.id || "general"}-${getPeriodKey(dueAt)}`,
    templateId: template.id,
    periodKey: getPeriodKey(dueDate),
    occurrenceDate: toIsoDate(dueDate),
    visibleFrom,
    dueDate,
    overdueAt,
    dueAt: dueDate,
    targetType: club ? "CLUB" : "GENERAL",
    clubId: club?.id,
    regionId: club?.region,
    workflowTypeId: template.destinationWorkflowTypeId,
    titleSnapshot: template.name || template.title || "Periodinė užduotis",
    descriptionSnapshot: template.description || "",
    destinationType,
    destinationWorkflowTypeId: template.destinationWorkflowTypeId,
    workflowCardId,
    generatedOrderId,
    assetObjectId: template.equipmentId,
    assetIssueTypeId: template.issueTypeId,
    orderType: template.orderType,
    status: "SCHEDULED",
    priority: template.priority === "CRITICAL" ? "critical" : "medium",
    prioritySource: "TEMPLATE",
    slaHours: template.slaHours || 72,
    slaSource: template.slaHours ? "TEMPLATE" : "WORKFLOW_DEFAULT",
    assigneeId,
    assignmentStrategy,
    assignmentSource: template.assignmentSource || assignmentStrategy,
    assignmentReason: assigneeId
      ? "Priskirta iš periodinio šablono arba suderinamo fallback."
      : "Atsakingas asmuo nerastas, palikta nepriskirta.",
    assignmentStatus: resolveAssignmentStatus(assigneeId, assignmentStrategy),
    proofRequired: Boolean(template.proofRequired),
    proofStatus: template.proofRequired ? "REQUIRED" : "NOT_REQUIRED",
    requiresComment: Boolean(template.requiresComment),
    requiresPhotoProof: Boolean(template.requiresPhotoProof || template.proofRequired),
    isMandatory: isTemplateMandatory(template),
    checklistSnapshot: template.checklistTemplates || [],
    sopUrlSnapshot: template.sopUrl || template.sop?.url,
    estimatedBudgetSnapshot: template.estimatedBudget,
    templateSnapshot: {
      name: template.name || template.title || "Periodinė užduotis",
      recurrence: template.frequency || template.recurrence || "monthly",
      isMandatory: isTemplateMandatory(template),
      criticality: template.criticality ?? (isTemplateMandatory(template) ? "CRITICAL" : "STANDARD"),
      slaHours: template.slaHours || 72,
      proofRequired: Boolean(template.proofRequired),
      destinationType,
      snapshotAt: new Date(now).toISOString(),
      executionChecklistItems: template.executionChecklistItems?.length
        ? template.executionChecklistItems
        : undefined,
    },
    checklistProgress: template.executionChecklistItems?.map((item) => ({
      itemId: item.id,
      checked: false,
    })) ?? [],
    rescheduleCount: 0,
    history: [
      {
        id: `pie-${Date.now()}`,
        type: "PERIODIC_INSTANCE_CREATED",
        timestamp: now,
        user: "system",
        meta: { templateId: template.id, clubId: club?.id },
      },
    ],
    createdAt: now,
    generatedAt: now,
    updatedAt: now,
  };
};

export const adaptPeriodicTaskTemplateToPeriodicTemplate = (
  template: PeriodicTaskTemplate,
): PeriodicTemplate => ({
  id: template.id,
  name: template.title,
  title: template.title,
  description: template.description,
  frequency: template.recurrence,
  recurrence: template.recurrence,
  type: template.type === "INSPECTION" ? "OPTIONAL" : "MANDATORY",
  destinationType: resolvePeriodicDestinationType(template as any),
  destinationWorkflowTypeId: template.destinationWorkflowTypeId,
  assignmentStrategy: template.assigned_to
    ? "TEMPLATE_ASSIGNEE"
    : "MANUAL_UNASSIGNED",
  assignmentSource: template.assigned_to
    ? "TEMPLATE_ASSIGNEE"
    : "MANUAL_UNASSIGNED",
  visibleWeeksBeforeDue: (template as any).visibleWeeksBeforeDue ?? 0,
  requiresComment: Boolean((template as any).requiresComment),
  requiresPhotoProof: Boolean((template as any).requiresPhotoProof || (template as any).proofRequired),
  isMandatory: template.isMandatory ?? template.type !== "INSPECTION",
  assigned_to: template.assigned_to,
  priority: template.priority,
  targetMode:
    template.scope === "REGION"
      ? "REGIONS"
      : template.scope === "SELECTED"
        ? "SELECTED_CLUBS"
        : "ALL_CLUBS",
  targetClubIds: [],
  targetRegions: [],
  sopUrl: template.sopLink,
  sopRequired: Boolean(template.sopLink),
  budgetRequired: Boolean(template.plannedCost),
  estimatedBudget: template.plannedCost,
  preferredSupplierIds: template.supplierId ? [template.supplierId] : [],
  decisionChecklist: [],
  executionChecklist: [],
  checklistTemplates: template.checklistTemplates,
  isActive: template.isActive,
  createdAt: template.history?.[0]?.timestamp || Date.now(),
  updatedAt:
    template.history?.[template.history.length - 1]?.timestamp || Date.now(),
  department: template.department,
});

// STEP 1: Maps SKIPPED from legacy TaskInstanceStatus
// STEP 5: Populates assignmentStatus
export const adaptPeriodicTaskInstanceToPeriodicInstance = (
  instance: PeriodicTaskInstance,
): PeriodicInstance => {
  const dueAt = instance.dueDate;
  const canonicalDueDate = endOfPlannedWeek(dueAt);
  const completedAt =
    instance.status === "COMPLETED" ? instance.updatedAt : undefined;
  const assigneeId = instance.assignee?.id;

  return {
    id: `pi-${instance.id}`,
    templateId: instance.templateId,
    periodKey: instance.metadata?.periodKey || getPeriodKey(canonicalDueDate),
    occurrenceDate: toIsoDate(canonicalDueDate),
    visibleFrom: getVisibleFrom(canonicalDueDate, 0),
    dueDate: canonicalDueDate,
    overdueAt: getOverdueAt(canonicalDueDate),
    dueAt: canonicalDueDate,
    targetType: instance.clubId ? "CLUB" : "GENERAL",
    clubId: instance.clubId,
    workflowTypeId: undefined,
    titleSnapshot: instance.title,
    descriptionSnapshot: instance.description,
    destinationType: "WORKFLOW_CARD",
    status:
      instance.status === "COMPLETED"
        ? "COMPLETED"
        : instance.status === "OVERDUE"
          ? "OVERDUE"
          : instance.status === "IN_PROGRESS"
            ? "IN_PROGRESS"
            : instance.status === "SKIPPED"
              ? "SKIPPED"
              : "SCHEDULED",
    priority: "medium",
    prioritySource: "WORKFLOW_DEFAULT",
    slaHours: 24,
    slaSource: "WORKFLOW_DEFAULT",
    assigneeId,
    assignmentStrategy: assigneeId ? "TEMPLATE_ASSIGNEE" : "MANUAL_UNASSIGNED",
    assignmentSource: assigneeId ? "TEMPLATE_ASSIGNEE" : "MANUAL_UNASSIGNED",
    assignmentReason: assigneeId
      ? "Perkelta iš legacy PeriodicTaskInstance assignee."
      : "Legacy instance neturėjo assignee.",
    assignmentStatus: assigneeId ? "ASSIGNED" : "UNASSIGNED",
    proofRequired: false,
    proofStatus: "NOT_REQUIRED",
    requiresComment: false,
    requiresPhotoProof: false,
    isMandatory: false,
    checklistSnapshot: instance.checklists || [],
    sopUrlSnapshot: instance.sopLink,
    supplierIdSnapshot: instance.supplier,
    actualCost: instance.actualCost,
    completedAt,
    completedBy: completedAt ? instance.updatedBy : undefined,
    rescheduleCount: 0,
    history: (instance.history || []).map((event: any, index) => ({
      id: event.id || `pie-${instance.id}-${index}`,
      type: event.type || event.action || "LEGACY_EVENT",
      timestamp: event.timestamp || event.date || instance.updatedAt,
      user: event.user,
      meta: event.meta,
    })),
    createdAt: instance.updatedAt,
    updatedAt: instance.updatedAt,
  };
};

export const adaptPeriodicHistoryToPeriodicInstanceEvents = (
  history: PeriodicExecutionRecord[],
): PeriodicInstanceEvent[] =>
  history.map((record) => ({
    id: `pie-${record.id}`,
    type: `HISTORY_${record.status}`,
    timestamp: toTimestamp(record.completedAt || record.scheduledDate),
    user: record.completedBy,
    reason: record.decisionReason || record.rescheduleReason,
    meta: {
      templateId: record.templateId,
      generatedTaskId: record.generatedTaskId,
      clubId: record.clubId,
      decision: record.decision,
      actualCost: record.actualCost,
    },
  }));

export interface PeriodicVirtualOccurrence {
  occurrenceId: string;
  taskId: string;
  objectId?: string;
  title: string;
  plannedDate: string;
  status?:
    | "planned"
    | "completed"
    | "completed_on_time"
    | "completed_late"
    | "overdue"
    | "rejected";
  completedAt?: number;
  completedBy?: string;
  cancelledAt?: number;
  cancelledBy?: string;
  cancelReason?: string;
}

// STEP 1: "rejected" → REJECTED (was falling through to SCHEDULED before)
const mapVirtualOccurrenceStatus = (
  status: PeriodicVirtualOccurrence["status"],
): PeriodicInstanceStatus => {
  if (
    status === "completed" ||
    status === "completed_on_time" ||
    status === "completed_late"
  )
    return "COMPLETED";
  if (status === "overdue") return "OVERDUE";
  if (status === "rejected") return "REJECTED";
  return "SCHEDULED";
};

// STEP 2: removed generatedWorkflowCardId
// STEP 5: populates assignmentStatus
export const adaptVirtualOccurrenceToPeriodicInstancePreview = (
  occurrence: PeriodicVirtualOccurrence,
  template?: PeriodicTemplate,
): PeriodicInstance => {
  const dueAt = endOfPlannedWeek(toTimestamp(occurrence.plannedDate));
  const assignmentStrategy = template
    ? resolvePeriodicAssignmentStrategy(template)
    : "MANUAL_UNASSIGNED";
  const assigneeId =
    template?.assigned_to || template?.assignedTo?.id || undefined;

  return {
    id: `pi-preview-${occurrence.occurrenceId}`,
    templateId: template?.id || occurrence.taskId,
    periodKey: getPeriodKey(dueAt),
    occurrenceDate: toIsoDate(dueAt),
    visibleFrom: getVisibleFrom(dueAt, template?.visibleWeeksBeforeDue ?? 0),
    dueDate: dueAt,
    overdueAt: getOverdueAt(dueAt),
    dueAt,
    targetType: occurrence.objectId ? "CLUB" : "GENERAL",
    clubId: occurrence.objectId,
    regionId: undefined,
    workflowTypeId: template?.destinationWorkflowTypeId,
    titleSnapshot: occurrence.title || template?.name || template?.title || "Periodinė užduotis",
    descriptionSnapshot: template?.description || "",
    destinationType: template ? resolvePeriodicDestinationType(template) : "WORKFLOW_CARD",
    destinationWorkflowTypeId: template?.destinationWorkflowTypeId,
    workflowCardId: undefined,
    generatedOrderId: undefined,
    assetObjectId: template?.equipmentId,
    assetIssueTypeId: template?.issueTypeId,
    orderType: template?.orderType,
    status: mapVirtualOccurrenceStatus(occurrence.status),
    priority: template?.priority === "CRITICAL" ? "critical" : "medium",
    prioritySource: "TEMPLATE",
    slaHours: template?.slaHours || 72,
    slaSource: template?.slaHours ? "TEMPLATE" : "WORKFLOW_DEFAULT",
    assigneeId,
    assignmentStrategy,
    assignmentSource: template?.assignmentSource || assignmentStrategy,
    assignmentReason: assigneeId
      ? "Preview priskirtas pagal periodinio šablono duomenis."
      : "Preview neturi priskirto atsakingo asmens.",
    assignmentStatus: resolveAssignmentStatus(assigneeId, assignmentStrategy),
    proofRequired: Boolean(template?.proofRequired),
    proofStatus: template?.proofRequired ? "REQUIRED" : "NOT_REQUIRED",
    requiresComment: Boolean(template?.requiresComment),
    requiresPhotoProof: Boolean(template?.requiresPhotoProof || template?.proofRequired),
    isMandatory: template ? isTemplateMandatory(template) : false,
    checklistSnapshot: template?.checklistTemplates || [],
    sopUrlSnapshot: template?.sopUrl || template?.sop?.url,
    estimatedBudgetSnapshot: template?.estimatedBudget,
    completedAt: occurrence.completedAt,
    completedBy: occurrence.completedBy,
    cancelledAt: occurrence.cancelledAt,
    cancelledBy: occurrence.cancelledBy,
    cancelReason: occurrence.cancelReason,
    rescheduleCount: 0,
    history: [
      {
        id: `pie-preview-${occurrence.occurrenceId}`,
        type: "PERIODIC_INSTANCE_PREVIEW_CREATED",
        timestamp: Date.now(),
        user: "system",
        meta: {
          occurrenceId: occurrence.occurrenceId,
          taskId: occurrence.taskId,
          templateId: template?.id,
        },
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// STEP 2: removed generatedWorkflowCardId spread
// STEP 6: sets linkedCardStatus/linkedCardUpdatedAt when card is linked
export const linkPeriodicInstanceOutput = (
  instance: PeriodicInstance,
  output: { workflowCardId?: string; orderId?: string },
): PeriodicInstance => ({
  ...instance,
  workflowCardId: output.workflowCardId || instance.workflowCardId,
  generatedOrderId: output.orderId || instance.generatedOrderId,
  linkedCardStatus: output.workflowCardId ? "new" : instance.linkedCardStatus,
  linkedCardUpdatedAt: output.workflowCardId ? Date.now() : instance.linkedCardUpdatedAt,
  status: "IN_PROGRESS",
  updatedAt: Date.now(),
});

// STEP 1: maps SKIPPED back to legacy "SKIPPED"; REJECTED → "SKIPPED" (closest legacy equivalent)
export const adaptPeriodicInstanceToPeriodicTaskInstance = (
  instance: PeriodicInstance,
): PeriodicTaskInstance => ({
  id: instance.id.replace(/^pi-/, ""),
  templateId: instance.templateId,
  sourceType: "PERIODIC",
  title: instance.titleSnapshot,
  description: instance.descriptionSnapshot,
  status:
    instance.status === "COMPLETED"
      ? "COMPLETED"
      : instance.status === "OVERDUE"
        ? "OVERDUE"
        : instance.status === "IN_PROGRESS"
          ? "IN_PROGRESS"
          : instance.status === "SKIPPED"
            ? "SKIPPED"
            : instance.status === "REJECTED"
              ? "SKIPPED"
              : "PENDING",
  dueDate: instance.dueAt,
  clubId: instance.clubId || "",
  clubName: "",
  assignee: instance.assigneeId
    ? { id: instance.assigneeId, name: instance.assigneeId, role: "" }
    : undefined,
  actualCost: instance.actualCost,
  comments: [],
  history: instance.history.map((event) => ({
    id: event.id,
    type: event.type,
    user: event.user || "system",
    date: event.timestamp,
    meta: event.meta,
  })) as any,
  checklists: instance.checklistSnapshot as any,
  updatedAt: instance.updatedAt,
  updatedBy: instance.completedBy || "system",
  metadata: { periodKey: instance.periodKey },
});

export type PeriodicInstanceRemovalAction = "DELETE_ALLOWED" | "ARCHIVE_ONLY";

// STEP 2: removed generatedWorkflowCardId from Pick and from hasExecution check
export const getPeriodicInstanceRemovalAction = (
  instance: Pick<
    PeriodicInstance,
    "history" | "workflowCardId" | "generatedOrderId"
  >,
): PeriodicInstanceRemovalAction => {
  const hasHistory = Boolean(instance.history?.length);
  const hasExecution =
    Boolean(instance.workflowCardId) ||
    Boolean(instance.generatedOrderId);

  return hasHistory || hasExecution ? "ARCHIVE_ONLY" : "DELETE_ALLOWED";
};

// ─── Criticality-aware permission helpers ─────────────────────────────────

export interface PeriodicPermissionResult {
  allowed: boolean;
  reason?: string;
}

const resolveInstanceCriticality = (instance: PeriodicInstance): PeriodicCriticality =>
  instance.templateSnapshot?.criticality ??
  (instance.isMandatory ? "CRITICAL" : "STANDARD");

export const canCompletePeriodicInstance = (
  instance: PeriodicInstance,
): PeriodicPermissionResult => {
  if (instance.status === "SKIPPED" || instance.status === "REJECTED") {
    return { allowed: false, reason: "Praleista arba atmesta užduotis negali būti pažymėta kaip atlikta." };
  }
  const proofRequired =
    instance.templateSnapshot?.proofRequired === true ||
    instance.requiresPhotoProof === true;
  if (proofRequired && (!instance.photoProofIds || instance.photoProofIds.length === 0)) {
    return { allowed: false, reason: "Reikalingas foto įrodymas" };
  }
  if (instance.requiresComment && !instance.completionComment) {
    return { allowed: false, reason: "Privaloma įvesti komentarą prieš pažymint kaip atlikta." };
  }
  // Checklist: all required items must be checked
  const checklistItems = instance.templateSnapshot?.executionChecklistItems;
  if (checklistItems?.length) {
    const progress = instance.checklistProgress ?? [];
    const allRequired = checklistItems
      .filter((item) => item.required)
      .every((item) => progress.find((p) => p.itemId === item.id)?.checked === true);
    if (!allRequired) {
      return { allowed: false, reason: "Užbaikite visus privalomus žingsnius prieš pažymint kaip atlikta." };
    }
  }
  return { allowed: true };
};

export const canSkipPeriodicInstance = (
  instance: PeriodicInstance,
  skipReason?: string,
): PeriodicPermissionResult => {
  const crit = resolveInstanceCriticality(instance);
  if (crit === "CRITICAL") {
    return { allowed: false, reason: "Kritinė užduotis negali būti praleista." };
  }
  if (crit === "IMPORTANT" && !skipReason?.trim()) {
    return { allowed: false, reason: "Svarbi užduotis: privaloma nurodyti praleidimo priežastį." };
  }
  return { allowed: true };
};

export const canRejectPeriodicInstance = (
  instance: PeriodicInstance,
): PeriodicPermissionResult => {
  const crit = resolveInstanceCriticality(instance);
  if (crit === "CRITICAL") {
    return { allowed: false, reason: "Kritinė užduotis negali būti atmesta." };
  }
  if (crit === "IMPORTANT") {
    return { allowed: false, reason: "Svarbi užduotis negali būti atmesta." };
  }
  return { allowed: true };
};

const addByRecurrence = (date: Date, recurrence?: string): Date => {
  const next = new Date(date);
  if (recurrence === "daily") next.setDate(next.getDate() + 1);
  else if (recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (recurrence === "quarterly") next.setMonth(next.getMonth() + 3);
  else if (recurrence === "6_months") next.setMonth(next.getMonth() + 6);
  else if (recurrence === "yearly") next.setFullYear(next.getFullYear() + 1);
  else next.setMonth(next.getMonth() + 1);
  return next;
};

const isWorkflowDone = (status: unknown): boolean => {
  const normalized = String(status || "").toLowerCase();
  return ["done", "fixed", "closed", "completed", "atlikta"].some((value) =>
    normalized.includes(value),
  );
};

const isWorkflowRejected = (status: unknown): boolean => {
  const normalized = String(status || "").toLowerCase();
  return ["rejected", "atmesta"].some((value) => normalized.includes(value));
};

const getTemplateTargetClubs = (
  template: PeriodicTemplate,
  allClubs: Club[],
): Club[] => {
  if (template.targetMode === "SELECTED_CLUBS" && template.targetClubIds?.length) {
    return allClubs.filter((club) => template.targetClubIds.includes(club.id));
  }
  if (template.targetMode === "REGIONS" && template.targetRegions?.length) {
    return allClubs.filter((club) =>
      template.targetRegions.includes(club.region || ""),
    );
  }
  return allClubs.filter((club) => club.is_active !== false);
};

const getNextDueSeedFromCompletedHistory = (
  template: PeriodicTemplate,
  club: Club,
  history: PeriodicExecutionRecord[],
): Date | null => {
  const records = history
    .filter(
      (record) => record.templateId === template.id && record.clubId === club.id,
    )
    .sort(
      (a, b) =>
        toTimestamp(b.completedAt || b.scheduledDate) -
        toTimestamp(a.completedAt || a.scheduledDate),
    );

  if (!records.length) {
    const startValue = template.startDate || template.createdAt || Date.now();
    return new Date(startValue);
  }

  const latest = records[0];
  if (latest.status !== "COMPLETED" || !latest.completedAt) return null;

  return addByRecurrence(
    new Date(latest.completedAt),
    template.frequency || template.recurrence,
  );
};

// STEP 2: removed all generatedWorkflowCardId assignments
// STEP 4: copies inspection_decision from card on terminal status
// STEP 6: sets linkedCardStatus/linkedCardUpdatedAt on every sync
export const syncPeriodicInstanceFromWorkflowCard = (
  instance: PeriodicInstance,
  card?: any,
  now = Date.now(),
): PeriodicInstance => {
  if (!card) {
    return now >= (instance.overdueAt || instance.dueAt + MS_PER_WEEK)
      ? { ...instance, status: "OVERDUE", updatedAt: now }
      : instance;
  }

  const cardUpdatedAt = toTimestamp(card.updatedAt);
  const baseCardSync = {
    workflowCardId: card.id,
    linkedCardStatus: card.status as string,
    linkedCardUpdatedAt: cardUpdatedAt,
  };

  if (isWorkflowDone(card.status)) {
    const completedAt = toTimestamp(card.completedAt || card.closedAt || card.updatedAt);
    return {
      ...instance,
      ...baseCardSync,
      status: "COMPLETED",
      completedAt,
      completedBy: card.completedBy || card.updatedBy || card.assigned_to,
      inspectionDecision: card.inspection_decision || instance.inspectionDecision,
      updatedAt: completedAt,
    };
  }

  if (!instance.isMandatory && isWorkflowRejected(card.status)) {
    return {
      ...instance,
      ...baseCardSync,
      status: "REJECTED",
      inspectionDecision: card.inspection_decision || instance.inspectionDecision,
      updatedAt: cardUpdatedAt,
    };
  }

  return {
    ...instance,
    ...baseCardSync,
    status:
      now >= (instance.overdueAt || instance.dueAt + MS_PER_WEEK)
        ? "OVERDUE"
        : "IN_PROGRESS",
    updatedAt: cardUpdatedAt,
  };
};

// STEP 1: SKIPPED added to status mapping from PeriodicExecutionRecord
// STEP 2: generatedWorkflowCardId replaced with workflowCardId throughout
export const buildPeriodicInstancesForRange = ({
  templates,
  clubs,
  history = [],
  workflowCards = [],
  rangeStart,
  rangeEnd,
  now = Date.now(),
}: {
  templates: PeriodicTemplate[];
  clubs: Club[];
  history?: PeriodicExecutionRecord[];
  workflowCards?: any[];
  rangeStart: Date;
  rangeEnd: Date;
  now?: number;
}): PeriodicInstance[] => {
  const instances = new Map<string, PeriodicInstance>();

  templates
    .filter((template) => template.isActive !== false && !template.archivedAt)
    .forEach((template) => {
      const recurrence = template.frequency || template.recurrence || "monthly";
      getTemplateTargetClubs(template, clubs).forEach((club) => {
        let cursor = getNextDueSeedFromCompletedHistory(template, club, history);
        if (!cursor) return;
        const hasHistory = history.some(
          (record) => record.templateId === template.id && record.clubId === club.id,
        );

        if (!hasHistory) {
          let guard = 0;
          while (cursor < rangeStart && guard < 500) {
            guard += 1;
            cursor = addByRecurrence(cursor, recurrence);
          }
        }

        if (cursor >= rangeStart && cursor <= rangeEnd) {
          const instance = createPeriodicInstanceFromTemplate({
            template,
            club,
            dueAt: cursor.getTime(),
            now,
          });
          if ((instance.visibleFrom || instance.dueAt) <= now) {
            instances.set(instance.id, instance);
          }
        }
      });
    });

  history.forEach((record) => {
    const template = templates.find((item) => item.id === record.templateId);
    const club = clubs.find((item) => item.id === record.clubId) || {
      id: record.clubId,
      name: record.clubName,
      region: "",
    };
    const scheduledAt = toTimestamp(record.scheduledDate);
    if (scheduledAt < rangeStart.getTime() || scheduledAt > rangeEnd.getTime()) return;

    const instance = createPeriodicInstanceFromTemplate({
      template:
        template ||
        ({
          id: record.templateId,
          name: record.templateTitle,
          title: record.templateTitle,
          description: "",
          frequency: "monthly",
          type: "MANDATORY",
          targetMode: "SELECTED_CLUBS",
          targetClubIds: [record.clubId],
          targetRegions: [],
          sopRequired: false,
          budgetRequired: false,
          preferredSupplierIds: [],
          decisionChecklist: [],
          executionChecklist: [],
          isActive: true,
          createdAt: scheduledAt,
          updatedAt: scheduledAt,
        } as PeriodicTemplate),
      club,
      dueAt: scheduledAt,
      now,
      workflowCardId: record.generatedTaskId,
    });

    const status: PeriodicInstanceStatus =
      record.status === "COMPLETED"
        ? "COMPLETED"
        : record.status === "OVERDUE"
          ? "OVERDUE"
          : record.status === "SKIPPED"
            ? "SKIPPED"
            : "SCHEDULED";

    instances.set(instance.id, {
      ...instance,
      status,
      workflowCardId: record.generatedTaskId,
      linkedCardStatus: record.generatedTaskId ? undefined : undefined,
      completedAt:
        record.status === "COMPLETED" ? toTimestamp(record.completedAt) : undefined,
      completedBy: record.completedBy,
      actualCost: record.actualCost,
      history: adaptPeriodicHistoryToPeriodicInstanceEvents([record]),
      updatedAt: toTimestamp(record.completedAt || record.scheduledDate),
    });
  });

  workflowCards.forEach((card) => {
    const templateId = (card as any).periodicTemplateId || (card as any).template_id;
    if (!templateId) return;
    const dueAt = toTimestamp((card as any).periodicDueDate || (card as any).due_date || card.createdAt);
    if (dueAt < rangeStart.getTime() || dueAt > rangeEnd.getTime()) return;

    const template = templates.find((item) => item.id === templateId);
    const club = clubs.find((item) => item.id === card.clubId);
    if (!template || !club) return;

    const base = createPeriodicInstanceFromTemplate({
      template,
      club,
      dueAt,
      now,
      workflowCardId: card.id,
    });
    instances.set(base.id, syncPeriodicInstanceFromWorkflowCard(base, card, now));
  });

  return Array.from(instances.values()).sort((a, b) => a.dueAt - b.dueAt);
};

// ─── Migration / backfill utilities (called from mockDbHydration) ──────────

// STEP 2: One-time migration for any localStorage instances that still carry
// the old generatedWorkflowCardId field. Safe to call on already-migrated records.
export const migrateInstanceWorkflowCardId = (instance: any): PeriodicInstance => {
  const { generatedWorkflowCardId, ...rest } = instance as any;
  return {
    ...rest,
    workflowCardId: rest.workflowCardId ?? generatedWorkflowCardId,
  } as PeriodicInstance;
};

// STEP 5 + 6: Backfills assignmentStatus and linkedCardStatus for instances
// loaded from localStorage that predate these fields.
export const backfillPeriodicInstanceFields = (
  instance: PeriodicInstance,
  workflowCards: any[] = [],
): PeriodicInstance => {
  const assignmentStatus: PeriodicAssignmentStatus =
    instance.assignmentStatus ??
    resolveAssignmentStatus(instance.assigneeId, instance.assignmentStrategy);

  let linkedCardStatus = instance.linkedCardStatus;
  let linkedCardUpdatedAt = instance.linkedCardUpdatedAt;
  if (instance.workflowCardId && !linkedCardStatus) {
    const card = workflowCards.find((c) => c.id === instance.workflowCardId);
    if (card) {
      linkedCardStatus = card.status as string;
      linkedCardUpdatedAt = toTimestamp(card.updatedAt);
    }
  }

  return { ...instance, assignmentStatus, linkedCardStatus, linkedCardUpdatedAt };
};
