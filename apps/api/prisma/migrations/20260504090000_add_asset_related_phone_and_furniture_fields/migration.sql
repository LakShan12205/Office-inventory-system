ALTER TABLE "Asset"
ADD COLUMN IF NOT EXISTS "relatedAssetId" TEXT,
ADD COLUMN IF NOT EXISTS "mobileNumber" TEXT,
ADD COLUMN IF NOT EXISTS "networkProvider" TEXT,
ADD COLUMN IF NOT EXISTS "simType" TEXT,
ADD COLUMN IF NOT EXISTS "packageType" TEXT;

CREATE INDEX IF NOT EXISTS "Asset_relatedAssetId_idx" ON "Asset"("relatedAssetId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'Asset_relatedAssetId_fkey'
      AND table_name = 'Asset'
  ) THEN
    ALTER TABLE "Asset"
    ADD CONSTRAINT "Asset_relatedAssetId_fkey"
    FOREIGN KEY ("relatedAssetId") REFERENCES "Asset"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
