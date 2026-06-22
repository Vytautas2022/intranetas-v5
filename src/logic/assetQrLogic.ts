import type { AssetObject } from "../mock-db/assetObjects";

export const buildAssetQrUrl = (assetId: string): string =>
  `/qr/${encodeURIComponent(assetId)}`;

export const ensureAssetQrUrl = <T extends Pick<AssetObject, "id" | "qrUrl">>(
  assetObject: T,
): T =>
  assetObject.qrUrl
    ? assetObject
    : {
        ...assetObject,
        qrUrl: buildAssetQrUrl(assetObject.id),
      };

export const ensureAssetQrUrls = <T extends Pick<AssetObject, "id" | "qrUrl">>(
  assetObjects: T[],
): T[] => assetObjects.map(ensureAssetQrUrl);
