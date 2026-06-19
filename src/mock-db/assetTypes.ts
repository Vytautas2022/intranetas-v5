export type AssetTypeMode = "ASSET_FAULTS" | "ORDERS";

export interface AssetType {
  id: string;
  code: string;
  name: string;
  description?: string;
  mode: AssetTypeMode;
  active: boolean;
  usesQr: boolean;
  usesSla: boolean;
  usesPriority: boolean;
  usesIssueTypes: boolean;
  usesAssets: boolean;
}

export const assetTypes: AssetType[] = [
  {
    id: "asset-type-equipment",
    code: "EQUIPMENT",
    name: "Treniruokliai",
    mode: "ASSET_FAULTS",
    active: true,
    usesQr: true,
    usesSla: true,
    usesPriority: true,
    usesIssueTypes: true,
    usesAssets: true,
  },
  {
    id: "asset-type-facility",
    code: "FACILITY",
    name: "Patalpos",
    mode: "ASSET_FAULTS",
    active: true,
    usesQr: true,
    usesSla: true,
    usesPriority: true,
    usesIssueTypes: true,
    usesAssets: true,
  },
  {
    id: "asset-type-orders",
    code: "ORDERS",
    name: "Užsakymai",
    mode: "ORDERS",
    active: true,
    usesQr: false,
    usesSla: false,
    usesPriority: false,
    usesIssueTypes: false,
    usesAssets: false,
  },
];

export const getAssetTypeById = (id?: string | null): AssetType | undefined =>
  assetTypes.find((assetType) => assetType.id === id);
