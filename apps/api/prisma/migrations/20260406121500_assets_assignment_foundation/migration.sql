-- Ensure AssetStatus exists before trying to extend it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AssetStatus'
  ) THEN
    CREATE TYPE "AssetStatus" AS ENUM ('ACTIVE', 'IN_STORE', 'IN_REPAIR', 'ARCHIVED');
  END IF;
END
$$;

-- Add the new archival asset status if the enum already existed without it.
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'ARCHIVED';

-- New enums to separate static asset data from assignment state.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AssetScope'
  ) THEN
    CREATE TYPE "AssetScope" AS ENUM ('WORKSTATION_DEVICE', 'OTHER_NON_WORKSTATION_DEVICE');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'AssignmentStatus'
  ) THEN
    CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END
$$;

-- Asset stores static inventory data only.
ALTER TABLE "Asset"
ADD COLUMN "assetScope" "AssetScope",
ADD COLUMN "invoiceFileName" TEXT,
ADD COLUMN "invoiceFileUrl" TEXT,
ADD COLUMN "warrantyExpiryDate" TIMESTAMP(3);

-- WorkstationAsset is extended into a broader assignment record that can also
-- represent non-workstation placement.
ALTER TABLE "WorkstationAsset"
ALTER COLUMN "workstationId" DROP NOT NULL,
ADD COLUMN "endDate" TIMESTAMP(3),
ADD COLUMN "generalLocation" TEXT,
ADD COLUMN "side" TEXT,
ADD COLUMN "specificLocationNotes" TEXT,
ADD COLUMN "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE';

-- Backfill the new assignment lifecycle fields from the existing active/inactive markers.
UPDATE "WorkstationAsset"
SET
  "startDate" = COALESCE("assignedDate", CURRENT_TIMESTAMP),
  "endDate" = "unassignedDate",
  "status" = CASE
    WHEN "isActive" THEN 'ACTIVE'::"AssignmentStatus"
    ELSE 'INACTIVE'::"AssignmentStatus"
  END;

-- Backfill a basic asset scope for workstation-linked assets.
UPDATE "Asset"
SET "assetScope" = 'WORKSTATION_DEVICE'::"AssetScope"
WHERE EXISTS (
  SELECT 1
  FROM "WorkstationAsset"
  WHERE "WorkstationAsset"."assetId" = "Asset"."id"
    AND "WorkstationAsset"."isActive" = true
);

CREATE INDEX "WorkstationAsset_workstationId_status_idx"
ON "WorkstationAsset"("workstationId", "status");

CREATE INDEX "WorkstationAsset_assetId_status_idx"
ON "WorkstationAsset"("assetId", "status");

CREATE INDEX "WorkstationAsset_generalLocation_status_idx"
ON "WorkstationAsset"("generalLocation", "status");