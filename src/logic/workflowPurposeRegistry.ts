import type {
  WorkflowCategory,
  WorkflowObjectType,
  WorkflowPurpose,
} from "../mock-db/workflowTypes";

export interface WorkflowPurposeConfig {
  /** Lithuanian display label shown in Admin UI */
  label: string;
  /** WorkflowType.action value derived from this purpose */
  action: "fault" | "order" | "other";
  /** WorkflowType.category derived from this purpose */
  category: WorkflowCategory;
  /** Fallback objectType when no asset is selected */
  defaultObjectType: WorkflowObjectType;
  /** When true and usesAsset=true, inject a typeId required field */
  injectsIssueTypeField: boolean;
  /** When true, inject and keep the orderCategory required field */
  injectsOrderCategoryField: boolean;
}

/**
 * Central registry: WorkflowPurpose → behavioral config.
 *
 * This is the single source of truth for all purpose-driven derivations
 * previously scattered across AdminModule (action, category, objectType,
 * requiredFields, labels).  The set of valid purposes is still controlled by
 * the WorkflowPurpose union type — this registry does NOT allow free creation.
 */
export const WORKFLOW_PURPOSE_REGISTRY: Record<
  WorkflowPurpose,
  WorkflowPurposeConfig
> = {
  FAULTS: {
    label: "Gedimai",
    action: "fault",
    category: "DARBAI",
    defaultObjectType: "GENERIC",
    injectsIssueTypeField: true,
    injectsOrderCategoryField: false,
  },
  TASKS: {
    label: "Užduotys",
    action: "other",
    category: "DARBAI",
    defaultObjectType: "GENERIC",
    injectsIssueTypeField: false,
    injectsOrderCategoryField: false,
  },
  ORDERS: {
    label: "Užsakymai",
    action: "order",
    category: "UZSAKYMAI",
    defaultObjectType: "ORDER",
    injectsIssueTypeField: false,
    injectsOrderCategoryField: true,
  },
  PERIODIC: {
    label: "Periodiniai darbai",
    action: "other",
    category: "DARBAI",
    defaultObjectType: "GENERIC",
    injectsIssueTypeField: false,
    injectsOrderCategoryField: false,
  },
  PROJECTS: {
    label: "Projektai",
    action: "other",
    category: "DARBAI",
    defaultObjectType: "GENERIC",
    injectsIssueTypeField: false,
    injectsOrderCategoryField: false,
  },
  SUGGESTIONS: {
    label: "Pasiūlymai",
    action: "other",
    category: "IDEJOS",
    defaultObjectType: "GENERIC",
    injectsIssueTypeField: false,
    injectsOrderCategoryField: false,
  },
};

/** Typed lookup — falls back to TASKS config for unknown/undefined values. */
export const getPurposeConfig = (
  purpose: WorkflowPurpose | undefined | null,
): WorkflowPurposeConfig =>
  WORKFLOW_PURPOSE_REGISTRY[purpose ?? "TASKS"] ??
  WORKFLOW_PURPOSE_REGISTRY["TASKS"];
