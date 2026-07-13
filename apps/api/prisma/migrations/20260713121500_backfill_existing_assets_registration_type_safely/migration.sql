UPDATE "Asset"
SET "registrationType" = CASE
  WHEN "deletedAt" IS NOT NULL THEN "registrationType"
  WHEN COALESCE(BTRIM("brand"), '') <> ''
    AND COALESCE(BTRIM("model"), '') <> ''
    AND COALESCE(BTRIM("serialNumber"), '') <> ''
    AND "purchaseDate" IS NOT NULL
    AND "warrantyExpiryDate" IS NOT NULL
    THEN 'NEW_PURCHASE'::"AssetRegistrationType"
  ELSE 'LEGACY_ASSET'::"AssetRegistrationType"
END
WHERE "registrationType" IS DISTINCT FROM CASE
  WHEN "deletedAt" IS NOT NULL THEN "registrationType"
  WHEN COALESCE(BTRIM("brand"), '') <> ''
    AND COALESCE(BTRIM("model"), '') <> ''
    AND COALESCE(BTRIM("serialNumber"), '') <> ''
    AND "purchaseDate" IS NOT NULL
    AND "warrantyExpiryDate" IS NOT NULL
    THEN 'NEW_PURCHASE'::"AssetRegistrationType"
  ELSE 'LEGACY_ASSET'::"AssetRegistrationType"
END;

UPDATE "Asset"
SET "dataCompleteness" = CASE
  WHEN "deletedAt" IS NOT NULL THEN "dataCompleteness"
  WHEN COALESCE(BTRIM("assetCode"), '') = ''
    OR "assetTypeId" IS NULL
    OR COALESCE(BTRIM("status"::text), '') = ''
    THEN 'INCOMPLETE'::"AssetDataCompleteness"
  WHEN "registrationType" = 'LEGACY_ASSET'::"AssetRegistrationType"
    AND COALESCE(BTRIM("brand"), '') = ''
    AND COALESCE(BTRIM("model"), '') = ''
    THEN 'INCOMPLETE'::"AssetDataCompleteness"
  WHEN "registrationType" = 'NEW_PURCHASE'::"AssetRegistrationType"
    AND (
      COALESCE(BTRIM("brand"), '') = ''
      OR COALESCE(BTRIM("model"), '') = ''
      OR COALESCE(BTRIM("serialNumber"), '') = ''
      OR "purchaseDate" IS NULL
      OR "warrantyExpiryDate" IS NULL
    )
    THEN 'INCOMPLETE'::"AssetDataCompleteness"
  WHEN COALESCE(BTRIM("brand"), '') <> ''
    AND COALESCE(BTRIM("model"), '') <> ''
    AND COALESCE(BTRIM("serialNumber"), '') <> ''
    AND "purchaseDate" IS NOT NULL
    AND "warrantyExpiryDate" IS NOT NULL
    AND (COALESCE(BTRIM("invoiceFileName"), '') <> '' OR COALESCE(BTRIM("invoiceFileUrl"), '') <> '')
    THEN 'COMPLETE'::"AssetDataCompleteness"
  ELSE 'PARTIALLY_COMPLETE'::"AssetDataCompleteness"
END
WHERE "deletedAt" IS NULL;

