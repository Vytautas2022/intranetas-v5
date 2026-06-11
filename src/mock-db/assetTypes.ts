export interface AssetType {
  id: string;
  code: string;
  name: string;
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
    active: true,
    usesQr: false,
    usesSla: false,
    usesPriority: false,
    usesIssueTypes: false,
    usesAssets: false,
  },
  {
    id: "asset-type-generic",
    code: "GENERIC",
    name: "Bendrinis",
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
