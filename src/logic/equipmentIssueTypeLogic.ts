import type { EquipmentIssueType } from "../mock-db/admin";
import {
  getLegacyEquipmentIssueTypes,
  getLegacyFacilityIssueTypes,
} from "../mock-db/assetIssueTypes";

type ConfiguredEquipmentIssueType = EquipmentIssueType & {
  is_default?: boolean;
  isDefault?: boolean;
  is_active?: boolean;
  active?: boolean;
};

const priorityRank: Record<EquipmentIssueType["priority"], number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const isActiveEquipmentIssueType = (issueType: ConfiguredEquipmentIssueType) =>
  issueType.is_active !== false &&
  issueType.active !== false &&
  (issueType.applies_to === "EQUIPMENT" ||
    issueType.applies_to === "BOTH" ||
    !issueType.applies_to);

const isDefaultEquipmentIssueType = (issueType: ConfiguredEquipmentIssueType) =>
  issueType.is_default === true || issueType.isDefault === true;

const isActiveFacilityIssueType = (issueType: ConfiguredEquipmentIssueType) =>
  issueType.is_active !== false &&
  issueType.active !== false &&
  (issueType.applies_to === "FACILITY" ||
    issueType.applies_to === "BOTH" ||
    !issueType.applies_to);

export const getDefaultEquipmentIssueTypeForQr = (
  issueTypes: ConfiguredEquipmentIssueType[] = getLegacyEquipmentIssueTypes(),
): EquipmentIssueType | null => {
  const activeIssueTypes = issueTypes.filter(isActiveEquipmentIssueType);
  const defaultIssueTypes = activeIssueTypes.filter(isDefaultEquipmentIssueType);

  if (defaultIssueTypes.length > 1) {
    console.warn(
      "[equipment-issues] Multiple default equipment issue types configured for QR; using the first default.",
    );
  }

  if (defaultIssueTypes.length > 0) return defaultIssueTypes[0];

  return (
    [...activeIssueTypes].sort(
      (a, b) => priorityRank[b.priority] - priorityRank[a.priority],
    )[0] || null
  );
};

export const getDefaultFacilityIssueTypeForQr = (
  issueTypes: ConfiguredEquipmentIssueType[] = getLegacyFacilityIssueTypes(),
): EquipmentIssueType | null => {
  const activeIssueTypes = issueTypes.filter(isActiveFacilityIssueType);
  const defaultIssueTypes = activeIssueTypes.filter(isDefaultEquipmentIssueType);

  if (defaultIssueTypes.length > 1) {
    console.warn(
      "[facility-issues] Multiple default facility issue types configured for QR; using the first default.",
    );
  }

  if (defaultIssueTypes.length > 0) return defaultIssueTypes[0];

  return (
    [...activeIssueTypes].sort(
      (a, b) => priorityRank[b.priority] - priorityRank[a.priority],
    )[0] || null
  );
};
