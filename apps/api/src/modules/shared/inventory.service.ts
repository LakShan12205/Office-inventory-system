import createError from "http-errors";
import { prisma } from "../../db/prisma";

const workstationInclude = {
  assets: {
    where: { isActive: true },
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

function startOfToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function formatDate(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
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
          where: { isActive: true },
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
          assets: { where: { isActive: true } },
          repairs: { where: { deletedAt: null } }
        }
      },
      assets: {
        where: { isActive: true },
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

export async function listAssets(filters: { search?: string; type?: string; status?: string }) {
  return prisma.asset.findMany({
    where: {
      deletedAt: null,
      status: (filters.status as any) ?? undefined,
      assetType: filters.type
        ? {
            name: { equals: filters.type, mode: "insensitive" }
          }
        : undefined,
      OR: filters.search
        ? [
            { assetCode: { contains: filters.search, mode: "insensitive" } },
            { serialNumber: { contains: filters.search, mode: "insensitive" } },
            {
              workstationAssignments: {
                some: {
                  isActive: true,
                  workstation: { code: { contains: filters.search, mode: "insensitive" } }
                }
              }
            }
          ]
        : undefined
    },
    include: {
      assetType: true,
      workstationAssignments: {
        where: { isActive: true },
        include: { workstation: true }
      },
      repairs: {
        where: { deletedAt: null },
        orderBy: { reportedDate: "desc" },
        take: 3
      }
    },
    orderBy: [{ assetType: { name: "asc" } }, { assetCode: "asc" }]
  });
}

export async function getAssetById(id: string) {
  const asset = await prisma.asset.findUnique({
    where: { id },
    include: {
      assetType: true,
      workstationAssignments: {
        include: { workstation: true },
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

  return asset;
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
  workstationId: string;
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

  if (asset.assetType.name !== "Machine") {
    throw createError(400, "Repairs can only be created for machine assets");
  }

  const workstation = await prisma.workstation.findUnique({ where: { id: input.workstationId } });
  if (!workstation || workstation.deletedAt) {
    throw createError(404, "Workstation not found");
  }

  const activeAssignment = await prisma.workstationAsset.findFirst({
    where: { assetId: input.assetId, isActive: true }
  });

  if (activeAssignment) {
    await prisma.workstationAsset.update({
      where: { id: activeAssignment.id },
      data: {
        isActive: false,
        unassignedDate: input.sentDate ? new Date(input.sentDate) : new Date()
      }
    });
  }

  const repair = await prisma.repair.create({
    data: {
      workstationId: input.workstationId,
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
      include: { assetType: true }
    });

    if (!replacementAsset || replacementAsset.deletedAt) {
      throw createError(404, "Replacement asset not found");
    }

    if (replacementAsset.assetType.name !== "Machine") {
      throw createError(400, "Replacement asset must be a machine");
    }

    await prisma.replacementLog.create({
      data: {
        repairId: repair.id,
        originalAssetId: input.assetId,
        replacementAssetId: input.replacementAssetId,
        workstationId: input.workstationId,
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
        workstationId: input.workstationId,
        assetId: input.replacementAssetId,
        assignmentType: "TEMPORARY_REPLACEMENT",
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
      await prisma.workstationAsset.create({
        data: {
          workstationId: existing.workstationId,
          assetId: existing.assetId,
          assignmentType: "PRIMARY",
          assignedDate: new Date(input.actualReturnDate as string),
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
          isActive: false,
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
  repairId: string;
  originalAssetId: string;
  replacementAssetId: string;
  workstationId: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  status: "ACTIVE" | "REMOVED" | "PENDING_RESTORE";
  notes?: string | null;
}) {
  const replacement = await prisma.replacementLog.create({
    data: {
      repairId: input.repairId,
      originalAssetId: input.originalAssetId,
      replacementAssetId: input.replacementAssetId,
      workstationId: input.workstationId,
      replacementDate: new Date(input.replacementDate),
      replacementReturnDate: input.replacementReturnDate ? new Date(input.replacementReturnDate) : null,
      status: input.status,
      notes: input.notes
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
    data: { status: "TEMPORARY_REPLACEMENT" }
  });

  await prisma.workstationAsset.create({
    data: {
      workstationId: input.workstationId,
      assetId: input.replacementAssetId,
      assignmentType: "TEMPORARY_REPLACEMENT",
      assignedDate: new Date(input.replacementDate),
      isActive: true,
      notes: input.notes
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
      `${asset.assetCode} is already actively assigned to ${activeAssignment.workstation.code}.`
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
  status: "ACTIVE" | "IN_REPAIR" | "IN_STORE" | "TEMPORARY_REPLACEMENT" | "DAMAGED" | "RETIRED";
  currentLocation?: string | null;
  notes?: string | null;
}) {
  return prisma.asset.create({
    data: {
      assetCode: input.assetCode,
      assetTypeId: input.assetTypeId,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      specification: input.specification,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      status: input.status,
      currentLocation: input.currentLocation,
      notes: input.notes
    },
    include: { assetType: true }
  });
}

export async function updateAsset(id: string, input: {
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  status: "ACTIVE" | "IN_REPAIR" | "IN_STORE" | "TEMPORARY_REPLACEMENT" | "DAMAGED" | "RETIRED";
  currentLocation?: string | null;
  notes?: string | null;
}) {
  return prisma.asset.update({
    where: { id },
    data: {
      assetCode: input.assetCode,
      assetTypeId: input.assetTypeId,
      brand: input.brand,
      model: input.model,
      serialNumber: input.serialNumber,
      specification: input.specification,
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      status: input.status,
      currentLocation: input.currentLocation,
      notes: input.notes
    },
    include: { assetType: true }
  });
}
