// SEED DATA FROZEN — DO NOT MODIFY (beta v1.0)
import type { ChecklistTemplate } from "../types/checklists";

export type PeriodicTemplateType = "MANDATORY" | "OPTIONAL";
export type PeriodicCriticality = "CRITICAL" | "IMPORTANT" | "STANDARD";
export type PeriodicDestinationType = "WORKFLOW_CARD" | "ORDER";
export type PeriodicAssignmentStrategy =
  | "TEMPLATE_ASSIGNEE"
  | "WORKFLOW_OWNER"
  | "CLUB_OWNER"
  | "REGION_OWNER"
  | "ROLE_QUEUE"
  | "MANUAL_UNASSIGNED";
export type PeriodicAssignmentSource = PeriodicAssignmentStrategy;
export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "6_months"
  | "yearly"
  | "custom_days"
  | "custom_frequency";

export interface PeriodicChecklistItem {
  id: string;
  order: number;
  text: string;
  required: boolean;
}
export type ResponsibleMode = "CLUB_COORDINATOR" | "OPS" | "MANUAL";

export interface PeriodicTemplate {
  id: string;
  name: string; // From prompt: taskTemplate.name
  title?: string; // Compatibility
  description: string;
  frequency: RecurrenceType; // From prompt: taskTemplate.frequency
  recurrence?: RecurrenceType; // Compatibility
  type: PeriodicTemplateType;
  destinationType?: PeriodicDestinationType;
  destinationWorkflowTypeId?: string;
  assignmentStrategy?: PeriodicAssignmentStrategy;
  assignmentSource?: PeriodicAssignmentSource;
  visibleWeeksBeforeDue: number;
  customFrequencyValue?: number;
  customFrequencyUnit?: "days" | "weeks" | "months";
  executionChecklistItems?: PeriodicChecklistItem[];
  requiresComment?: boolean;
  requiresPhotoProof?: boolean;
  isMandatory?: boolean;
  criticality?: PeriodicCriticality;
  archivedAt?: number;
  archivedBy?: string;
  archiveReason?: string;
  /**
   * @deprecated Compatibility only. New templates should use destinationType,
   * destinationWorkflowTypeId, asset fields, and orderType.
   */
  targetSubmodule?: "GENERAL" | "EQUIPMENT_FAULT" | "UZSAKYMAI";
  equipmentId?: string;
  issueTypeId?: string;
  orderType?: "SMULKUS" | "VENDING" | "FIRST_AID_KIT";
  default_day?: number; // From prompt: taskTemplate.default_day
  dayOfMonth?: number; // Compatibility
  dayOfWeek?: number; // Compatibility
  assigned_to?: string; // From prompt: taskTemplate.assigned_to
  assignedTo?: { id: string; name: string; role: string }; // Extended field
  assigneeId?: string; // Flat assignee ID (used by TemplateEditModal assignee picker)
  priority?: "CRITICAL" | "IMPORTANT";
  defaultResponsibleId?: string; // Compatibility
  targetMode: "ALL_CLUBS" | "SELECTED_CLUBS" | "REGIONS";
  targetClubIds: string[];
  targetRegions: string[];
  responsibleMode?: ResponsibleMode;
  slaHours?: number;
  sopUrl?: string;
  sopRequired: boolean;
  budgetRequired: boolean;
  estimatedBudget?: number;
  preferredSupplierIds: string[];
  buildingApprovalRequired?: boolean;
  clientNoticeRequired?: boolean;
  weatherDependent?: boolean;
  decisionChecklist: string[];
  executionChecklist: string[];
  checklistTemplates?: ChecklistTemplate[];
  isActive: boolean;
  createdAt: string | number;
  updatedAt: string | number;
  // New Operational Fields
  proofRequired?: boolean;
  proofConfig?: {
    allowedTypes: string[];
    maxFiles: number;
    maxTotalVideoSizeMb: number;
  };
  supplier?: {
    name: string;
    phone: string;
    email: string;
  };
  customFrequencyMonths?: number;
  task_description?: string;
  task_description_updated_at?: number;
  task_description_updated_by?: string;
  department?: string;
  startDate?: string;
  startWeek?: number;
  month?: number;
  quarter?: number;
  occurrenceOverrides?: Record<string, any>; // Key: occurrenceId
  deactivatedAt?: number;
  deactivatedBy?: string;
  deactivateReason?: string;
  sop?: {
    exists: boolean;
    url: string;
    updatedAt: number | null;
    updatedBy: string | null;
    history: {
      oldUrl: string | null;
      newUrl: string;
      updatedAt: number;
      updatedBy: string;
    }[];
  };
}

export type PeriodicTemplateRemovalAction = "DELETE_ALLOWED" | "ARCHIVE_ONLY";

export const getPeriodicTemplateRemovalAction = (
  templateId: string,
  history: Array<{ templateId?: string }> = [],
  instances: Array<{ templateId?: string; history?: unknown[] }> = [],
): PeriodicTemplateRemovalAction => {
  const hasHistory =
    history.some((record) => record.templateId === templateId) ||
    instances.some(
      (instance) =>
        instance.templateId === templateId && Boolean(instance.history?.length),
    );

  return hasHistory ? "ARCHIVE_ONLY" : "DELETE_ALLOWED";
};

export const mockPeriodicTemplates: PeriodicTemplate[] = [
  {
    id: "PT_WATER",
    name: "Vandens tyrimai",
    title: "Vandens tyrimai",
    description: "Baseino ir dušo vandens mikrobiologinis tyrimas",
    destinationWorkflowTypeId: "facility-work",
    type: "MANDATORY",
    criticality: "CRITICAL" as const,
    visibleWeeksBeforeDue: 4,
    frequency: "monthly",
    recurrence: "monthly",
    default_day: 5,
    dayOfMonth: 5,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: ["Kaunas", "Vilnius"],
    responsibleMode: "CLUB_COORDINATOR",
    slaHours: 24,
    sopRequired: true,
    budgetRequired: true,
    estimatedBudget: 50,
    preferredSupplierIds: ["SUP_LAB"],
    decisionChecklist: ["Patikrinti vandens lygį", "Paimti mėginius"],
    executionChecklist: [
      "Pažymėti rezultatus sistemoje",
      "Iškviesti laboratoriją",
    ],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-01",
    sop: {
      exists: true,
      url: "https://docs.google.com/document/d/example1",
      updatedAt: Date.now() - 3600000 * 24 * 50, // 50 days ago
      updatedBy: "Admin",
      history: []
    }
  },
  {
    id: "PT_WINDOWS",
    name: "Lauko langų valymas",
    title: "Lauko langų valymas",
    description: "Klubo fasado stiklų valymas",
    destinationWorkflowTypeId: "facility-work",
    type: "OPTIONAL",
    criticality: "STANDARD" as const,
    visibleWeeksBeforeDue: 2,
    frequency: "quarterly",
    recurrence: "quarterly",
    targetMode: "SELECTED_CLUBS",
    targetClubIds: ["SG_VYT", "OGM"],
    targetRegions: [],
    responsibleMode: "OPS",
    slaHours: 48,
    sopRequired: false,
    budgetRequired: true,
    estimatedBudget: 200,
    preferredSupplierIds: ["SUP_CLEAN"],
    decisionChecklist: ["Įvertinti oro sąlygas"],
    executionChecklist: ["Valymas atliktas", "Tikrinimas"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-03-01",
    sop: {
      exists: false,
      url: "",
      updatedAt: null,
      updatedBy: null,
      history: []
    }
  },
  {
    id: "PT_CEILING",
    name: "Sijų / aukštų zonų valymas",
    title: "Sijų / aukštų zonų valymas",
    description: "Dulkių valymas nuo aukštų konstrukcijų ir sijų",
    destinationWorkflowTypeId: "facility-work",
    type: "OPTIONAL",
    criticality: "STANDARD" as const,
    visibleWeeksBeforeDue: 2,
    frequency: "monthly",
    recurrence: "monthly",
    default_day: 15,
    dayOfMonth: 15,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: ["Vilnius"],
    responsibleMode: "OPS",
    slaHours: 72,
    sopRequired: true,
    budgetRequired: true,
    estimatedBudget: 150,
    preferredSupplierIds: ["SUP_CLEAN"],
    decisionChecklist: ["Saugos instruktažas"],
    executionChecklist: ["Aukštų zonų valymas"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-02-15",
    sop: {
      exists: true,
      url: "https://workspace.google.com/example2",
      updatedAt: Date.now() - 3600000 * 24 * 190, // 190 days ago (critical)
      updatedBy: "Admin",
      history: []
    }
  },
  {
    id: "PT_FIRE",
    name: "Gesintuvų patikra",
    title: "Gesintuvų patikra",
    description: "Priešgaisrinių gesintuvų techninė būklė",
    destinationWorkflowTypeId: "facility-work",
    type: "MANDATORY",
    criticality: "CRITICAL" as const,
    visibleWeeksBeforeDue: 4,
    frequency: "monthly",
    recurrence: "monthly",
    default_day: 1,
    dayOfMonth: 1,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: ["Kaunas", "Vilnius"],
    responsibleMode: "MANUAL",
    slaHours: 24,
    sopRequired: true,
    budgetRequired: false,
    preferredSupplierIds: ["SUP_FIRE"],
    decisionChecklist: ["Ar pasiekiami", "Ar nėra sugadinti"],
    executionChecklist: ["Užpildyti patikros žurnalą"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-01",
    sop: {
      exists: true,
      url: "https://docs.google.com/document/d/example-fire",
      updatedAt: Date.now() - 3600000 * 24 * 100, // 100 days ago (warning)
      updatedBy: "Admin",
      history: []
    }
  },
  {
    id: "PT_HVAC",
    name: "Klimato sistemos aptarnavimas",
    title: "Klimato sistemos aptarnavimas",
    description: "Vėdinimo ir kondicionavimo filtrų keitimas",
    destinationWorkflowTypeId: "facility-work",
    type: "MANDATORY",
    criticality: "CRITICAL" as const,
    visibleWeeksBeforeDue: 4,
    frequency: "monthly",
    recurrence: "monthly",
    default_day: 10,
    dayOfMonth: 10,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: [],
    responsibleMode: "OPS",
    slaHours: 48,
    sopRequired: true,
    budgetRequired: true,
    estimatedBudget: 300,
    preferredSupplierIds: ["SUP_HVAC"],
    decisionChecklist: ["Ar sistemos veikia", "Ar filtrai užsiteršę"],
    executionChecklist: ["Keisti filtrus", "Patikrinti temperatūrą"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-10",
    sop: {
      exists: false,
      url: "",
      updatedAt: null,
      updatedBy: null,
      history: []
    }
  },
  {
    id: "PT_CLEAN_AUDIT",
    name: "Valymo kokybės auditas",
    title: "Valymo kokybės auditas",
    description: "Bendros švaros ir higienos auditas",
    destinationWorkflowTypeId: "facility-work",
    type: "OPTIONAL",
    criticality: "STANDARD" as const,
    visibleWeeksBeforeDue: 2,
    frequency: "weekly",
    recurrence: "weekly",
    default_day: 2,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: [],
    responsibleMode: "CLUB_COORDINATOR",
    slaHours: 24,
    sopRequired: false,
    budgetRequired: false,
    preferredSupplierIds: [],
    decisionChecklist: ["Švara tualetuose", "Salės tvarka"],
    executionChecklist: ["Užpildyti auditorio formą"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-02",
    sop: {
      exists: false,
      url: "",
      updatedAt: null,
      updatedBy: null,
      history: []
    }
  },
  {
    id: "PT_SHOWERS",
    name: "Dušų / persirengimo patikra",
    title: "Dušų / persirengimo patikra",
    description: "Techninė dušų ir spintelių būklės patikra",
    destinationWorkflowTypeId: "facility-work",
    type: "OPTIONAL",
    criticality: "STANDARD" as const,
    visibleWeeksBeforeDue: 2,
    frequency: "daily",
    recurrence: "daily",
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: [],
    responsibleMode: "CLUB_COORDINATOR",
    slaHours: 8,
    sopRequired: false,
    budgetRequired: false,
    preferredSupplierIds: [],
    decisionChecklist: ["Ar veikia dušai", "Ar yra spintelių gedimų"],
    executionChecklist: ["Užfiksuoti gedimus"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-01",
    sop: {
      exists: false,
      url: "",
      updatedAt: null,
      updatedBy: null,
      history: []
    }
  },
  {
    id: "PT_TURNSTILE",
    name: "Turniketų / praėjimo sistemos patikra",
    title: "Turniketų / praėjimo sistemos patikra",
    description: "Praėjimo sistemos funkcionalumo patikra",
    destinationWorkflowTypeId: "facility-work",
    type: "MANDATORY",
    criticality: "IMPORTANT" as const,
    visibleWeeksBeforeDue: 2,
    frequency: "weekly",
    recurrence: "weekly",
    default_day: 1,
    targetMode: "ALL_CLUBS",
    targetClubIds: [],
    targetRegions: [],
    responsibleMode: "OPS",
    slaHours: 4,
    sopRequired: false,
    budgetRequired: false,
    preferredSupplierIds: ["SUP_TECH"],
    decisionChecklist: ["Ar turniketas praleidžia klientus"],
    executionChecklist: ["Praėjimo patikra"],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    startDate: "2026-01-01",
    sop: {
      exists: false,
      url: "",
      updatedAt: null,
      updatedBy: null,
      history: []
    }
  },
];
