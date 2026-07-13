CREATE TYPE "AssetRegistrationType" AS ENUM ('NEW_PURCHASE', 'LEGACY_ASSET');
CREATE TYPE "AssetDataCompleteness" AS ENUM ('COMPLETE', 'PARTIALLY_COMPLETE', 'INCOMPLETE', 'NEEDS_VERIFICATION');

ALTER TABLE "Asset"
ADD COLUMN "registrationType" "AssetRegistrationType" NOT NULL DEFAULT 'NEW_PURCHASE',
ADD COLUMN "dataCompleteness" "AssetDataCompleteness" NOT NULL DEFAULT 'COMPLETE';

ALTER TABLE "Asset"
ALTER COLUMN "brand" DROP NOT NULL,
ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "serialNumber" DROP NOT NULL;

UPDATE "Asset"
SET "dataCompleteness" = CASE
  WHEN COALESCE(BTRIM("brand"), '') = '' AND COALESCE(BTRIM("model"), '') = '' THEN 'INCOMPLETE'::"AssetDataCompleteness"
  WHEN COALESCE(BTRIM("brand"), '') <> ''
    AND COALESCE(BTRIM("model"), '') <> ''
    AND COALESCE(BTRIM("serialNumber"), '') <> ''
    AND "purchaseDate" IS NOT NULL
    AND "warrantyExpiryDate" IS NOT NULL
    AND (COALESCE(BTRIM("invoiceFileName"), '') <> '' OR COALESCE(BTRIM("invoiceFileUrl"), '') <> '')
    THEN 'COMPLETE'::"AssetDataCompleteness"
  ELSE 'PARTIALLY_COMPLETE'::"AssetDataCompleteness"
END;

CREATE INDEX "Asset_registrationType_idx" ON "Asset"("registrationType");
CREATE INDEX "Asset_dataCompleteness_idx" ON "Asset"("dataCompleteness");
