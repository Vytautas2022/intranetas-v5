import {
  Attachment,
  CommentItem,
  HistoryItem,
  AssignedTo,
} from "../types/common";

export type RecurrenceType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "6_months"
  | "yearly"
  | "custom_days";
export type TaskInstanceStatus =
  | "SCHEDULED"
  | "PENDING"
  | "IN_PROGRESS"
  | "INSPECTION_NEEDED"
  | "ACTION_NEEDED"
  | "COMPLETED"
  | "SKIPPED"
  | "OVERDUE";
export type PeriodicTaskType = "MANDATORY" | "INSPECTION";
export type ClubScope = "ALL" | "SELECTED" | "REGION";
export type ApplicationType = "GENERAL" | "CLUB";

export type PeriodicTaskCategory =
  | "MAINTENANCE"
  | "INSPECTION"
  | "CLEANING"
  | "SAFETY"
  | "EQUIPMENT";

/**
 * Template defining a periodic task.
 */
export interface PeriodicTaskTemplate {
  id: string;
  title: string;
  description: string;
  category: PeriodicTaskCategory;
  type: PeriodicTaskType;
  recurrence: RecurrenceType;
  sopLink?: string;
  supplierId?: string;
  supplierName?: string;
  plannedCost?: number;
  // New fields
  schedule?: string[];
  isMandatory?: boolean;
  optionalCheckProcedure?: string;
  requiredDocuments?: boolean;
  automation?: {
    enabled: boolean;
    recipient?: string;
    subject?: string;
    body?: string;
  };
  assigned_to?: string; // user_id
  priority?: "CRITICAL" | "IMPORTANT";
  isActive: boolean;
  department: string; // "Operacijos" | "Marketingas"
  scope: ClubScope;
  applicationType: ApplicationType;
  history?: {
    id: string;
    timestamp: number;
    user: string;
    action: "created" | "activated" | "deactivated" | "edited";
  }[];
  clubOverrides?: Record<
    string,
    {
      descriptionOverride?: string;
      sopLink?: string;
      supplier?: string;
      notes?: string;
    }
  >;
}

/**
 * An instance of a periodic task scheduled for a specific date and club.
 */
export interface PeriodicTaskInstance {
  id: string;
  templateId: string;
  sourceType?: "PERIODIC" | "GENERAL"; // Add this
  title: string;
  description: string;
  status: TaskInstanceStatus;
  dueDate: number;
  clubId: string;
  clubName: string;
  assignee?: AssignedTo;
  // New fields for assignment/override
  descriptionOverride?: string;
  sopLink?: string;
  supplier?: string;
  notes?: string;

  actualCost?: number;
  attachments?: Attachment[];
  comments: CommentItem[];
  history: HistoryItem[];
  updatedAt: number;
  updatedBy: string;
  // Tracking
  inspectionDecision?: "CHECKED" | "NOT_NECESSARY";
  isInspectionResultChecked?: boolean;
  metadata?: { periodKey?: string };
}

export const periodicTaskTemplates: PeriodicTaskTemplate[] = [
  {
    id: "PT-001",
    title: "Vandens tyrimai",
    description: "Vandens kokybės tyrimai",
    category: "CLEANING",
    type: "MANDATORY",
    recurrence: "monthly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
    assigned_to: "u1",
    history: [
      { id: "h1", timestamp: Date.now() - 1000000, user: "Sistemos administratorius", action: "created" },
      { id: "h2", timestamp: Date.now() - 500000, user: "Sistemos administratorius", action: "activated" }
    ]
  },
  {
    id: "PT-002",
    title: "Langų valymas",
    description: "Išorinis langų valymas",
    category: "CLEANING",
    type: "MANDATORY",
    recurrence: "quarterly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
    assigned_to: "u2",
    history: [
      { id: "h3", timestamp: Date.now() - 2000000, user: "Sistemos administratorius", action: "created" },
      { id: "h4", timestamp: Date.now() - 1000000, user: "Sistemos administratorius", action: "activated" }
    ]
  },
  {
    id: "PT-003",
    title: "Kilimų keitimas",
    description: "Kilimėlių keitimas",
    category: "CLEANING",
    type: "MANDATORY",
    recurrence: "weekly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: false,
    history: [
      { id: "h5", timestamp: Date.now() - 3000000, user: "Sistemos administratorius", action: "created" }
    ]
  },
  {
    id: "PT-004",
    title: "Gesintuvų patikra",
    description: "Kasmetinė gesintuvų patikra",
    category: "SAFETY",
    type: "MANDATORY",
    recurrence: "yearly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-005",
    title: "Klimato sistema",
    description: "Filtrai ir profilaktika",
    category: "MAINTENANCE",
    type: "MANDATORY",
    recurrence: "quarterly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-006",
    title: "Valymo auditai",
    description: "Kokybės tikrinimas",
    category: "CLEANING",
    type: "INSPECTION",
    recurrence: "monthly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-007",
    title: "Dušų patikra",
    description: "Nuotekų profilaktika",
    category: "MAINTENANCE",
    type: "INSPECTION",
    recurrence: "monthly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-008",
    title: "Oro filtrai",
    description: "Ventiliacijos filtrų keitimas",
    category: "MAINTENANCE",
    type: "MANDATORY",
    recurrence: "monthly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-009",
    title: "Sienų dažymas",
    description: "Kosmetinis remontas",
    category: "MAINTENANCE",
    type: "INSPECTION",
    recurrence: "yearly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "CLUB",
    isActive: false,
  },
  {
    id: "PT-010",
    title: "Marketingo ataskaita",
    description: "Mėnesinė ataskaita",
    category: "MAINTENANCE",
    type: "MANDATORY",
    recurrence: "monthly",
    scope: "ALL",
    department: "Marketingas",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-011",
    title: "Akcijos vizualų atnaujinimas",
    description: "Plakatų keitimas klubuose",
    category: "CLEANING",
    type: "MANDATORY",
    recurrence: "quarterly",
    scope: "ALL",
    department: "Marketingas",
    applicationType: "CLUB",
    isActive: true,
  },
  {
    id: "PT-012",
    title: "Socialinių tinklų planas",
    description: "Savaitinis įrašų planas",
    category: "MAINTENANCE",
    type: "MANDATORY",
    recurrence: "weekly",
    scope: "ALL",
    department: "Marketingas",
    applicationType: "GENERAL",
    isActive: true,
  },
  {
    id: "PT-013",
    title: "Finansinė apžvalga",
    description: "Mėnesio pabaigos rezultatų peržiūra",
    category: "MAINTENANCE",
    type: "MANDATORY",
    recurrence: "monthly",
    scope: "ALL",
    department: "Operacijos",
    applicationType: "GENERAL",
    isActive: true,
  },
];

export const periodicTaskInstances: PeriodicTaskInstance[] = [
  {
    id: "inst-1",
    templateId: "t1",
    title: "Bendras klubo valymas",
    description: "Pilnas klubo valymas.",
    status: "COMPLETED",
    dueDate: Date.now() - 86400000,
    clubId: "OGM",
    clubName: "SG Ogmios",
    comments: [],
    history: [],
    updatedAt: Date.now(),
    updatedBy: "Admin",
  },
  {
    id: "inst-2",
    templateId: "t2",
    title: "Inventoriaus saugos patikra",
    description: "Saugos patikra pagal SOP.",
    status: "OVERDUE",
    dueDate: Date.now() - 172800000,
    clubId: "SG_VYT",
    clubName: "SG Vytauto pr",
    comments: [],
    history: [],
    updatedAt: Date.now(),
    updatedBy: "Admin",
  },
  {
    id: "inst-3",
    templateId: "t3",
    title: "Bėgimo takų aptarnavimas",
    description: "Takų tepimas.",
    status: "IN_PROGRESS",
    dueDate: Date.now() + 86400000,
    clubId: "OGM",
    clubName: "SG Ogmios",
    comments: [],
    history: [],
    updatedAt: Date.now(),
    updatedBy: "Admin",
  },
];
