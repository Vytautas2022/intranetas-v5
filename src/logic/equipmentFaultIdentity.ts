import type { Fault } from "../mock-db/faults";
import { Status } from "../types/faults";

type EquipmentIdentity = Pick<Fault, "equipmentId" | "equipment_id">;

export const getFaultEquipmentId = (
  fault?: Partial<EquipmentIdentity> | null,
): string => fault?.equipmentId || fault?.equipment_id || "";

export const getEquipmentIdentityFields = (
  equipmentId?: string,
): Pick<Fault, "equipmentId" | "equipment_id"> | Record<string, never> =>
  equipmentId ? { equipmentId, equipment_id: equipmentId } : {};

export const ACTIVE_EQUIPMENT_FAULT_STATUSES = [
  Status.NEW,
  Status.IN_PROGRESS,
  Status.WAITING_DETAILS,
];

export const findActiveEquipmentFault = (
  faults: Fault[],
  equipmentId?: string,
): Fault | undefined => {
  if (!equipmentId) return undefined;

  return faults.find(
    (fault) =>
      fault.entityType === "fault" &&
      fault.type === "EQUIPMENT_FAULT" &&
      getFaultEquipmentId(fault) === equipmentId &&
      ACTIVE_EQUIPMENT_FAULT_STATUSES.includes(fault.status as Status),
  );
};
