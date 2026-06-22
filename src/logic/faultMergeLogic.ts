import { generateUniqueId } from "./idLogic";
import type { Fault, FaultComment } from "../types/faults";
import type { FaultMedia, ReportHistoryItem } from "../mock-db/faults";
import type { AssetObject } from "../mock-db/assetObjects";
import type { WorkflowType } from "../mock-db/workflowTypes";
import { Status } from "../types/faults";
import { getFaultEquipmentId } from "./equipmentFaultIdentity";
import { getFaultFacilityAssetObjectId } from "./facilityFaultIdentity";

export const ACTIVE_INCIDENT_MERGE_STATUSES = [
  Status.NEW,
  Status.IN_PROGRESS,
  Status.WAITING_DETAILS,
];

export interface MergeReportInput {
  existingFault: Fault;
  author: string;
  comment: string;
  media?: { type: "image" | "video"; url: string; name: string }[];
  source: "QR" | "USER";
}

const getAssetLegacyId = (assetObject: AssetObject) =>
  typeof assetObject.metadata?.legacyId === "string"
    ? assetObject.metadata.legacyId
    : assetObject.id;

export function findActiveIncidentForAsset(
  faults: Fault[],
  assetObject: AssetObject,
  workflow?: Pick<WorkflowType, "objectType"> | null,
): Fault | undefined {
  const legacyId = getAssetLegacyId(assetObject);

  return faults.find((fault) => {
    if (
      fault.entityType !== "fault" ||
      !ACTIVE_INCIDENT_MERGE_STATUSES.includes(fault.status as Status)
    ) {
      return false;
    }

    if (fault.assetObjectId === assetObject.id) {
      return true;
    }

    if (workflow?.objectType === "EQUIPMENT") {
      const equipmentId = getFaultEquipmentId(fault);
      return equipmentId === legacyId || equipmentId === assetObject.id;
    }

    if (workflow?.objectType === "FACILITY") {
      return getFaultFacilityAssetObjectId(fault) === assetObject.id;
    }

    return false;
  });
}

export function buildMergedFault(input: MergeReportInput): Fault {
  const { existingFault, author, comment, media = [], source } = input;
  const now = Date.now();
  const photos = media.filter((item) => item.type === "image");
  const videos = media.filter((item) => item.type === "video");

  const parts: string[] = [];
  if (comment) parts.push(comment);
  if (photos.length) parts.push(`Papildyta foto: ${photos.length}`);
  if (videos.length) parts.push(`Papildytas video: ${videos.length}`);
  const commentText = parts.join("\n") || "Pakartotinis pranešimas.";

  const newComment: FaultComment = {
    id: generateUniqueId("c"),
    text: commentText,
    author,
    createdAt: now,
    mentions: [],
    edited: false,
    history: [],
    deleted: false,
    source,
    ...(media.length > 0 ? { media: media as FaultMedia[] } : {}),
  };

  const reportEntry: ReportHistoryItem = {
    id: generateUniqueId("rh"),
    timestamp: now,
    author,
    comment: comment || undefined,
    media: media as FaultMedia[],
    source,
  };

  return {
    ...existingFault,
    // SLA is intentionally not modified: original createdAt and slaHours remain intact.
    comments: [...(existingFault.comments || []), newComment],
    media: [...(existingFault.media || []), ...(media as FaultMedia[])],
    photos: [
      ...(((existingFault as any).photos || []) as FaultMedia[]),
      ...(photos as FaultMedia[]),
    ],
    videos: [
      ...(((existingFault as any).videos || []) as FaultMedia[]),
      ...(videos as FaultMedia[]),
    ],
    repeat_count: (existingFault.repeat_count || 0) + 1,
    report_count:
      ((existingFault as Fault & { report_count?: number }).report_count || 1) + 1,
    report_history: [...(existingFault.report_history || []), reportEntry],
    history: [
      ...(existingFault.history || []),
      {
        id: generateUniqueId("h"),
        timestamp: now,
        user: author,
        actionType: "REPEAT_REPORT",
        type: "Pakartotinis pranešimas",
        reason: comment || undefined,
      },
      ...photos.map(() => ({
        id: generateUniqueId("h"),
        timestamp: now,
        user: author,
        actionType: "PHOTO_ADDED",
        type: "Papildyta foto",
      })),
      ...videos.map(() => ({
        id: generateUniqueId("h"),
        timestamp: now,
        user: author,
        actionType: "VIDEO_ADDED",
        type: "Papildytas video",
      })),
    ],
    updatedAt: now,
    updated_at: new Date(now).toISOString(),
    updatedBy: author,
  } as Fault;
}
