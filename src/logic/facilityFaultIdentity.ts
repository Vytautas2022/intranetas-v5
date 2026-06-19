import type { Fault } from "../mock-db/faults";
import { Status } from "../types/faults";

type FacilityIdentity = Pick<Fault, "assetObjectId" | "equipment_id" | "location_id">;

export const getFacilityAssetObjectIdFromLegacy = (
  facilityObjectId?: string,
): string => (facilityObjectId ? `asset-object-facility-${facilityObjectId}` : "");

export const getFaultFacilityAssetObjectId = (
  fault?: Partial<FacilityIdentity> | null,
): string =>
  fault?.assetObjectId ||
  getFacilityAssetObjectIdFromLegacy(fault?.location_id || fault?.equipment_id);

export const getFacilityIdentityFields = (
  facilityObjectId?: string,
  options: { isLocation?: boolean } = {},
): Pick<Fault, "assetObjectId" | "equipment_id" | "location_id"> | Record<string, never> => {
  if (!facilityObjectId) return {};

  return {
    assetObjectId: getFacilityAssetObjectIdFromLegacy(facilityObjectId),
    ...(options.isLocation
      ? { location_id: facilityObjectId }
      : { equipment_id: facilityObjectId }),
  };
};

export const ACTIVE_FACILITY_FAULT_STATUSES = [
  Status.NEW,
  Status.IN_PROGRESS,
  Status.WAITING_DETAILS,
];

export const findActiveFacilityFault = (
  faults: Fault[],
  assetObjectId?: string,
  workflowTypeId?: string,
): Fault | undefined => {
  if (!assetObjectId) return undefined;

  return faults.find((fault) => {
    const isFacilityFault =
      fault.type === "FACILITY_FAULT" || fault.category === "FACILITY_FAULT";
    const isSameWorkflow =
      !workflowTypeId ||
      !(fault as Fault & { workflowTypeId?: string }).workflowTypeId ||
      (fault as Fault & { workflowTypeId?: string }).workflowTypeId === workflowTypeId;

    return (
      fault.entityType === "fault" &&
      isFacilityFault &&
      isSameWorkflow &&
      getFaultFacilityAssetObjectId(fault) === assetObjectId &&
      ACTIVE_FACILITY_FAULT_STATUSES.includes(fault.status as Status)
    );
  });
};
