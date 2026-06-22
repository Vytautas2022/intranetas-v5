import {
  equipmentList,
  facilityTemplates,
  type Equipment,
  type FacilityTemplate,
} from "./admin";
import { assetTypes } from "./assetTypes";
import { clubs } from "./clubs";
import { qrEquipment, qrLocations } from "./qr-mapping";
import { buildAssetQrUrl } from "../logic/assetQrLogic";

export interface AssetObject {
  id: string;
  assetTypeId: string;
  code: string;
  name: string;
  active: boolean;
  clubId?: string;
  regionId?: string;
  qrUrl?: string;
  metadata?: Record<string, unknown>;
}

const equipmentAssetTypeId =
  assetTypes.find((assetType) => assetType.code === "EQUIPMENT")?.id ||
  "asset-type-equipment";

const facilityAssetTypeId =
  assetTypes.find((assetType) => assetType.code === "FACILITY")?.id ||
  "asset-type-facility";

const getClubRegion = (clubId?: string) =>
  clubs.find((club) => club.id === clubId)?.region;

export const assetObjects: AssetObject[] = [
  ...equipmentList.map((equipment) => {
    const id = `asset-object-equipment-${equipment.id}`;
    return {
      id,
      assetTypeId: equipmentAssetTypeId,
      code: equipment.number || equipment.id,
      name: equipment.name,
      active: equipment.is_active !== false,
      clubId: equipment.club_id,
      regionId: getClubRegion(equipment.club_id),
      qrUrl: equipment.qr_url || buildAssetQrUrl(id),
      metadata: {
        legacySource: "equipmentList",
        legacyId: equipment.id,
        zone: equipment.zone,
        imageUrl: equipment.image_url,
      },
    };
  }),
  ...qrEquipment
    .filter(
      (equipment) =>
        !equipmentList.some((seedEquipment) => seedEquipment.id === equipment.id),
    )
    .map((equipment) => {
      const id = `asset-object-equipment-${equipment.id}`;
      return {
        id,
        assetTypeId: equipmentAssetTypeId,
        code: equipment.number || equipment.id,
        name: equipment.name,
        active: true,
        clubId: equipment.clubId,
        regionId: getClubRegion(equipment.clubId),
        qrUrl: buildAssetQrUrl(id),
        metadata: {
          legacySource: "qrEquipment",
          legacyId: equipment.id,
          zone: "General",
        },
      };
    }),
  ...facilityTemplates.map((template) => {
    const id = `asset-object-facility-${template.id}`;
    return {
      id,
      assetTypeId: facilityAssetTypeId,
      code: template.id,
      name: template.name,
      active: true,
      clubId: template.club_id || undefined,
      regionId: getClubRegion(template.club_id || undefined),
      qrUrl: buildAssetQrUrl(id),
      metadata: {
        legacySource: "facilityTemplates",
        legacyId: template.id,
        priority: template.priority,
        slaHours: template.sla_hours,
        sopUrl: template.sop_url,
        sopDescription: template.sop_description,
      },
    };
  }),
  ...qrLocations.map((location) => {
    const id = `asset-object-facility-${location.id}`;
    return {
      id,
      assetTypeId: facilityAssetTypeId,
      code: location.id,
      name: location.name,
      active: true,
      clubId: location.clubId,
      regionId: getClubRegion(location.clubId),
      qrUrl: buildAssetQrUrl(id),
      metadata: {
        legacySource: "qrLocations",
        legacyId: location.id,
      },
    };
  }),
];

export const getAssetObjects = (
  objects: AssetObject[] = assetObjects,
): AssetObject[] => objects;

export const getAssetObjectsForAssetType = (
  assetTypeId: string,
  objects: AssetObject[] = assetObjects,
): AssetObject[] =>
  objects.filter(
    (object) => object.assetTypeId === assetTypeId && object.active !== false,
  );

export const getEquipmentAssetObjects = (
  objects: AssetObject[] = assetObjects,
): Equipment[] =>
  getAssetObjectsForAssetType(equipmentAssetTypeId, objects).map((object) => ({
    id:
      typeof object.metadata?.legacyId === "string"
        ? object.metadata.legacyId
        : object.id,
    club_id: object.clubId || "",
    number: object.code,
    name: object.name,
    zone:
      typeof object.metadata?.zone === "string"
        ? object.metadata.zone
        : "General",
    image_url:
      typeof object.metadata?.imageUrl === "string"
        ? object.metadata.imageUrl
        : undefined,
    is_active: object.active !== false,
    qr_url: object.qrUrl,
  }));

export type FacilityAssetObject = FacilityTemplate & {
  clubId?: string;
  locationId?: string;
};

export const getFacilityAssetObjects = (
  objects: AssetObject[] = assetObjects,
): FacilityAssetObject[] =>
  getAssetObjectsForAssetType(facilityAssetTypeId, objects).map((object) => {
    const legacySource =
      typeof object.metadata?.legacySource === "string"
        ? object.metadata.legacySource
        : "";
    const legacyId =
      typeof object.metadata?.legacyId === "string"
        ? object.metadata.legacyId
        : object.id;
    const slaHours =
      typeof object.metadata?.slaHours === "number"
        ? object.metadata.slaHours
        : 24;
    const priority =
      object.metadata?.priority === "low" ||
      object.metadata?.priority === "medium" ||
      object.metadata?.priority === "high" ||
      object.metadata?.priority === "critical"
        ? object.metadata.priority
        : "medium";

    return {
      id: legacyId,
      name: object.name,
      club_id: object.clubId || null,
      clubId: object.clubId,
      locationId: legacySource === "qrLocations" ? legacyId : undefined,
      priority,
      sla_hours: slaHours,
      sop_url:
        typeof object.metadata?.sopUrl === "string"
          ? object.metadata.sopUrl
          : undefined,
      sop_description:
        typeof object.metadata?.sopDescription === "string"
          ? object.metadata.sopDescription
          : undefined,
    };
  });
