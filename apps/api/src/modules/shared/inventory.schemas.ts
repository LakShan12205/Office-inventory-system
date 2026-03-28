import { z } from "zod";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().optional());

function optionalEnumValue<T extends [string, ...string[]]>(values: T) {
  return z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }, z.enum(values).optional());
}

export const workstationStatusSchema = z.enum([
  "ACTIVE",
  "NEEDS_ATTENTION",
  "UNDER_MAINTENANCE",
  "INACTIVE"
]);

export const assetStatusSchema = z.enum([
  "ACTIVE",
  "IN_REPAIR",
  "IN_STORE",
  "TEMPORARY_REPLACEMENT",
  "DAMAGED",
  "RETIRED"
]);

export const assignmentTypeSchema = z.enum(["PRIMARY", "TEMPORARY_REPLACEMENT", "SPARE"]);
export const repairTypeSchema = z.enum(["ON_SITE", "SENT_TO_SHOP"]);
export const repairStatusSchema = z.enum(["REPORTED", "SENT", "IN_PROGRESS", "RETURNED", "CLOSED"]);
export const replacementStatusSchema = z.enum(["ACTIVE", "REMOVED", "PENDING_RESTORE"]);
export const alertStatusSchema = z.enum(["NEW", "READ", "RESOLVED"]);
export const alertPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const workstationQuerySchema = z.object({
  search: optionalTrimmedString,
  status: optionalEnumValue(["ACTIVE", "NEEDS_ATTENTION", "UNDER_MAINTENANCE", "INACTIVE"]),
  location: optionalTrimmedString
});

export const assetQuerySchema = z.object({
  search: optionalTrimmedString,
  type: optionalTrimmedString,
  status: optionalEnumValue([
    "ACTIVE",
    "IN_REPAIR",
    "IN_STORE",
    "TEMPORARY_REPLACEMENT",
    "DAMAGED",
    "RETIRED"
  ])
});

export const repairQuerySchema = z.object({
  status: optionalEnumValue(["REPORTED", "SENT", "IN_PROGRESS", "RETURNED", "CLOSED"]),
  workstationId: optionalTrimmedString,
  assetId: optionalTrimmedString
});

export const alertsQuerySchema = z.object({
  status: optionalEnumValue(["NEW", "READ", "RESOLVED"]),
  priority: optionalEnumValue(["LOW", "MEDIUM", "HIGH"]),
  workstationId: optionalTrimmedString
});

export const workstationPayloadSchema = z.object({
  code: z.string().trim().min(2),
  name: z.string().trim().min(2),
  location: z.string().trim().min(2),
  status: workstationStatusSchema,
  notes: z.string().trim().optional().nullable()
});

export const assetPayloadSchema = z.object({
  assetCode: z.string().trim().min(3),
  assetTypeId: z.string().trim().min(1),
  brand: z.string().trim().min(1),
  model: z.string().trim().min(1),
  serialNumber: z.string().trim().min(1),
  specification: z.string().trim().optional().nullable(),
  purchaseDate: z.string().datetime().optional().nullable(),
  status: assetStatusSchema,
  currentLocation: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable()
});

export const workstationAssignmentPayloadSchema = z.object({
  assetId: z.string().trim().min(1),
  assignmentType: assignmentTypeSchema.default("PRIMARY"),
  assignedDate: z.string().datetime().optional(),
  notes: z.string().trim().optional().nullable()
});

export const repairPayloadSchema = z.object({
  workstationId: z.string().trim().min(1),
  assetId: z.string().trim().min(1),
  reportedDate: z.string().datetime(),
  faultDescription: z.string().trim().min(5),
  sentTo: z.string().trim().optional().nullable(),
  repairType: repairTypeSchema,
  sentDate: z.string().datetime().optional().nullable(),
  expectedReturnDate: z.string().datetime().optional().nullable(),
  actualReturnDate: z.string().datetime().optional().nullable(),
  diagnosis: z.string().trim().optional().nullable(),
  repairAction: z.string().trim().optional().nullable(),
  partsChanged: z.string().trim().optional().nullable(),
  cost: z.coerce.number().nonnegative().optional().nullable(),
  handledBy: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
  status: repairStatusSchema,
  replacementAssetId: z.string().trim().optional().nullable(),
  replacementDate: z.string().datetime().optional().nullable(),
  replacementReturnDate: z.string().datetime().optional().nullable(),
  replacementStatus: replacementStatusSchema.optional(),
  replacementNotes: z.string().trim().optional().nullable()
});

export const repairUpdateSchema = repairPayloadSchema.partial().extend({
  replacementStatus: replacementStatusSchema.optional()
});

export const replacementPayloadSchema = z.object({
  repairId: z.string().trim().min(1),
  originalAssetId: z.string().trim().min(1),
  replacementAssetId: z.string().trim().min(1),
  workstationId: z.string().trim().min(1),
  replacementDate: z.string().datetime(),
  replacementReturnDate: z.string().datetime().optional().nullable(),
  status: replacementStatusSchema,
  notes: z.string().trim().optional().nullable()
});

export const alertUpdateSchema = z.object({
  status: alertStatusSchema,
  resolvedAt: z.string().datetime().optional().nullable()
});
