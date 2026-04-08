import createError from "http-errors";
import { prisma } from "../../db/prisma";

const CURRENT_WORKSTATION_ASSET_STATUSES = ["ACTIVE", "TEMPORARY_REPLACEMENT"] as const;

const currentWorkstationAssignmentWhere = {
  isActive: true,
  status: "ACTIVE" as const,
  asset: {
    deletedAt: null,
    status: { in: [...CURRENT_WORKSTATION_ASSET_STATUSES] }
  }
};

const workstationInclude = {
  assets: {
    where: currentWorkstationAssignmentWhere,
    include: {
      asset: {
        include: {
          assetType: true
        }
      }
    },
    orderBy: { assignedDate: "desc" as const }
  },
  repairs: {
    where: { deletedAt: null },
    include: {
      asset: { include: { assetType: true } },
      replacementLog: {
        include: {
          replacementAsset: true,
          originalAsset: true
        }
      }
    },
    orderBy: { reportedDate: "desc" as const }
  },
  alerts: {
    include: {
      asset: true,
      repair: true
    },
    orderBy: { alertDate: "desc" as const },
    take: 8
  }
};

const repairInclude = {
  workstation: true,
  asset: { include: { assetType: true } },
  replacementLog: {
    include: {
      originalAsset: true,
      replacementAsset: true,
      workstation: true
    }
  }
};

const alertInclude = {
  workstation: true,
  asset: { include: { assetType: true } },
  repair: true
};

const assetAssignmentInclude = {
  workstation: true
};

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function flowCodeFromWorkstationCode(code?: string | null) {
  if (!code) return null;
  const numeric = Number.parseInt(code.replace(/\D/g, ""), 10);

  if (Number.isNaN(numeric)) return null;
  if (numeric >= 1 && numeric <= 6) return "2nd Flow";
  if (numeric >= 7 && numeric <= 12) return "1st Flow";
  return null;
}

function assetScopeLabel(scope?: string | null, hasWorkstationAssignment?: boolean) {
  if (scope === "WORKSTATION_DEVICE") return "Workstation Device";
  if (scope === "OTHER_NON_WORKSTATION_DEVICE") return "Other / Non-Workstation Device";
  return hasWorkstationAssignment ? "Workstation Device" : null;
}

function getActiveAssignment<T extends {
  workstationId?: string | null;
  workstation?: { code: string } | null;
  generalLocation?: string | null;
  specificLocationNotes?: string | null;
  side?: string | null;
  position?: string | null;
  status?: string | null;
  isActive?: boolean | null;
}>(assignments: T[]) {
  return (
    assignments.find((assignment) => assignment.status === "ACTIVE") ??
    assignments.find((assignment) => assignment.isActive) ??
    assignments[0] ??
    null
  );
}

function displayLocationFromAssignment(assignment?: {
  workstation?: { code: string } | null;
  generalLocation?: string | null;
  specificLocationNotes?: string | null;
  side?: string | null;
  position?: string | null;
} | null) {
  if (!assignment) return null;

  if (assignment.workstation?.code) {
    return [assignment.workstation.code, assignment.side, assignment.position].filter(Boolean).join(" / ");
  }

  return [assignment.specificLocationNotes || assignment.generalLocation, assignment.side, assignment.position]
    .filter(Boolean)
    .join(" / ") || null;
}

function mapAssetRecord<T extends {
  currentLocation?: string | null;
  assetScope?: string | null;
  warrantyExpiryDate?: Date | null;
  workstationAssignments: Array<{
    id: string;
    assignmentType: string;
    assignedDate: Date;
    unassignedDate?: Date | null;
    isActive: boolean;
    status?: string | null;
    generalLocation?: string | null;
    specificLocationNotes?: string | null;
    side?: string | null;
    position?: string | null;
    workstation?: { id: string; code: string; name: string } | null;
  }>;
}>(asset: T) {
  const activeAssignment = getActiveAssignment(asset.workstationAssignments);
  const currentLocationDisplay =
    displayLocationFromAssignment(activeAssignment) ?? asset.currentLocation ?? null;

  return {
    ...asset,
    warrantyExpiryDate: asset.warrantyExpiryDate?.toISOString() ?? null,
    assetScope:
      assetScopeLabel(asset.assetScope, Boolean(activeAssignment?.workstation?.code)) ?? undefined,
    currentLocation: currentLocationDisplay,
    currentLocationDisplay,
    displayLocation: currentLocationDisplay,
    workstationCode: activeAssignment?.workstation?.code ?? null,
    flow:
      flowCodeFromWorkstationCode(activeAssignment?.workstation?.code) ??
      activeAssignment?.generalLocation ??
      null,
    generalLocation: activeAssignment?.generalLocation ?? null,
    specificLocationNotes: activeAssignment?.specificLocationNotes ?? null,
    side: activeAssignment?.side ?? null,
    position: activeAssignment?.position ?? null,
    workstationAssignments: asset.workstationAssignments.map((assignment) => ({
      ...assignment,
      assignedDate: assignment.assignedDate.toISOString(),
      unassignedDate: assignment.unassignedDate?.toISOString() ?? null,
      workstation: assignment.workstation
    }))
  };
}

function alertMessage(params: {
  type: string;
  assetCode: string;
  workstationCode?: string;
  expectedReturnDate?: Date | null;
  actualReturnDate?: Date | null;
  replacementAssetCode?: string;
  sentTo?: string | null;
  repairCount?: number;
}) {
  switch (params.type) {
    case "MACHINE_SENT_FOR_REPAIR":
      return `${params.assetCode} was sent for repair${params.sentTo ? ` to ${params.sentTo}` : ""}.`;
    case "REPAIR_OVERDUE":
      return `Repair for ${params.assetCode} is overdue${params.expectedReturnDate ? ` since ${formatDate(params.expectedReturnDate)}` : ""}.`;
    case "REPLACEMENT_ACTIVE":
      return `${params.workstationCode} is currently using temporary replacement ${params.replacementAssetCode}.`;
    case "ORIGINAL_RETURNED":
      return `Original machine ${params.assetCode} returned${params.actualReturnDate ? ` on ${formatDate(params.actualReturnDate)}` : ""}.`;
    case "REPLACEMENT_NOT_REMOVED":
      return `Replacement ${params.replacementAssetCode} is still active after ${params.assetCode} returned.`;
    case "INCOMPLETE_REPAIR_RECORD":
      return `Repair record for ${params.assetCode} is missing diagnosis, repair action, or parts changed details.`;
    case "REPEATED_REPAIR":
      return `${params.assetCode} has ${params.repairCount} repair records and needs replacement review.`;
    default:
      return `${params.assetCode} requires attention.`;
  }
}

async function upsertAlert(args: {
  type: "MACHINE_SENT_FOR_REPAIR" | "REPAIR_OVERDUE" | "REPLACEMENT_ACTIVE" | "ORIGINAL_RETURNED" | "REPLACEMENT_NOT_REMOVED" | "INCOMPLETE_REPAIR_RECORD" | "REPEATED_REPAIR";
  priority: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  workstationId?: string | null;
  assetId?: string | null;
  repairId?: string | null;
  metadata?: unknown;
}) {
  const existing = await prisma.alert.findFirst({
    where: {
      alertType: args.type,
      workstationId: args.workstationId ?? null,
      assetId: args.assetId ?? null,
      repairId: args.repairId ?? null,
      status: { not: "RESOLVED" }
    }
  });

  if (existing) {
    return prisma.alert.update({
      where: { id: existing.id },
      data: {
        message: args.message,
        priority: args.priority,
        metadata: args.metadata as any,
        alertDate: new Date()
      }
    });
  }

  return prisma.alert.create({
    data: {
      alertType: args.type,
      priority: args.priority,
      message: args.message,
      workstationId: args.workstationId,
      assetId: args.assetId,
      repairId: args.repairId,
      metadata: args.metadata as any
    }
  });
}

async function resolveAlerts(filter: { alertType: any; repairId?: string; assetId?: string }) {
  await prisma.alert.updateMany({
    where: {
      ...filter,
      status: { not: "RESOLVED" }
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date()
    }
  });
}

export async function syncAlerts() {
  const today = startOfToday();
  const repairs = await prisma.repair.findMany({
    where: { deletedAt: null },
    include: {
      workstation: true,
      asset: { include: { assetType: true } },
      replacementLog: {
        include: {
          replacementAsset: true,
          originalAsset: true
        }
      }
    }
  });

  for (const repair of repairs) {
    if (repair.sentDate) {
      await upsertAlert({
        type: "MACHINE_SENT_FOR_REPAIR",
        priority: "MEDIUM",
        message: alertMessage({
          type: "MACHINE_SENT_FOR_REPAIR",
          assetCode: repair.asset.assetCode,
          sentTo: repair.sentTo
        }),
        workstationId: repair.workstationId,
        assetId: repair.assetId,
        repairId: repair.id
      });
    }

    const overdue =
      repair.expectedReturnDate &&
      repair.expectedReturnDate < today &&
      !repair.actualReturnDate &&
      repair.status !== "CLOSED";

    if (overdue) {
      await upsertAlert({
        type: "REPAIR_OVERDUE",
        priority: "HIGH",
        message: alertMessage({
          type: "REPAIR_OVERDUE",
          assetCode: repair.asset.assetCode,
          expectedReturnDate: repair.expectedReturnDate
        }),
        workstationId: repair.workstationId,
        assetId: repair.assetId,
        repairId: repair.id
      });
    } else {
      await resolveAlerts({ alertType: "REPAIR_OVERDUE", repairId: repair.id });
    }

    const incomplete =
      repair.status === "RETURNED" || repair.status === "CLOSED"
        ? !repair.diagnosis || !repair.repairAction || !repair.partsChanged
        : false;

    if (incomplete) {
      await upsertAlert({
        type: "INCOMPLETE_REPAIR_RECORD",
        priority: "MEDIUM",
        message: alertMessage({
          type: "INCOMPLETE_REPAIR_RECORD",
          assetCode: repair.asset.assetCode
        }),
        workstationId: repair.workstationId,
        assetId: repair.assetId,
        repairId: repair.id
      });
    } else {
      await resolveAlerts({ alertType: "INCOMPLETE_REPAIR_RECORD", repairId: repair.id });
    }

    if (repair.replacementLog && repair.replacementLog.status !== "REMOVED" && !repair.actualReturnDate) {
      await upsertAlert({
        type: "REPLACEMENT_ACTIVE",
        priority: "MEDIUM",
        message: alertMessage({
          type: "REPLACEMENT_ACTIVE",
          assetCode: repair.asset.assetCode,
          workstationCode: repair.workstation.code,
          replacementAssetCode: repair.replacementLog.replacementAsset.assetCode
        }),
        workstationId: repair.workstationId,
        assetId: repair.replacementLog.replacementAssetId,
        repairId: repair.id
      });
    } else {
      await resolveAlerts({ alertType: "REPLACEMENT_ACTIVE", repairId: repair.id });
    }

    if (repair.actualReturnDate) {
      await upsertAlert({
        type: "ORIGINAL_RETURNED",
        priority: "MEDIUM",
        message: alertMessage({
          type: "ORIGINAL_RETURNED",
          assetCode: repair.asset.assetCode,
          actualReturnDate: repair.actualReturnDate
        }),
        workstationId: repair.workstationId,
        assetId: repair.assetId,
        repairId: repair.id
      });

      const replacementTooLong =
        repair.replacementLog &&
        repair.replacementLog.status !== "REMOVED" &&
        repair.actualReturnDate < new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);

      if (replacementTooLong && repair.replacementLog) {
        await upsertAlert({
          type: "REPLACEMENT_NOT_REMOVED",
          priority: "HIGH",
          message: alertMessage({
            type: "REPLACEMENT_NOT_REMOVED",
            assetCode: repair.asset.assetCode,
            replacementAssetCode: repair.replacementLog.replacementAsset.assetCode
          }),
          workstationId: repair.workstationId,
          assetId: repair.replacementLog.replacementAssetId,
          repairId: repair.id
        });
      } else {
        await resolveAlerts({ alertType: "REPLACEMENT_NOT_REMOVED", repairId: repair.id });
      }
    } else {
      await resolveAlerts({ alertType: "ORIGINAL_RETURNED", repairId: repair.id });
      await resolveAlerts({ alertType: "REPLACEMENT_NOT_REMOVED", repairId: repair.id });
    }
  }

  const groupedRepairs = await prisma.repair.groupBy({
    by: ["assetId"],
    _count: { _all: true },
    where: { deletedAt: null }
  });

  for (const entry of groupedRepairs) {
    if (entry._count._all < 3) {
      await resolveAlerts({ alertType: "REPEATED_REPAIR", assetId: entry.assetId });
      continue;
    }

    const asset = await prisma.asset.findUnique({
      where: { id: entry.assetId },
      include: {
        workstationAssignments: {
          where: { isActive: true, status: "ACTIVE" },
          include: { workstation: true }
        }
      }
    });

    if (!asset) {
      continue;
    }

    await upsertAlert({
      type: "REPEATED_REPAIR",
      priority: "HIGH",
      message: alertMessage({
        type: "REPEATED_REPAIR",
        assetCode: asset.assetCode,
        repairCount: entry._count._all
      }),
      workstationId: asset.workstationAssignments[0]?.workstationId ?? null,
      assetId: asset.id,
      metadata: { repairCount: entry._count._all }
    });
  }
}

export async function getDashboardData() {
  await syncAlerts();

  const [workstations, assets, repairsInRepair, replacements, overdueRepairs, alerts, recentRepairs] =
    await Promise.all([
      prisma.workstation.count({ where: { deletedAt: null } }),
      prisma.asset.count({ where: { deletedAt: null } }),
      prisma.repair.count({
        where: {
          deletedAt: null,
          status: { in: ["REPORTED", "SENT", "IN_PROGRESS"] }
        }
      }),
      prisma.replacementLog.count({ where: { status: { in: ["ACTIVE", "PENDING_RESTORE"] } } }),
      prisma.repair.count({
        where: {
          deletedAt: null,
          expectedReturnDate: { lt: new Date() },
          actualReturnDate: null,
          status: { not: "CLOSED" }
        }
      }),
      prisma.alert.findMany({
        include: alertInclude,
        orderBy: [{ priority: "desc" }, { alertDate: "desc" }],
        take: 6
      }),
      prisma.repair.findMany({
        where: {
          deletedAt: null,
          status: { in: ["REPORTED", "SENT", "IN_PROGRESS", "RETURNED"] }
        },
        include: repairInclude,
        orderBy: { reportedDate: "desc" },
        take: 6
      })
    ]);

  return {
    stats: {
      totalWorkstations: workstations,
      totalAssets: assets,
      machinesInRepair: repairsInRepair,
      activeTemporaryReplacements: replacements,
      overdueRepairs
    },
    latestAlerts: alerts,
    recentRepairs
  };
}

export async function listWorkstations(filters: { search?: string; status?: string; location?: string }) {
  await syncAlerts();

  return prisma.workstation.findMany({
    where: {
      deletedAt: null,
      status: (filters.status as any) ?? undefined,
      location: filters.location ? { contains: filters.location, mode: "insensitive" } : undefined,
      OR: filters.search
        ? [
            { code: { contains: filters.search, mode: "insensitive" } },
            { name: { contains: filters.search, mode: "insensitive" } }
          ]
        : undefined
    },
    include: {
      _count: {
        select: {
          assets: { where: currentWorkstationAssignmentWhere },
          repairs: { where: { deletedAt: null } }
        }
      },
      assets: {
        where: currentWorkstationAssignmentWhere,
        include: {
          asset: {
            include: {
              assetType: true
            }
          }
        }
      }
    },
    orderBy: { code: "asc" }
  });
}

export async function getWorkstationById(id: string) {
  await syncAlerts();

  const workstation = await prisma.workstation.findUnique({
    where: { id },
    include: workstationInclude
  });

  if (!workstation || workstation.deletedAt) {
    throw createError(404, "Workstation not found");
  }

  return workstation;
}

export async function listAssets(filters: {
  search?: string;
  type?: string;
  status?: string;
  location?: string;
}) {
  const workstationLocationFilter =
    filters.location && /^WS-\d{2}$/i.test(filters.location) ? filters.location : null;

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      status: workstationLocationFilter
        ? { in: [...CURRENT_WORKSTATION_ASSET_STATUSES] }
        : filters.status
          ? (filters.status as any)
          : { not: "ARCHIVED" },
      assetType: filters.type
        ? {
            name: { equals: filters.type, mode: "insensitive" }
          }
        : undefined,
      OR: filters.search
        ? [
            { assetCode: { contains: filters.search, mode: "insensitive" } },
            { serialNumber: { contains: filters.search, mode: "insensitive" } },
            { brand: { contains: filters.search, mode: "insensitive" } },
            { model: { contains: filters.search, mode: "insensitive" } },
            {
              workstationAssignments: {
                some: {
                  status: "ACTIVE",
                  workstation: { code: { contains: filters.search, mode: "insensitive" } }
                }
              }
            },
            {
              workstationAssignments: {
                some: {
                  status: "ACTIVE",
                  generalLocation: { contains: filters.search, mode: "insensitive" }
                }
              }
            },
            {
              workstationAssignments: {
                some: {
                  status: "ACTIVE",
                  specificLocationNotes: { contains: filters.search, mode: "insensitive" }
                }
              }
            }
          ]
        : undefined
      ,
      workstationAssignments: filters.location
        ? {
            some: {
              status: "ACTIVE",
              isActive: true,
              ...(workstationLocationFilter
                ? {
                    workstation: {
                      code: { equals: workstationLocationFilter, mode: "insensitive" }
                    }
                  }
                : {
                    OR: [
                      { workstation: { code: { equals: filters.location, mode: "insensitive" } } },
                      { generalLocation: { equals: filters.location, mode: "insensitive" } },
                      {
                        specificLocationNotes: {
                          contains: filters.location,
                          mode: "insensitive"
                        }
                      }
                    ]
                  })
            }
          }
        : undefined
    },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      },
      repairs: {
        where: { deletedAt: null },
        orderBy: { reportedDate: "desc" },
        take: 3
      }
    },
    orderBy: [{ assetType: { name: "asc" } }, { assetCode: "asc" }]
  });

  return assets.map(mapAssetRecord);
}

export async function archiveAsset(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      }
    }
  });

  if (!asset || asset.deletedAt) {
    throw createError(404, "Asset not found.");
  }

  const activeAssignment = asset.workstationAssignments.find(
    (assignment) => assignment.status === "ACTIVE" || assignment.isActive
  );

  if (activeAssignment) {
    const activeLocation =
      activeAssignment.workstation?.code ??
      activeAssignment.specificLocationNotes ??
      activeAssignment.generalLocation ??
      "an active location";

    throw createError(
      409,
      `${asset.assetCode} is still assigned to ${activeLocation}. Unassign it before archiving.`
    );
  }

  if (asset.status === "ARCHIVED") {
    return mapAssetRecord(asset);
  }

  const archivedAsset = await prisma.asset.update({
    where: { id },
    data: {
      status: "ARCHIVED"
    },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      }
    }
  });

  return mapAssetRecord(archivedAsset);
}

export async function getAssetById(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      },
      repairs: {
        where: { deletedAt: null },
        include: {
          workstation: true,
          replacementLog: {
            include: {
              replacementAsset: true,
              originalAsset: true
            }
          }
        },
        orderBy: { reportedDate: "desc" }
      },
      alerts: {
        orderBy: { alertDate: "desc" }
      }
    }
  });

  if (!asset || asset.deletedAt) {
    throw createError(404, "Asset not found");
  }

  return mapAssetRecord(asset);
}

export async function listRepairs(filters: { status?: string; workstationId?: string; assetId?: string }) {
  await syncAlerts();

  return prisma.repair.findMany({
    where: {
      deletedAt: null,
      status: (filters.status as any) ?? undefined,
      workstationId: filters.workstationId,
      assetId: filters.assetId
    },
    include: repairInclude,
    orderBy: { reportedDate: "desc" }
  });
}

export async function createRepair(input: {
  workstationId?: string | null;
  assetId: string;
  reportedDate: string;
  faultDescription: string;
  sentTo?: string | null;
  repairType: "ON_SITE" | "SENT_TO_SHOP";
  sentDate?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  diagnosis?: string | null;
  repairAction?: string | null;
  partsChanged?: string | null;
  cost?: number | null;
  handledBy?: string | null;
  notes?: string | null;
  status: "REPORTED" | "SENT" | "IN_PROGRESS" | "RETURNED" | "CLOSED";
  replacementAssetId?: string | null;
  replacementDate?: string | null;
  replacementReturnDate?: string | null;
  replacementStatus?: "ACTIVE" | "REMOVED" | "PENDING_RESTORE";
  replacementNotes?: string | null;
}) {
  const asset = await prisma.asset.findUnique({
    where: { id: input.assetId },
    include: { assetType: true }
  });

  if (!asset || asset.deletedAt) {
    throw createError(404, "Asset not found");
  }

  const activeAssignment = await prisma.workstationAsset.findFirst({
    where: {
      assetId: input.assetId,
      OR: [{ status: "ACTIVE" }, { isActive: true }]
    },
    include: { workstation: true }
  });

  const resolvedWorkstationId = activeAssignment?.workstationId ?? input.workstationId ?? null;
  if (!resolvedWorkstationId) {
    throw createError(
      400,
      "The selected asset does not have an active workstation assignment for this repair."
    );
  }

  const workstation = await prisma.workstation.findUnique({ where: { id: resolvedWorkstationId } });
  if (!workstation || workstation.deletedAt) {
    throw createError(404, "Workstation not found");
  }

  if (activeAssignment) {
    await prisma.workstationAsset.update({
      where: { id: activeAssignment.id },
      data: {
        status: "INACTIVE",
        isActive: false,
        endDate: input.sentDate ? new Date(input.sentDate) : new Date(),
        unassignedDate: input.sentDate ? new Date(input.sentDate) : new Date()
      }
    });
  }

  const repair = await prisma.repair.create({
    data: {
      workstationId: resolvedWorkstationId,
      assetId: input.assetId,
      reportedDate: new Date(input.reportedDate),
      faultDescription: input.faultDescription,
      sentTo: input.sentTo,
      repairType: input.repairType,
      sentDate: input.sentDate ? new Date(input.sentDate) : null,
      expectedReturnDate: input.expectedReturnDate ? new Date(input.expectedReturnDate) : null,
      actualReturnDate: input.actualReturnDate ? new Date(input.actualReturnDate) : null,
      diagnosis: input.diagnosis,
      repairAction: input.repairAction,
      partsChanged: input.partsChanged,
      cost: input.cost ?? null,
      handledBy: input.handledBy,
      notes: input.notes,
      status: input.status
    }
  });

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      status: input.status === "RETURNED" || input.status === "CLOSED" ? "ACTIVE" : "IN_REPAIR",
      currentLocation: input.sentTo ?? workstation.code
    }
  });

  if (input.replacementAssetId && input.replacementDate) {
    const replacementAsset = await prisma.asset.findUnique({
      where: { id: input.replacementAssetId },
      include: {
        assetType: true,
        workstationAssignments: {
          where: { status: "ACTIVE" },
          include: { workstation: true }
        }
      }
    });

    if (!replacementAsset || replacementAsset.deletedAt) {
      throw createError(404, "Replacement asset not found");
    }

    if (replacementAsset.assetTypeId !== asset.assetTypeId) {
      throw createError(409, "Replacement asset must match the original device type.");
    }

    if (replacementAsset.status !== "IN_STORE") {
      throw createError(409, "Replacement asset must be available in store.");
    }

    if (replacementAsset.workstationAssignments.some((assignment) => assignment.status === "ACTIVE")) {
      throw createError(409, "Replacement asset is already assigned.");
    }

    const activeReplacementUsage = await prisma.replacementLog.findFirst({
      where: {
        replacementAssetId: input.replacementAssetId,
        status: { in: ["ACTIVE", "PENDING_RESTORE"] }
      }
    });

    if (activeReplacementUsage) {
      throw createError(409, "Replacement asset is already being used as an active replacement.");
    }

    await prisma.replacementLog.create({
      data: {
        repairId: repair.id,
        originalAssetId: input.assetId,
        replacementAssetId: input.replacementAssetId,
        workstationId: resolvedWorkstationId,
        replacementDate: new Date(input.replacementDate),
        replacementReturnDate: input.replacementReturnDate ? new Date(input.replacementReturnDate) : null,
        status: input.replacementStatus ?? "ACTIVE",
        notes: input.replacementNotes
      }
    });

    await prisma.asset.update({
      where: { id: input.replacementAssetId },
      data: {
        status: "TEMPORARY_REPLACEMENT",
        currentLocation: workstation.code
      }
    });

    await prisma.workstationAsset.create({
      data: {
        workstationId: resolvedWorkstationId,
        assetId: input.replacementAssetId,
        assignmentType: "TEMPORARY_REPLACEMENT",
        status: "ACTIVE",
        side: activeAssignment?.side ?? null,
        position: activeAssignment?.position ?? null,
        startDate: new Date(input.replacementDate),
        assignedDate: new Date(input.replacementDate),
        isActive: true,
        notes: input.replacementNotes
      }
    });
  }

  await syncAlerts();
  return prisma.repair.findUniqueOrThrow({ where: { id: repair.id }, include: repairInclude });
}

export async function updateRepair(id: string, input: Record<string, unknown>) {
  const existing = await prisma.repair.findUnique({
    where: { id },
    include: { replacementLog: true, workstation: true }
  });

  if (!existing || existing.deletedAt) {
    throw createError(404, "Repair not found");
  }

  await prisma.repair.update({
    where: { id },
    data: {
      workstationId: typeof input.workstationId === "string" ? input.workstationId : undefined,
      assetId: typeof input.assetId === "string" ? input.assetId : undefined,
      reportedDate: typeof input.reportedDate === "string" ? new Date(input.reportedDate) : undefined,
      faultDescription: typeof input.faultDescription === "string" ? input.faultDescription : undefined,
      sentTo: input.sentTo === null || typeof input.sentTo === "string" ? (input.sentTo as string | null) : undefined,
      repairType: typeof input.repairType === "string" ? (input.repairType as any) : undefined,
      sentDate: input.sentDate === null || typeof input.sentDate === "string" ? (input.sentDate ? new Date(input.sentDate as string) : null) : undefined,
      expectedReturnDate:
        input.expectedReturnDate === null || typeof input.expectedReturnDate === "string"
          ? input.expectedReturnDate
            ? new Date(input.expectedReturnDate as string)
            : null
          : undefined,
      actualReturnDate:
        input.actualReturnDate === null || typeof input.actualReturnDate === "string"
          ? input.actualReturnDate
            ? new Date(input.actualReturnDate as string)
            : null
          : undefined,
      diagnosis: input.diagnosis === null || typeof input.diagnosis === "string" ? (input.diagnosis as string | null) : undefined,
      repairAction:
        input.repairAction === null || typeof input.repairAction === "string" ? (input.repairAction as string | null) : undefined,
      partsChanged:
        input.partsChanged === null || typeof input.partsChanged === "string" ? (input.partsChanged as string | null) : undefined,
      cost: typeof input.cost === "number" ? input.cost : input.cost === null ? null : undefined,
      handledBy: input.handledBy === null || typeof input.handledBy === "string" ? (input.handledBy as string | null) : undefined,
      notes: input.notes === null || typeof input.notes === "string" ? (input.notes as string | null) : undefined,
      status: typeof input.status === "string" ? (input.status as any) : undefined
    }
  });

  if (input.actualReturnDate) {
    await prisma.asset.update({
      where: { id: existing.assetId },
      data: {
        status: "ACTIVE",
        currentLocation: existing.workstation.code
      }
    });

    const existingAssignment = await prisma.workstationAsset.findFirst({
      where: {
        workstationId: existing.workstationId,
        assetId: existing.assetId,
        isActive: true
      }
    });

    if (!existingAssignment) {
      const lastKnownAssignment = await prisma.workstationAsset.findFirst({
        where: {
          assetId: existing.assetId,
          workstationId: existing.workstationId
        },
        orderBy: { assignedDate: "desc" }
      });

      await prisma.workstationAsset.create({
        data: {
          workstationId: existing.workstationId,
          assetId: existing.assetId,
          assignmentType: "PRIMARY",
          status: "ACTIVE",
          generalLocation: lastKnownAssignment?.generalLocation ?? null,
          specificLocationNotes: lastKnownAssignment?.specificLocationNotes ?? null,
          side: lastKnownAssignment?.side ?? null,
          position: lastKnownAssignment?.position ?? null,
          assignedDate: new Date(input.actualReturnDate as string),
          startDate: new Date(input.actualReturnDate as string),
          isActive: true,
          notes: "Reassigned after repair return"
        }
      });
    }
  }

  if (existing.replacementLog && input.replacementStatus) {
    await prisma.replacementLog.update({
      where: { repairId: existing.id },
      data: {
        status: input.replacementStatus as any,
        replacementReturnDate:
          input.replacementReturnDate === null || typeof input.replacementReturnDate === "string"
            ? input.replacementReturnDate
              ? new Date(input.replacementReturnDate as string)
              : null
            : undefined
      }
    });

    if (input.replacementStatus === "REMOVED") {
      await prisma.asset.update({
        where: { id: existing.replacementLog.replacementAssetId },
        data: {
          status: "IN_STORE",
          currentLocation: "Main Store"
        }
      });

      await prisma.workstationAsset.updateMany({
        where: {
          assetId: existing.replacementLog.replacementAssetId,
          workstationId: existing.workstationId,
          isActive: true
        },
        data: {
          status: "INACTIVE",
          isActive: false,
          endDate: input.replacementReturnDate
            ? new Date(input.replacementReturnDate as string)
            : new Date(),
          unassignedDate: input.replacementReturnDate
            ? new Date(input.replacementReturnDate as string)
            : new Date()
        }
      });
    }
  }

  await syncAlerts();
  return prisma.repair.findUniqueOrThrow({ where: { id }, include: repairInclude });
}

export async function listReplacements() {
  await syncAlerts();
  return prisma.replacementLog.findMany({
    include: {
      workstation: true,
      repair: true,
      originalAsset: true,
      replacementAsset: true
    },
    orderBy: [{ status: "asc" }, { replacementDate: "desc" }]
  });
}

export async function createReplacement(input: {
  originalAssetId: string;
  replacementAssetId: string;
  replacementType: "TEMPORARY" | "PERMANENT";
  replacementDate: string;
  reason: "DUE_TO_ONGOING_REPAIR" | "NOT_WORKING" | "OTHER";
  customReason?: string | null;
  workstationId?: string | null;
}) {
  const [originalAsset, replacementAsset] = await Promise.all([
    prisma.asset.findUnique({
      where: { id: input.originalAssetId },
      include: {
        assetType: true,
        workstationAssignments: {
          where: { status: "ACTIVE" },
          include: { workstation: true },
          orderBy: { assignedDate: "desc" }
        }
      }
    }),
    prisma.asset.findUnique({
      where: { id: input.replacementAssetId },
      include: {
        assetType: true,
        workstationAssignments: {
          where: { status: "ACTIVE" },
          include: { workstation: true }
        }
      }
    })
  ]);

  if (!originalAsset || originalAsset.deletedAt) {
    throw createError(404, "Original asset not found.");
  }

  if (!replacementAsset || replacementAsset.deletedAt) {
    throw createError(404, "Replacement asset not found.");
  }

  if (originalAsset.assetTypeId !== replacementAsset.assetTypeId) {
    throw createError(409, "Replacement asset must match the original device type.");
  }

  if (replacementAsset.status !== "IN_STORE") {
    throw createError(409, "Replacement asset must be available in store.");
  }

  if (replacementAsset.workstationAssignments.some((assignment) => assignment.status === "ACTIVE")) {
    throw createError(409, "Replacement asset is already assigned.");
  }

  const activeReplacementUsage = await prisma.replacementLog.findFirst({
    where: {
      replacementAssetId: input.replacementAssetId,
      status: { in: ["ACTIVE", "PENDING_RESTORE"] }
    }
  });

  if (activeReplacementUsage) {
    throw createError(409, "Replacement asset is already being used as an active replacement.");
  }

  const originalActiveAssignment =
    originalAsset.workstationAssignments.find((assignment) => assignment.status === "ACTIVE") ?? null;
  const workstationId = input.workstationId ?? originalActiveAssignment?.workstationId ?? null;

  if (!workstationId) {
    throw createError(400, "A workstation-linked original asset is required for this replacement flow.");
  }

  const workstation = await prisma.workstation.findUnique({ where: { id: workstationId } });
  if (!workstation || workstation.deletedAt) {
    throw createError(404, "Workstation not found.");
  }

  const replacementDate = new Date(input.replacementDate);
  const isPermanent = input.replacementType === "PERMANENT";

  const repair = await prisma.repair.create({
    data: {
      workstationId,
      assetId: input.originalAssetId,
      reportedDate: replacementDate,
      faultDescription:
        input.reason === "DUE_TO_ONGOING_REPAIR"
          ? "Replacement issued due to ongoing repair"
          : input.reason === "NOT_WORKING"
            ? "Replacement issued because original device is not working"
            : input.customReason?.trim() || "Replacement issued",
      sentTo: null,
      repairType: "ON_SITE",
      sentDate: replacementDate,
      expectedReturnDate: null,
      actualReturnDate: isPermanent ? replacementDate : null,
      diagnosis: null,
      repairAction: isPermanent ? "Permanent replacement assigned" : "Temporary replacement assigned",
      partsChanged: null,
      cost: null,
      handledBy: "Replacement workflow",
      notes: input.customReason ?? null,
      status: isPermanent ? "CLOSED" : "IN_PROGRESS"
    }
  });

  await prisma.workstationAsset.updateMany({
    where: {
      assetId: input.originalAssetId,
      status: "ACTIVE"
    },
    data: {
      status: "INACTIVE",
      isActive: false,
      endDate: replacementDate,
      unassignedDate: replacementDate,
      notes: "Original replaced"
    }
  });

  const replacement = await prisma.replacementLog.create({
    data: {
      repairId: repair.id,
      originalAssetId: input.originalAssetId,
      replacementAssetId: input.replacementAssetId,
      workstationId,
      replacementDate,
      replacementReturnDate: null,
      status: isPermanent ? "PENDING_RESTORE" : "ACTIVE",
      notes: input.reason === "OTHER" ? input.customReason ?? null : input.reason
    },
    include: {
      workstation: true,
      repair: true,
      originalAsset: true,
      replacementAsset: true
    }
  });

  await prisma.asset.update({
    where: { id: input.replacementAssetId },
    data: {
      status: isPermanent ? "ACTIVE" : "TEMPORARY_REPLACEMENT",
      currentLocation: workstation.code
    }
  });

  await prisma.workstationAsset.create({
    data: {
      workstationId,
      assetId: input.replacementAssetId,
      assignmentType: isPermanent ? "PRIMARY" : "TEMPORARY_REPLACEMENT",
      status: "ACTIVE",
      generalLocation: originalActiveAssignment?.generalLocation ?? null,
      specificLocationNotes: originalActiveAssignment?.specificLocationNotes ?? null,
      side: originalActiveAssignment?.side ?? null,
      position: originalActiveAssignment?.position ?? null,
      assignedDate: replacementDate,
      startDate: replacementDate,
      isActive: true,
      notes: isPermanent ? "Permanent replacement" : "Active replacement"
    }
  });

  await prisma.asset.update({
    where: { id: input.originalAssetId },
    data: {
      status: isPermanent ? "DAMAGED" : "IN_REPAIR",
      currentLocation: workstation.code
    }
  });

  await syncAlerts();
  return replacement;
}

export async function listAlerts(filters: { status?: string; priority?: string; workstationId?: string }) {
  await syncAlerts();
  return prisma.alert.findMany({
    where: {
      status: (filters.status as any) ?? undefined,
      priority: (filters.priority as any) ?? undefined,
      workstationId: filters.workstationId
    },
    include: alertInclude,
    orderBy: [{ status: "asc" }, { priority: "desc" }, { alertDate: "desc" }]
  });
}

export async function updateAlert(id: string, status: "NEW" | "READ" | "RESOLVED", resolvedAt?: string | null) {
  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) {
    throw createError(404, "Alert not found");
  }

  return prisma.alert.update({
    where: { id },
    data: {
      status,
      resolvedAt: status === "RESOLVED" ? (resolvedAt ? new Date(resolvedAt) : new Date()) : null
    },
    include: alertInclude
  });
}

export async function createWorkstation(input: {
  code: string;
  name: string;
  location: string;
  status: "ACTIVE" | "NEEDS_ATTENTION" | "UNDER_MAINTENANCE" | "INACTIVE";
  notes?: string | null;
}) {
  return prisma.workstation.create({ data: input });
}

export async function updateWorkstation(id: string, input: {
  code: string;
  name: string;
  location: string;
  status: "ACTIVE" | "NEEDS_ATTENTION" | "UNDER_MAINTENANCE" | "INACTIVE";
  notes?: string | null;
}) {
  return prisma.workstation.update({ where: { id }, data: input });
}

export async function createWorkstationAssignment(
  workstationId: string,
  input: {
    assetId: string;
    assignmentType: "PRIMARY" | "TEMPORARY_REPLACEMENT" | "SPARE";
    assignedDate?: string;
    notes?: string | null;
  }
) {
  const [workstation, asset, activeAssignment] = await Promise.all([
    prisma.workstation.findUnique({ where: { id: workstationId } }),
    prisma.asset.findUnique({
      where: { id: input.assetId },
      include: { assetType: true }
    }),
    prisma.workstationAsset.findFirst({
      where: { assetId: input.assetId, isActive: true },
      include: { workstation: true }
    })
  ]);

  if (!workstation || workstation.deletedAt) {
    throw createError(404, "Workstation not found");
  }

  if (!asset || asset.deletedAt) {
    throw createError(404, "Asset not found");
  }

  if (activeAssignment) {
    throw createError(
      409,
      `${asset.assetCode} is already actively assigned to ${activeAssignment.workstation?.code ?? "another location"}.`
    );
  }

  const assignment = await prisma.workstationAsset.create({
    data: {
      workstationId,
      assetId: input.assetId,
      assignmentType: input.assignmentType,
      assignedDate: input.assignedDate ? new Date(input.assignedDate) : new Date(),
      isActive: true,
      notes: input.notes
    },
    include: {
      workstation: true,
      asset: {
        include: {
          assetType: true
        }
      }
    }
  });

  await prisma.asset.update({
    where: { id: asset.id },
    data: {
      currentLocation: workstation.code,
      status:
        input.assignmentType === "TEMPORARY_REPLACEMENT"
          ? "TEMPORARY_REPLACEMENT"
          : asset.status === "RETIRED" || asset.status === "DAMAGED"
            ? asset.status
            : "ACTIVE"
    }
  });

  return assignment;
}

export async function listAssetTypes() {
  return prisma.assetType.findMany({ orderBy: { name: "asc" } });
}

export async function createAsset(input: {
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  warrantyExpiryDate?: string | null;
  status:
    | "ACTIVE"
    | "IN_REPAIR"
    | "IN_STORE"
    | "TEMPORARY_REPLACEMENT"
    | "DAMAGED"
    | "RETIRED"
    | "ARCHIVED";
  assetScope?: "WORKSTATION_DEVICE" | "OTHER_NON_WORKSTATION_DEVICE" | null;
  currentLocation?: string | null;
  invoiceFileName?: string | null;
  invoiceFileUrl?: string | null;
  assignment?: {
    workstationCode?: string | null;
    generalLocation?: string | null;
    specificLocationNotes?: string | null;
    side?: string | null;
    position?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    startDate?: string;
  } | null;
  notes?: string | null;
}) {
  const [existingByCode, existingBySerial] = await Promise.all([
    prisma.asset.findFirst({
      where: {
        deletedAt: null,
        assetCode: { equals: input.assetCode, mode: "insensitive" }
      }
    }),
    prisma.asset.findFirst({
      where: {
        deletedAt: null,
        serialNumber: { equals: input.serialNumber, mode: "insensitive" }
      }
    })
  ]);

  if (existingByCode) {
    throw createError(409, "Inventory code already exists.");
  }

  if (existingBySerial) {
    throw createError(409, "Serial number already exists.");
  }

  const workstation = input.assignment?.workstationCode
    ? await prisma.workstation.findFirst({
        where: {
          deletedAt: null,
          code: { equals: input.assignment.workstationCode, mode: "insensitive" }
        }
      })
    : null;

  if (input.assignment?.workstationCode && !workstation) {
    throw createError(404, "Selected workstation was not found.");
  }

  const asset = await prisma.asset.create({
    data: {
      assetCode: input.assetCode,
      assetTypeId: input.assetTypeId,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      specification: input.specification,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      warrantyExpiryDate: input.warrantyExpiryDate ? new Date(input.warrantyExpiryDate) : null,
      status: input.status,
      assetScope: input.assetScope ?? null,
      currentLocation: input.currentLocation,
      invoiceFileName: input.invoiceFileName,
      invoiceFileUrl: input.invoiceFileUrl,
      notes: input.notes
    },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      }
    }
  });

  if (input.assignment && input.status !== "IN_STORE") {
    await prisma.workstationAsset.create({
      data: {
        assetId: asset.id,
        workstationId: workstation?.id ?? null,
        assignmentType: "PRIMARY",
        status: input.assignment.status ?? "ACTIVE",
        generalLocation: input.assignment.generalLocation ?? null,
        specificLocationNotes: input.assignment.specificLocationNotes ?? null,
        side: input.assignment.side ?? null,
        position: input.assignment.position ?? null,
        startDate: input.assignment.startDate ? new Date(input.assignment.startDate) : new Date(),
        assignedDate: input.assignment.startDate ? new Date(input.assignment.startDate) : new Date(),
        isActive: (input.assignment.status ?? "ACTIVE") === "ACTIVE",
        notes: input.notes ?? null
      }
    });
  }

  const createdAsset = await prisma.asset.findUniqueOrThrow({
    where: { id: asset.id },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      }
    }
  });

  return mapAssetRecord(createdAsset);
}

export async function updateAsset(id: string, input: {
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  warrantyExpiryDate?: string | null;
  status:
    | "ACTIVE"
    | "IN_REPAIR"
    | "IN_STORE"
    | "TEMPORARY_REPLACEMENT"
    | "DAMAGED"
    | "RETIRED"
    | "ARCHIVED";
  assetScope?: "WORKSTATION_DEVICE" | "OTHER_NON_WORKSTATION_DEVICE" | null;
  currentLocation?: string | null;
  invoiceFileName?: string | null;
  invoiceFileUrl?: string | null;
  assignment?: {
    workstationCode?: string | null;
    generalLocation?: string | null;
    specificLocationNotes?: string | null;
    side?: string | null;
    position?: string | null;
    status?: "ACTIVE" | "INACTIVE";
    startDate?: string;
  } | null;
  notes?: string | null;
}) {
  const existingAsset = await prisma.asset.findUnique({
    where: { id },
    include: {
      workstationAssignments: {
        where: { status: "ACTIVE" },
        include: assetAssignmentInclude
      }
    }
  });

  if (!existingAsset || existingAsset.deletedAt) {
    throw createError(404, "Asset not found");
  }

  const [existingByCode, existingBySerial] = await Promise.all([
    prisma.asset.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        assetCode: { equals: input.assetCode, mode: "insensitive" }
      }
    }),
    prisma.asset.findFirst({
      where: {
        deletedAt: null,
        id: { not: id },
        serialNumber: { equals: input.serialNumber, mode: "insensitive" }
      }
    })
  ]);

  if (existingByCode) {
    throw createError(409, "Inventory code already exists.");
  }

  if (existingBySerial) {
    throw createError(409, "Serial number already exists.");
  }

  const workstation = input.assignment?.workstationCode
    ? await prisma.workstation.findFirst({
        where: {
          deletedAt: null,
          code: { equals: input.assignment.workstationCode, mode: "insensitive" }
        }
      })
    : null;

  if (input.assignment?.workstationCode && !workstation) {
    throw createError(404, "Selected workstation was not found.");
  }

  await prisma.asset.update({
    where: { id },
    data: {
      assetCode: input.assetCode,
      assetTypeId: input.assetTypeId,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      specification: input.specification,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      warrantyExpiryDate: input.warrantyExpiryDate ? new Date(input.warrantyExpiryDate) : null,
      status: input.status,
      assetScope: input.assetScope ?? null,
      currentLocation: input.currentLocation,
      invoiceFileName: input.invoiceFileName,
      invoiceFileUrl: input.invoiceFileUrl,
      notes: input.notes
    },
  });

  await prisma.workstationAsset.updateMany({
    where: { assetId: id, status: "ACTIVE" },
    data: {
      status: "INACTIVE",
      isActive: false,
      endDate: new Date(),
      unassignedDate: new Date()
    }
  });

  if (input.assignment && input.status !== "IN_STORE") {
    await prisma.workstationAsset.create({
      data: {
        assetId: id,
        workstationId: workstation?.id ?? null,
        assignmentType: "PRIMARY",
        status: input.assignment.status ?? "ACTIVE",
        generalLocation: input.assignment.generalLocation ?? null,
        specificLocationNotes: input.assignment.specificLocationNotes ?? null,
        side: input.assignment.side ?? null,
        position: input.assignment.position ?? null,
        startDate: input.assignment.startDate ? new Date(input.assignment.startDate) : new Date(),
        assignedDate: input.assignment.startDate ? new Date(input.assignment.startDate) : new Date(),
        isActive: (input.assignment.status ?? "ACTIVE") === "ACTIVE",
        notes: input.notes ?? null
      }
    });
  }

  const updatedAsset = await prisma.asset.findUniqueOrThrow({
    where: { id },
    include: {
      assetType: true,
      workstationAssignments: {
        include: assetAssignmentInclude,
        orderBy: { assignedDate: "desc" }
      }
    }
  });

  return mapAssetRecord(updatedAsset);
}
