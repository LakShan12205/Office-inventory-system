import { z } from "zod";

const optionalTrimmedString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}, z.string().trim().optional());

const nullableTrimmedString = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}, z.string().trim().nullable().optional());

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
  "IN_STORE",
  "IN_REPAIR",
  "TEMPORARY_REPLACEMENT",
  "DAMAGED",
  "RETIRED",
  "ARCHIVED"
]);

export const assetRegistrationTypeSchema = z.enum(["NEW_PURCHASE", "LEGACY_ASSET"]);
export const assetScopeSchema = z.enum(["WORKSTATION_DEVICE", "OTHER_NON_WORKSTATION_DEVICE"]);
export const assignmentTypeSchema = z.enum(["PRIMARY", "TEMPORARY_REPLACEMENT", "SPARE"]);
export const assignmentStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export const repairTypeSchema = z.enum(["ON_SITE", "SENT_TO_SHOP"]);
export const repairStatusSchema = z.enum(["REPORTED", "SENT", "IN_PROGRESS", "RETURNED", "CLOSED"]);
export const replacementStatusSchema = z.enum(["ACTIVE", "REMOVED", "PENDING_RESTORE"]);
export const alertStatusSchema = z.enum(["NEW", "READ", "RESOLVED"]);
export const alertPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const simTypeSchema = optionalEnumValue(["Physical SIM", "eSIM"]);
const networkProviderSchema = optionalEnumValue(["Mobitel", "Dialog", "Hutch", "Airtel"]);
const adapterTypeSchema = optionalEnumValue([
  "Laptop Charger",
  "Monitor Adapter",
  "TV Adapter",
  "Router Adapter",
  "Switch Adapter",
  "Phone Charger",
  "Tablet Charger",
  "CCTV Adapter",
  "Other"
]);

export const workstationQuerySchema = z.object({
  search: optionalTrimmedString,
  status: optionalEnumValue(["ACTIVE", "NEEDS_ATTENTION", "UNDER_MAINTENANCE", "INACTIVE"]),
  location: optionalTrimmedString
});

export const assetQuerySchema = z.object({
  search: optionalTrimmedString,
  type: optionalTrimmedString,
  location: optionalTrimmedString,
  registrationType: optionalEnumValue(["NEW_PURCHASE", "LEGACY_ASSET"]),
  completeness: optionalEnumValue([
    "COMPLETE",
    "PARTIALLY_COMPLETE",
    "INCOMPLETE",
    "NEEDS_VERIFICATION",
    "MISSING_INFORMATION"
  ]),
  missingField: optionalEnumValue([
    "SERIAL_NUMBER",
    "BRAND",
    "MODEL",
    "PURCHASE_DATE",
    "WARRANTY",
    "INVOICE"
  ]),
  status: optionalEnumValue([
    "ACTIVE",
    "IN_STORE",
    "IN_REPAIR",
    "TEMPORARY_REPLACEMENT",
    "DAMAGED",
    "RETIRED",
    "ARCHIVED"
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
  registrationType: assetRegistrationTypeSchema.default("NEW_PURCHASE"),
  relatedAssetId: nullableTrimmedString,
  brand: nullableTrimmedString,
  model: nullableTrimmedString,
  serialNumber: nullableTrimmedString,
  mobileNumber: nullableTrimmedString,
  networkProvider: networkProviderSchema.nullable(),
  simType: simTypeSchema.nullable(),
  adapterType: adapterTypeSchema.nullable(),
  otherAdapterType: nullableTrimmedString,
  specification: nullableTrimmedString,
  purchaseDate: z.string().datetime().optional().nullable(),
  warrantyExpiryDate: z.string().datetime().optional().nullable(),
  status: assetStatusSchema,
  assetScope: assetScopeSchema.optional().nullable(),
  currentLocation: nullableTrimmedString,
  invoiceFileName: nullableTrimmedString,
  invoiceFileUrl: nullableTrimmedString,
  invoiceFileType: nullableTrimmedString,
  invoiceFileSize: z.coerce.number().int().nonnegative().optional().nullable(),
  assignment: z
    .object({
      workstationCode: nullableTrimmedString,
      generalLocation: nullableTrimmedString,
      specificLocationNotes: nullableTrimmedString,
      side: nullableTrimmedString,
      position: nullableTrimmedString,
      status: assignmentStatusSchema.optional(),
      startDate: z.string().datetime().optional()
    })
    .optional()
    .nullable(),
  notes: nullableTrimmedString
}).superRefine((input, ctx) => {
  if (input.registrationType === "NEW_PURCHASE") {
    if (!input.brand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["brand"],
        message: "Brand is required for new purchases."
      });
    }

    if (!input.model) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model"],
        message: "Model is required for new purchases."
      });
    }

    if (!input.serialNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["serialNumber"],
        message: "Serial number is required for new purchases."
      });
    }

    if (!input.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["purchaseDate"],
        message: "Purchase date is required for new purchases."
      });
    }

    if (!input.warrantyExpiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["warrantyExpiryDate"],
        message: "Warranty expiry date is required for new purchases."
      });
    }
  }

  if (input.registrationType === "LEGACY_ASSET" && !input.brand && !input.model) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["brand"],
      message: "For legacy assets, enter at least a brand or a model."
    });
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["model"],
      message: "For legacy assets, enter at least a model or a brand."
    });
  }
});

export const workstationAssignmentPayloadSchema = z.object({
  assetId: z.string().trim().min(1),
  assignmentType: assignmentTypeSchema.default("PRIMARY"),
  assignedDate: z.string().datetime().optional(),
  notes: z.string().trim().optional().nullable()
});

export const repairPayloadSchema = z.object({
  workstationId: z.string().trim().min(1).optional().nullable(),
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

export const repairReturnSchema = z.object({
  action: z.enum(["RETURN_TO_WORKSTATION", "MOVE_TO_STORE"]),
  repairedBy: z.string().trim().min(2),
  notes: z.string().trim().optional().nullable()
});

export const replacementPayloadSchema = z.object({
  originalAssetId: z.string().trim().min(1),
  replacementAssetId: z.string().trim().min(1),
  replacementType: z.enum(["TEMPORARY", "PERMANENT"]),
  replacementDate: z.string().datetime(),
  reason: z.enum(["DUE_TO_ONGOING_REPAIR", "NOT_WORKING", "OTHER"]),
  customReason: z.string().trim().optional().nullable(),
  workstationId: z.string().trim().optional().nullable()
});

export const alertUpdateSchema = z.object({
  status: alertStatusSchema,
  resolvedAt: z.string().datetime().optional().nullable()
});
