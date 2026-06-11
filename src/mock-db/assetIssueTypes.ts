import { equipmentIssueTypesList, type EquipmentIssueType } from "./admin";
import { assetTypes } from "./assetTypes";
import type { Priority } from "../types/faults";

export type AssetIssueTypeLegacySource = "equipmentIssueTypesList";

export interface AssetIssueType {
  id: string;
  assetTypeId: string;
  code: string;
  name: string;
  active: boolean;
  isDefault: boolean;
  priority: Priority;
  slaHours: number;
  sopUrl?: string;
  sopDescription?: string;
  legacySource: AssetIssueTypeLegacySource;
  legacyId: string;
}

const equipmentAssetTypeId =
  assetTypes.find((assetType) => assetType.code === "EQUIPMENT")?.id ||
  "asset-type-equipment";

const facilityAssetTypeId =
  assetTypes.find((assetType) => assetType.code === "FACILITY")?.id ||
  "asset-type-facility";

const getTargetAssetTypeIds = (issueType: EquipmentIssueType): string[] => {
  if (issueType.applies_to === "EQUIPMENT") return [equipmentAssetTypeId];
  if (issueType.applies_to === "FACILITY") return [facilityAssetTypeId];
  return [equipmentAssetTypeId, facilityAssetTypeId];
};

const normalizeCode = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const createAssetIssueType = (
  issueType: EquipmentIssueType,
  assetTypeId: string,
): AssetIssueType => ({
  id: `asset-issue-${assetTypeId}-${issueType.id}`,
  assetTypeId,
  code: normalizeCode(issueType.name) || issueType.id.toUpperCase(),
  name: issueType.name,
  active: true,
  isDefault: false,
  priority: issueType.priority,
  slaHours: issueType.sla_hours,
  legacySource: "equipmentIssueTypesList",
  legacyId: issueType.id,
});

export const assetIssueTypes: AssetIssueType[] = equipmentIssueTypesList.flatMap(
  (issueType) =>
    getTargetAssetTypeIds(issueType).map((assetTypeId) =>
      createAssetIssueType(issueType, assetTypeId),
    ),
);

export const getAssetIssueTypes = (
  issueTypes: AssetIssueType[] = assetIssueTypes,
): AssetIssueType[] => issueTypes;

export const getIssueTypesForAssetType = (
  assetTypeId: string,
  issueTypes: AssetIssueType[] = assetIssueTypes,
): AssetIssueType[] =>
  issueTypes.filter(
    (issueType) =>
      issueType.assetTypeId === assetTypeId && issueType.active !== false,
  );

export const getLegacyEquipmentIssueTypes = (
  issueTypes: AssetIssueType[] = assetIssueTypes,
): EquipmentIssueType[] =>
  getIssueTypesForAssetType(equipmentAssetTypeId, issueTypes).map(
    (issueType) => ({
      id: issueType.legacyId,
      name: issueType.name,
      priority: issueType.priority,
      sla_hours: issueType.slaHours,
      applies_to: "EQUIPMENT",
    }),
  );

export const getLegacyFacilityIssueTypes = (
  issueTypes: AssetIssueType[] = assetIssueTypes,
): EquipmentIssueType[] =>
  getIssueTypesForAssetType(facilityAssetTypeId, issueTypes).map(
    (issueType) => ({
      id: issueType.legacyId,
      name: issueType.name,
      priority: issueType.priority,
      sla_hours: issueType.slaHours,
      applies_to: "FACILITY",
    }),
  );

export const getLegacyIssueTypes = (
  issueTypes: AssetIssueType[] = assetIssueTypes,
): EquipmentIssueType[] => {
  const grouped = new Map<
    string,
    {
      base: AssetIssueType;
      assetTypeIds: Set<string>;
    }
  >();

  issueTypes
    .filter((issueType) => issueType.active !== false)
    .forEach((issueType) => {
      const key = issueType.legacyId || issueType.id;
      const existing = grouped.get(key);
      if (existing) {
        existing.assetTypeIds.add(issueType.assetTypeId);
        return;
      }

      grouped.set(key, {
        base: issueType,
        assetTypeIds: new Set([issueType.assetTypeId]),
      });
    });

  return Array.from(grouped.values()).map(({ base, assetTypeIds }) => {
    const appliesTo =
      assetTypeIds.has(equipmentAssetTypeId) &&
      assetTypeIds.has(facilityAssetTypeId)
        ? "BOTH"
        : assetTypeIds.has(facilityAssetTypeId)
          ? "FACILITY"
          : "EQUIPMENT";

    return {
      id: base.legacyId,
      name: base.name,
      priority: base.priority,
      sla_hours: base.slaHours,
      applies_to: appliesTo,
      is_default: base.isDefault,
      isDefault: base.isDefault,
      is_active: base.active,
      active: base.active,
    };
  });
};
