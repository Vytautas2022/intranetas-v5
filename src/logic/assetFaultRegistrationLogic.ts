import { createFaultHistory } from "./kanbanLogic";
import { generateId, generateUniqueId } from "./idLogic";
import { getEquipmentIdentityFields } from "./equipmentFaultIdentity";
import { getFacilityIdentityFields } from "./facilityFaultIdentity";
import type { Club } from "../mock-db/clubs";
import type { AssetIssueType } from "../mock-db/assetIssueTypes";
import type { AssetObject } from "../mock-db/assetObjects";
import type { WorkflowType } from "../mock-db/workflowTypes";
import { Status, type Fault, type Priority } from "../types/faults";

const getWorkflowCategory = (workflow: Pick<WorkflowType, "id" | "objectType">) => {
  if (workflow.objectType === "EQUIPMENT") return "EQUIPMENT_FAULT";
  if (workflow.objectType === "FACILITY") return "FACILITY_FAULT";
  return workflow.id || "GENERIC";
};

const getAssetLegacyId = (assetObject: AssetObject) =>
  typeof assetObject.metadata?.legacyId === "string"
    ? assetObject.metadata.legacyId
    : assetObject.id;

export interface AssetWorkflowFaultInput {
  assetObject: AssetObject;
  issueType: AssetIssueType;
  workflow: WorkflowType;
  description: string;
  attachments: { type: "image" | "video"; url: string; name: string }[];
  clubs: Club[];
  defaultAssignee?: { id: string; name: string; role: string };
  authorName: string;
  source?: "USER" | "QR";
}

export function buildAssetWorkflowFault({
  assetObject,
  issueType,
  workflow,
  description,
  attachments,
  clubs,
  defaultAssignee,
  authorName,
  source = "USER",
}: AssetWorkflowFaultInput): Fault {
  const club = clubs.find((candidate) => candidate.id === assetObject.clubId);
  const category = getWorkflowCategory(workflow);
  const assetLegacyId = getAssetLegacyId(assetObject);
  const assetImageUrl =
    typeof assetObject.metadata?.imageUrl === "string"
      ? assetObject.metadata.imageUrl
      : "";
  const isFacility = workflow.objectType === "FACILITY";
  const isEquipment = workflow.objectType === "EQUIPMENT";
  const priority = issueType.priority as Priority;

  return {
    id: generateUniqueId("f"),
    code: generateId(),
    title: assetObject.name,
    clubId: assetObject.clubId || "",
    clubName: club?.name || "Klubas",
    status: Status.NEW,
    entityType: "fault",
    source,
    slaHours: issueType.slaHours,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status_history: createFaultHistory(authorName),
    description,
    assignedTo: defaultAssignee
      ? {
          id: defaultAssignee.id,
          name: defaultAssignee.name,
          role: defaultAssignee.role,
        }
      : "",
    assigneeId: defaultAssignee?.id || "",
    assigneeName: defaultAssignee?.name || "",
    comments: [],
    media: attachments.map((attachment) => ({
      type: attachment.type,
      url: attachment.url,
      name: attachment.name,
    })),
    photos: attachments
      .filter((attachment) => attachment.type === "image")
      .map((attachment) => ({
        type: "image" as const,
        url: attachment.url,
        name: attachment.name,
      })),
    videos: attachments
      .filter((attachment) => attachment.type === "video")
      .map((attachment) => ({
        type: "video" as const,
        url: attachment.url,
        name: attachment.name,
      })),
    watchers:
      priority === "critical" || priority === "high"
        ? [{ userId: authorName, mode: "all" }]
        : [],
    rejected: false,
    rejectReason: "",
    updatedBy: authorName,
    type: category,
    priority,
    coverImage: assetImageUrl || attachments.find((item) => item.type === "image")?.url || "",
    history: [
      {
        id: generateUniqueId("h"),
        timestamp: Date.now(),
        user: authorName,
        actionType: "PRIMARY_REPORT",
        type: "Pirminis gedimas",
        reason: description || undefined,
      },
    ],
    repeat_count: 0,
    report_count: 1,
    report_history: [],
    sopUrl: issueType.sopUrl || undefined,
    sopStatus: issueType.sopUrl ? "EXISTS" : "MISSING",
    sop: issueType.sopUrl
      ? { url: issueType.sopUrl, updatedAt: Date.now(), updatedBy: "SISTEMA" }
      : undefined,
    category,
    workflowTypeId: workflow.id,
    region: club?.city,
    typeId: issueType.id,
    assetObjectId: assetObject.id,
    ...getEquipmentIdentityFields(isEquipment ? assetLegacyId : undefined),
    ...getFacilityIdentityFields(isFacility ? assetLegacyId : undefined, {
      isLocation: assetObject.metadata?.legacySource === "qrLocations",
    }),
    issue_type_id: issueType.id,
  } as Fault & { region?: string };
}
