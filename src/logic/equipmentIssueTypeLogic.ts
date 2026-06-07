import {
  equipmentIssueTypesList,
  type EquipmentIssueType,
} from "../mock-db/admin";

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

export const getDefaultEquipmentIssueTypeForQr = (
  issueTypes: ConfiguredEquipmentIssueType[] = equipmentIssueTypesList,
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
