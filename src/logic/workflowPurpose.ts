import { workflowTypes as defaultWorkflowTypes, type WorkflowType } from "../mock-db/workflowTypes";
import type { PeriodicDestinationType, PeriodicTemplate } from "../mock-db/periodicTemplates";

export type WorkflowPurpose = "ORDER" | "ASSET" | "WORKFLOW_CARD";

export const isOrderWorkflow = (workflow?: Pick<WorkflowType, "action" | "objectType" | "category"> | null): boolean =>
  Boolean(
    workflow &&
      (workflow.action === "order" ||
        workflow.objectType === "ORDER" ||
        workflow.category === "UZSAKYMAI"),
  );

export const isAssetWorkflow = (workflow?: Pick<WorkflowType, "assetTypeId" | "objectType"> | null): boolean =>
  Boolean(
    workflow?.assetTypeId &&
      workflow.objectType !== "ORDER",
  );

export const getWorkflowByPurpose = (
  workflows: WorkflowType[] = defaultWorkflowTypes,
  purpose: WorkflowPurpose,
): WorkflowType | undefined => {
  if (purpose === "ORDER") {
    return workflows.find((workflow) => isOrderWorkflow(workflow));
  }

  if (purpose === "ASSET") {
    return workflows.find((workflow) => isAssetWorkflow(workflow));
  }

  return workflows.find((workflow) => !isOrderWorkflow(workflow));
};

export const getOrderWorkflowTypeId = (
  workflows: WorkflowType[] = defaultWorkflowTypes,
): string | undefined => getWorkflowByPurpose(workflows, "ORDER")?.id;

export const getOrderWorkflowModuleId = (
  workflows: WorkflowType[] = defaultWorkflowTypes,
): string | undefined => getWorkflowByPurpose(workflows, "ORDER")?.moduleId;

export const getWorkflowDestinationType = (
  template: Pick<PeriodicTemplate, "destinationType" | "targetSubmodule">,
): PeriodicDestinationType => {
  if (template.destinationType) return template.destinationType;
  return template.targetSubmodule === "UZSAKYMAI" ? "ORDER" : "WORKFLOW_CARD";
};
