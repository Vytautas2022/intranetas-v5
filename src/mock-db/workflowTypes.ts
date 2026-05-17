import {
  AlertCircle,
  Camera,
  FileText,
  Lightbulb,
  Monitor,
  ShoppingCart,
  Wrench,
  Zap,
} from "lucide-react";
import type { Priority } from "../types/faults";

export type WorkflowCategory = "DARBAI" | "KONTROLE" | "UZSAKYMAI" | "IDEJOS";

export interface WorkflowStatusConfig {
  id: string;
  label: string;
  terminal?: boolean;
}

export interface WorkflowPriorityConfig {
  id: Priority;
  label: string;
  slaHours: number;
}

export interface WorkflowFieldConfig {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "club" | "equipment" | "media";
  required: boolean;
}

export interface WorkflowType {
  id: string;
  legacyCategory: string;
  action: "fault" | "order" | "other";
  name: string;
  description: string;
  icon: string;
  color: string;
  bg: string;
  hover: string;
  enabled: boolean;
  category: WorkflowCategory;
  statuses: WorkflowStatusConfig[];
  priorities: WorkflowPriorityConfig[];
  slaRules: {
    defaultHours: number;
    criticalHours: number;
    warningRatio: number;
  };
  requiredFields: WorkflowFieldConfig[];
  assignmentRules: {
    strategy: "role" | "category" | "supplier" | "manual";
    defaultRole: string;
  };
  allowedRoles: string[];
  analyticsConfig: {
    trackSla: boolean;
    trackRecurring: boolean;
    trackResolutionTime: boolean;
  };
  notificationRules: {
    onCreate: boolean;
    onSlaWarning: boolean;
    onStatusChange: boolean;
  };
  permissionsConfig: {
    canCreate: string[];
    canEdit: string[];
    canClose: string[];
  };
  kanbanSettings: {
    enabled: boolean;
    lanes: string[];
    allowDrag: boolean;
  };
  templates: string[];
  linkedConfigs: {
    facilityTemplates?: boolean;
    equipmentIssueTypes?: boolean;
    orderConfig?: boolean;
    suppliers?: boolean;
    sops?: boolean;
  };
}

const defaultStatuses: WorkflowStatusConfig[] = [
  { id: "Naujas", label: "Naujas" },
  { id: "Vykdoma", label: "Vykdoma" },
  { id: "Laukiama detalių", label: "Laukiama" },
  { id: "Sutvarkyta", label: "Atlikta", terminal: true },
  { id: "Atmesta", label: "Atmesta", terminal: true },
  { id: "Kada nors", label: "Kada nors" },
];

const defaultPriorities: WorkflowPriorityConfig[] = [
  { id: "low", label: "Žemas", slaHours: 168 },
  { id: "medium", label: "Vidutinis", slaHours: 48 },
  { id: "high", label: "Aukštas", slaHours: 24 },
  { id: "critical", label: "Kritinis", slaHours: 6 },
];

const baseWorkflow = {
  statuses: defaultStatuses,
  priorities: defaultPriorities,
  slaRules: { defaultHours: 48, criticalHours: 6, warningRatio: 0.8 },
  assignmentRules: { strategy: "role" as const, defaultRole: "OPS" },
  allowedRoles: ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR", "CS"],
  analyticsConfig: {
    trackSla: true,
    trackRecurring: true,
    trackResolutionTime: true,
  },
  notificationRules: {
    onCreate: true,
    onSlaWarning: true,
    onStatusChange: true,
  },
  permissionsConfig: {
    canCreate: ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR", "CS"],
    canEdit: ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR"],
    canClose: ["SUPER_ADMIN", "ADMIN", "OPS", "COORDINATOR"],
  },
  kanbanSettings: {
    enabled: true,
    lanes: defaultStatuses.map((status) => status.id),
    allowDrag: true,
  },
  templates: [],
};

export const workflowTypes: WorkflowType[] = [
  {
    ...baseWorkflow,
    id: "facility-work",
    legacyCategory: "FACILITY_FAULT",
    action: "fault",
    name: "Patalpų darbai",
    description: "Techniniai sutrikimai, patalpos ir pastato problemos",
    icon: "Wrench",
    color: "text-red-600",
    bg: "bg-red-50",
    hover: "hover:border-red-200",
    enabled: true,
    category: "DARBAI",
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "equipmentId", label: "Objektas", type: "select", required: true },
      { id: "typeId", label: "Gedimo tipas", type: "select", required: true },
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: { facilityTemplates: true, sops: true },
  },
  {
    ...baseWorkflow,
    id: "equipment-work",
    legacyCategory: "EQUIPMENT_FAULT",
    action: "fault",
    name: "Treniruoklių darbai",
    description: "Sporto inventoriaus ar treniruoklio problemos",
    icon: "Zap",
    color: "text-orange-600",
    bg: "bg-orange-50",
    hover: "hover:border-orange-200",
    enabled: true,
    category: "DARBAI",
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "equipmentId", label: "Treniruoklis", type: "equipment", required: true },
      { id: "typeId", label: "Gedimo tipas", type: "select", required: true },
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: { equipmentIssueTypes: true, sops: true },
  },
  {
    ...baseWorkflow,
    id: "it-work",
    legacyCategory: "IT",
    action: "other",
    name: "IT darbai",
    description: "Sistemos, įranga, prieigos ir IT užklausos",
    icon: "Monitor",
    color: "text-sky-600",
    bg: "bg-sky-50",
    hover: "hover:border-sky-200",
    enabled: true,
    category: "DARBAI",
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: {},
  },
  {
    ...baseWorkflow,
    id: "marketing-work",
    legacyCategory: "MARKETING",
    action: "other",
    name: "Marketing darbai",
    description: "Kampanijos, vizualai ir marketingo užduotys",
    icon: "FileText",
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-50",
    hover: "hover:border-fuchsia-200",
    enabled: true,
    category: "DARBAI",
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: {},
  },
  {
    ...baseWorkflow,
    id: "sop-work",
    legacyCategory: "SOP",
    action: "other",
    name: "SOP darbai",
    description: "SOP kūrimas, atnaujinimai ir standartizavimas",
    icon: "FileText",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    hover: "hover:border-emerald-200",
    enabled: true,
    category: "DARBAI",
    requiredFields: [
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: { sops: true },
  },
  {
    ...baseWorkflow,
    id: "video-control",
    legacyCategory: "VIDEO_CONTROL",
    action: "other",
    name: "Vaizdo kontrolė",
    description: "Vaizdo peržiūros, incidentai ir kontrolės užduotys",
    icon: "Camera",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    hover: "hover:border-indigo-200",
    enabled: true,
    category: "KONTROLE",
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: {},
  },
  {
    ...baseWorkflow,
    id: "orders",
    legacyCategory: "ORDER",
    action: "order",
    name: "Užsakymai",
    description: "Prekės, paslaugos, inventorius ir tiekėjų procesai",
    icon: "ShoppingCart",
    color: "text-black",
    bg: "bg-brand-lime",
    hover: "hover:border-black",
    enabled: true,
    category: "UZSAKYMAI",
    assignmentRules: { strategy: "supplier", defaultRole: "OPS" },
    requiredFields: [
      { id: "clubId", label: "Sporto klubas", type: "club", required: true },
      { id: "orderCategory", label: "Užsakymo kategorija", type: "select", required: true },
    ],
    linkedConfigs: { orderConfig: true, suppliers: true },
  },
  {
    ...baseWorkflow,
    id: "suggestions",
    legacyCategory: "OTHER",
    action: "other",
    name: "Pasiūlymai",
    description: "Idėjos, pasiūlymai ir bendri klausimai",
    icon: "Lightbulb",
    color: "text-amber-600",
    bg: "bg-amber-50",
    hover: "hover:border-amber-200",
    enabled: true,
    category: "IDEJOS",
    requiredFields: [
      { id: "description", label: "Aprašymas", type: "textarea", required: true },
    ],
    linkedConfigs: {},
  },
];

export const workflowIconMap = {
  AlertCircle,
  Camera,
  FileText,
  Lightbulb,
  Monitor,
  ShoppingCart,
  Wrench,
  Zap,
};

export const getWorkflowTypeByLegacyCategory = (
  legacyCategory?: string,
): WorkflowType | undefined =>
  workflowTypes.find((workflow) => workflow.legacyCategory === legacyCategory);

export const getWorkflowTypeById = (id?: string): WorkflowType | undefined =>
  workflowTypes.find((workflow) => workflow.id === id);
