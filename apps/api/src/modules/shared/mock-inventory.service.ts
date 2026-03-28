import createError from "http-errors";

type WorkstationStatus = "ACTIVE" | "NEEDS_ATTENTION" | "UNDER_MAINTENANCE" | "INACTIVE";
type AssetStatus =
  | "ACTIVE"
  | "IN_REPAIR"
  | "IN_STORE"
  | "TEMPORARY_REPLACEMENT"
  | "DAMAGED"
  | "RETIRED";
type AssignmentType = "PRIMARY" | "TEMPORARY_REPLACEMENT" | "SPARE";
type RepairType = "ON_SITE" | "SENT_TO_SHOP";
type RepairStatus = "REPORTED" | "SENT" | "IN_PROGRESS" | "RETURNED" | "CLOSED";
type ReplacementStatus = "ACTIVE" | "REMOVED" | "PENDING_RESTORE";
type AlertStatus = "NEW" | "READ" | "RESOLVED";
type AlertPriority = "LOW" | "MEDIUM" | "HIGH";
type AlertType =
  | "MACHINE_SENT_FOR_REPAIR"
  | "REPAIR_OVERDUE"
  | "REPLACEMENT_ACTIVE"
  | "ORIGINAL_RETURNED"
  | "REPLACEMENT_NOT_REMOVED"
  | "INCOMPLETE_REPAIR_RECORD"
  | "REPEATED_REPAIR";

type AssetTypeRecord = {
  id: string;
  code: string;
  name: string;
  description: string;
};

type WorkstationRecord = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: WorkstationStatus;
  notes?: string | null;
};

type AssetRecord = {
  id: string;
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  status: AssetStatus;
  currentLocation?: string | null;
  notes?: string | null;
};

type AssignmentRecord = {
  id: string;
  workstationId: string;
  assetId: string;
  assignmentType: AssignmentType;
  assignedDate: string;
  unassignedDate?: string | null;
  isActive: boolean;
  notes?: string | null;
};

type RepairRecord = {
  id: string;
  workstationId: string;
  assetId: string;
  reportedDate: string;
  faultDescription: string;
  sentTo?: string | null;
  repairType: RepairType;
  sentDate?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  diagnosis?: string | null;
  repairAction?: string | null;
  partsChanged?: string | null;
  cost?: number | null;
  handledBy?: string | null;
  notes?: string | null;
  status: RepairStatus;
};

type ReplacementRecord = {
  id: string;
  repairId: string;
  originalAssetId: string;
  replacementAssetId: string;
  workstationId: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  status: ReplacementStatus;
  notes?: string | null;
};

type AlertRecord = {
  id: string;
  workstationId?: string | null;
  assetId?: string | null;
  repairId?: string | null;
  alertType: AlertType;
  message: string;
  alertDate: string;
  status: AlertStatus;
  priority: AlertPriority;
};

const assetTypes: AssetTypeRecord[] = [
  { id: "type-monitor", code: "MON", name: "Monitor", description: "Office monitor" },
  { id: "type-tv", code: "TV", name: "TV", description: "Display television" },
  { id: "type-machine", code: "MACH", name: "Machine", description: "Workstation machine" },
  { id: "type-ups", code: "UPS", name: "UPS", description: "Power backup unit" },
  { id: "type-keyboard", code: "KEY", name: "Keyboard", description: "Keyboard" },
  { id: "type-mouse", code: "MOU", name: "Mouse", description: "Mouse" },
  { id: "type-tablet", code: "TAB", name: "Tablet", description: "Tablet" },
  { id: "type-phone", code: "PHN", name: "Phone", description: "Phone" },
  { id: "type-vga", code: "VGA", name: "VGA Cable", description: "VGA cable" }
];

const workstations: WorkstationRecord[] = Array.from({ length: 12 }, (_, index) => {
  const number = index + 1;
  return {
    id: `ws-${number}`,
    code: `WS-${String(number).padStart(2, "0")}`,
    name: `Workstation ${String(number).padStart(2, "0")}`,
    location: number <= 4 ? "Operations Floor" : number <= 8 ? "Support Wing" : "Executive Bay",
    status: number === 3 || number === 7 ? "NEEDS_ATTENTION" : "ACTIVE",
    notes: number === 7 ? "Original machine returned, replacement still pending removal." : null
  };
});

const assets: AssetRecord[] = [];
const assignments: AssignmentRecord[] = [];
const repairs: RepairRecord[] = [];
const replacements: ReplacementRecord[] = [];
const alerts: AlertRecord[] = [];

function today() {
  return new Date("2026-03-28T09:00:00.000Z");
}

function iso(value: string) {
  return new Date(value).toISOString();
}

function slug(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function getAssetTypeByName(name: string) {
  return assetTypes.find((assetType) => assetType.name === name)!;
}

function getWorkstationByCode(code: string) {
  return workstations.find((workstation) => workstation.code === code)!;
}

function seedMockData() {
  let assetCounter = 1;
  let assignmentCounter = 1;

  for (const workstation of workstations) {
    const workstationNumber = Number(workstation.code.split("-")[1]);

    const createAsset = (
      typeName: string,
      code: string,
      brand: string,
      model: string,
      status: AssetStatus = "ACTIVE",
      currentLocation = workstation.code,
      notes?: string
    ) => {
      const asset: AssetRecord = {
        id: `asset-${assetCounter}`,
        assetCode: code,
        assetTypeId: getAssetTypeByName(typeName).id,
        brand,
        model,
        serialNumber: `SR-${code}`,
        specification: typeName === "Machine" ? "Intel i7 / 16GB RAM / 512GB SSD" : `${typeName} standard spec`,
        purchaseDate: iso("2024-01-15"),
        status,
        currentLocation,
        notes: notes ?? null
      };

      assets.push(asset);
      assetCounter += 1;
      return asset;
    };

    const assign = (
      assetId: string,
      assignmentType: AssignmentType = "PRIMARY",
      assignedDate = iso("2024-02-01"),
      isActive = true,
      notes?: string
    ) => {
      assignments.push({
        id: `assignment-${assignmentCounter}`,
        workstationId: workstation.id,
        assetId,
        assignmentType,
        assignedDate,
        isActive,
        notes: notes ?? null
      });
      assignmentCounter += 1;
    };

    const monitorA = createAsset("Monitor", `MON-${workstation.code}-1`, "Dell", "P2422H");
    const monitorB = createAsset("Monitor", `MON-${workstation.code}-2`, "LG", "24MK430H");
    const tv = createAsset("TV", `TV-${workstation.code}-1`, "Samsung", "Business Display");
    const machineA = createAsset("Machine", slug("MACH", workstationNumber * 2 - 1), "Dell", "OptiPlex 7000");
    const machineB = createAsset("Machine", slug("MACH", workstationNumber * 2), "HP", "EliteDesk 800");
    const ups = createAsset("UPS", `UPS-${workstation.code}-1`, "APC", "BX1100C");
    const keyboard = createAsset("Keyboard", `KEY-${workstation.code}-1`, "Logitech", "K120");
    const mouse = createAsset("Mouse", `MOU-${workstation.code}-1`, "Logitech", "M90");
    const tablet = createAsset("Tablet", `TAB-${workstation.code}-1`, "Samsung", "Galaxy Tab A9");
    const phone = createAsset("Phone", `PHN-${workstation.code}-1`, "Panasonic", "KX-TS880");
    const vgaA = createAsset("VGA Cable", `VGA-${workstation.code}-1`, "UGreen", "VGACore");
    const vgaB = createAsset("VGA Cable", `VGA-${workstation.code}-2`, "UGreen", "VGACore");

    [
      monitorA,
      monitorB,
      tv,
      machineA,
      machineB,
      ups,
      keyboard,
      mouse,
      tablet,
      phone,
      vgaA,
      vgaB
    ].forEach((asset) => assign(asset.id));
  }

  assets.push(
    {
      id: "asset-spare-1",
      assetCode: "MACH-025",
      assetTypeId: getAssetTypeByName("Machine").id,
      brand: "Lenovo",
      model: "ThinkCentre M70",
      serialNumber: "SR-MACH-025",
      specification: "Intel i5 / 16GB RAM / 256GB SSD",
      purchaseDate: iso("2025-08-10"),
      status: "TEMPORARY_REPLACEMENT",
      currentLocation: "WS-03",
      notes: "Mock spare machine"
    },
    {
      id: "asset-spare-2",
      assetCode: "MACH-026",
      assetTypeId: getAssetTypeByName("Machine").id,
      brand: "HP",
      model: "Pro Tower 400",
      serialNumber: "SR-MACH-026",
      specification: "Intel i5 / 16GB RAM / 256GB SSD",
      purchaseDate: iso("2025-08-10"),
      status: "TEMPORARY_REPLACEMENT",
      currentLocation: "WS-07",
      notes: "Mock spare machine"
    },
    {
      id: "asset-spare-3",
      assetCode: "MACH-027",
      assetTypeId: getAssetTypeByName("Machine").id,
      brand: "Lenovo",
      model: "ThinkCentre Neo",
      serialNumber: "SR-MACH-027",
      specification: "Intel i5 / 16GB RAM / 256GB SSD",
      purchaseDate: iso("2025-08-10"),
      status: "IN_STORE",
      currentLocation: "Main Store",
      notes: "Available spare"
    }
  );

  const mach005 = assets.find((asset) => asset.assetCode === "MACH-005")!;
  const mach013 = assets.find((asset) => asset.assetCode === "MACH-013")!;
  const mach017 = assets.find((asset) => asset.assetCode === "MACH-017")!;
  const ws03 = getWorkstationByCode("WS-03");
  const ws07 = getWorkstationByCode("WS-07");
  const ws09 = getWorkstationByCode("WS-09");

  mach005.status = "IN_REPAIR";
  mach005.currentLocation = "TechFix Workshop";

  assignments.forEach((assignment) => {
    if (assignment.assetId === mach005.id && assignment.isActive) {
      assignment.isActive = false;
      assignment.unassignedDate = iso("2026-03-15");
    }
  });

  assignments.push(
    {
      id: `assignment-${assignmentCounter++}`,
      workstationId: ws03.id,
      assetId: "asset-spare-1",
      assignmentType: "TEMPORARY_REPLACEMENT",
      assignedDate: iso("2026-03-15"),
      isActive: true,
      notes: "Replacement for MACH-005"
    },
    {
      id: `assignment-${assignmentCounter++}`,
      workstationId: ws07.id,
      assetId: "asset-spare-2",
      assignmentType: "TEMPORARY_REPLACEMENT",
      assignedDate: iso("2026-03-10"),
      isActive: true,
      notes: "Replacement for MACH-013"
    }
  );

  repairs.push(
    {
      id: "repair-1",
      workstationId: ws03.id,
      assetId: mach005.id,
      reportedDate: iso("2026-03-14"),
      faultDescription: "Fails to boot and emits beep code.",
      sentTo: "TechFix Workshop",
      repairType: "SENT_TO_SHOP",
      sentDate: iso("2026-03-15"),
      expectedReturnDate: iso("2026-03-20"),
      actualReturnDate: null,
      diagnosis: "Possible motherboard issue",
      repairAction: null,
      partsChanged: null,
      cost: null,
      handledBy: "Nimal Perera",
      notes: "Awaiting board replacement",
      status: "IN_PROGRESS"
    },
    {
      id: "repair-2",
      workstationId: ws07.id,
      assetId: mach013.id,
      reportedDate: iso("2026-03-08"),
      faultDescription: "Random shutdown under load.",
      sentTo: "Office mechanic - S. Fernando",
      repairType: "ON_SITE",
      sentDate: iso("2026-03-09"),
      expectedReturnDate: iso("2026-03-16"),
      actualReturnDate: iso("2026-03-24"),
      diagnosis: "Faulty power supply",
      repairAction: "Cleaned unit and replaced power supply",
      partsChanged: "450W PSU",
      cost: 75,
      handledBy: "S. Fernando",
      notes: "Original returned, replacement still active",
      status: "RETURNED"
    }
  );

  repairs.push(
    {
      id: "repair-3",
      workstationId: ws09.id,
      assetId: mach017.id,
      reportedDate: iso("2025-11-10"),
      faultDescription: "Intermittent freezing",
      sentTo: "Central Repair Hub",
      repairType: "SENT_TO_SHOP",
      sentDate: iso("2025-11-10"),
      expectedReturnDate: iso("2025-11-12"),
      actualReturnDate: iso("2025-11-13"),
      diagnosis: "Thermal instability",
      repairAction: "Thermal paste refreshed",
      partsChanged: "Thermal paste",
      cost: 25,
      handledBy: "IT Helpdesk",
      notes: null,
      status: "CLOSED"
    },
    {
      id: "repair-4",
      workstationId: ws09.id,
      assetId: mach017.id,
      reportedDate: iso("2026-01-05"),
      faultDescription: "Intermittent freezing",
      sentTo: "Central Repair Hub",
      repairType: "SENT_TO_SHOP",
      sentDate: iso("2026-01-05"),
      expectedReturnDate: iso("2026-01-07"),
      actualReturnDate: iso("2026-01-07"),
      diagnosis: "RAM reseated",
      repairAction: "Diagnostics and RAM reseat",
      partsChanged: "None",
      cost: 15,
      handledBy: "IT Helpdesk",
      notes: null,
      status: "CLOSED"
    },
    {
      id: "repair-5",
      workstationId: ws09.id,
      assetId: mach017.id,
      reportedDate: iso("2026-02-18"),
      faultDescription: "Intermittent freezing",
      sentTo: "Central Repair Hub",
      repairType: "SENT_TO_SHOP",
      sentDate: iso("2026-02-18"),
      expectedReturnDate: iso("2026-02-20"),
      actualReturnDate: iso("2026-02-20"),
      diagnosis: "Fan control instability",
      repairAction: "Fan replaced",
      partsChanged: "CPU fan",
      cost: 30,
      handledBy: "IT Helpdesk",
      notes: null,
      status: "CLOSED"
    }
  );

  replacements.push(
    {
      id: "replacement-1",
      repairId: "repair-1",
      originalAssetId: mach005.id,
      replacementAssetId: "asset-spare-1",
      workstationId: ws03.id,
      replacementDate: iso("2026-03-15"),
      replacementReturnDate: null,
      status: "ACTIVE",
      notes: "Replacement issued while machine is away"
    },
    {
      id: "replacement-2",
      repairId: "repair-2",
      originalAssetId: mach013.id,
      replacementAssetId: "asset-spare-2",
      workstationId: ws07.id,
      replacementDate: iso("2026-03-10"),
      replacementReturnDate: null,
      status: "PENDING_RESTORE",
      notes: "Original returned but replacement still active"
    }
  );

  alerts.push(
    {
      id: "alert-1",
      workstationId: ws03.id,
      assetId: mach005.id,
      repairId: "repair-1",
      alertType: "MACHINE_SENT_FOR_REPAIR",
      message: "MACH-005 was sent to TechFix Workshop on 2026-03-15.",
      alertDate: iso("2026-03-15"),
      status: "NEW",
      priority: "MEDIUM"
    },
    {
      id: "alert-2",
      workstationId: ws03.id,
      assetId: mach005.id,
      repairId: "repair-1",
      alertType: "REPAIR_OVERDUE",
      message: "Repair for MACH-005 is overdue. Expected back on 2026-03-20.",
      alertDate: today().toISOString(),
      status: "NEW",
      priority: "HIGH"
    },
    {
      id: "alert-3",
      workstationId: ws03.id,
      assetId: "asset-spare-1",
      repairId: "repair-1",
      alertType: "REPLACEMENT_ACTIVE",
      message: "WS-03 is operating with temporary replacement MACH-025.",
      alertDate: today().toISOString(),
      status: "NEW",
      priority: "MEDIUM"
    },
    {
      id: "alert-4",
      workstationId: ws07.id,
      assetId: mach013.id,
      repairId: "repair-2",
      alertType: "ORIGINAL_RETURNED",
      message: "Original machine MACH-013 returned to WS-07 on 2026-03-24.",
      alertDate: iso("2026-03-24"),
      status: "READ",
      priority: "MEDIUM"
    },
    {
      id: "alert-5",
      workstationId: ws07.id,
      assetId: "asset-spare-2",
      repairId: "repair-2",
      alertType: "REPLACEMENT_NOT_REMOVED",
      message: "Replacement MACH-026 is still active more than 2 days after MACH-013 returned.",
      alertDate: today().toISOString(),
      status: "NEW",
      priority: "HIGH"
    },
    {
      id: "alert-6",
      workstationId: ws09.id,
      assetId: mach017.id,
      repairId: null,
      alertType: "REPEATED_REPAIR",
      message: "MACH-017 has reached 3 repair records and should be reviewed for replacement.",
      alertDate: today().toISOString(),
      status: "NEW",
      priority: "HIGH"
    }
  );
}

seedMockData();

function assetTypeMap(asset: AssetRecord) {
  return assetTypes.find((assetType) => assetType.id === asset.assetTypeId)!;
}

function workstationAssignmentsFor(assetId: string, onlyActive = false) {
  return assignments
    .filter((assignment) => assignment.assetId === assetId && (!onlyActive || assignment.isActive))
    .map((assignment) => ({
      ...assignment,
      workstation: workstations.find((workstation) => workstation.id === assignment.workstationId)!
    }))
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
}

function assetView(asset: AssetRecord) {
  return {
    ...asset,
    assetType: assetTypeMap(asset),
    workstationAssignments: workstationAssignmentsFor(asset.id, true),
    repairs: repairs
      .filter((repair) => repair.assetId === asset.id)
      .map((repair) => repairView(repair))
      .slice(0, 3)
  };
}

function repairView(repair: RepairRecord) {
  const asset = assets.find((item) => item.id === repair.assetId)!;
  const replacementLog = replacements.find((replacement) => replacement.repairId === repair.id);

  return {
    ...repair,
    workstation: workstations.find((workstation) => workstation.id === repair.workstationId)!,
    asset: {
      ...asset,
      assetType: assetTypeMap(asset)
    },
    replacementLog: replacementLog
      ? {
          ...replacementLog,
          originalAsset: assets.find((item) => item.id === replacementLog.originalAssetId)!,
          replacementAsset: assets.find((item) => item.id === replacementLog.replacementAssetId)!,
          workstation: workstations.find((workstation) => workstation.id === replacementLog.workstationId)!
        }
      : null
  };
}

function alertView(alert: AlertRecord) {
  const asset = alert.assetId ? assets.find((item) => item.id === alert.assetId) : null;
  return {
    ...alert,
    workstation: alert.workstationId
      ? workstations.find((workstation) => workstation.id === alert.workstationId)!
      : null,
    asset: asset
      ? {
          ...asset,
          assetType: assetTypeMap(asset)
        }
      : null,
    repair: alert.repairId ? repairs.find((repair) => repair.id === alert.repairId)! : null
  };
}

function workstationView(workstation: WorkstationRecord) {
  const workstationAssets = assignments
    .filter((assignment) => assignment.workstationId === workstation.id && assignment.isActive)
    .map((assignment) => {
      const asset = assets.find((item) => item.id === assignment.assetId)!;
      return {
        ...assignment,
        asset: {
          ...asset,
          assetType: assetTypeMap(asset)
        }
      };
    });

  return {
    ...workstation,
    _count: {
      assets: workstationAssets.length,
      repairs: repairs.filter((repair) => repair.workstationId === workstation.id).length
    },
    assets: workstationAssets
  };
}

function caseInsensitiveIncludes(value: string | undefined | null, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

export async function getDashboardData() {
  return {
    stats: {
      totalWorkstations: workstations.length,
      totalAssets: assets.length,
      machinesInRepair: assets.filter((asset) => asset.status === "IN_REPAIR").length,
      activeTemporaryReplacements: replacements.filter((replacement) => replacement.status !== "REMOVED").length,
      overdueRepairs: repairs.filter(
        (repair) =>
          repair.expectedReturnDate &&
          new Date(repair.expectedReturnDate) < today() &&
          !repair.actualReturnDate
      ).length
    },
    latestAlerts: alerts
      .slice()
      .sort((a, b) => b.alertDate.localeCompare(a.alertDate))
      .slice(0, 6)
      .map(alertView),
    recentRepairs: repairs
      .slice()
      .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
      .slice(0, 6)
      .map(repairView)
  };
}

export async function listWorkstations(filters: { search?: string; status?: string; location?: string }) {
  return workstations
    .filter((workstation) => {
      if (filters.status && workstation.status !== filters.status) return false;
      if (filters.location && !caseInsensitiveIncludes(workstation.location, filters.location)) return false;
      if (
        filters.search &&
        !caseInsensitiveIncludes(workstation.code, filters.search) &&
        !caseInsensitiveIncludes(workstation.name, filters.search)
      ) {
        return false;
      }
      return true;
    })
    .map(workstationView);
}

export async function getWorkstationById(id: string) {
  const workstation = workstations.find((item) => item.id === id);
  if (!workstation) throw createError(404, "Workstation not found");

  return {
    ...workstation,
    assets: assignments
      .filter((assignment) => assignment.workstationId === workstation.id && assignment.isActive)
      .map((assignment) => {
        const asset = assets.find((item) => item.id === assignment.assetId)!;
        return {
          ...assignment,
          asset: {
            ...asset,
            assetType: assetTypeMap(asset)
          }
        };
      }),
    repairs: repairs
      .filter((repair) => repair.workstationId === workstation.id)
      .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
      .map(repairView),
    alerts: alerts
      .filter((alert) => alert.workstationId === workstation.id)
      .sort((a, b) => b.alertDate.localeCompare(a.alertDate))
      .map(alertView)
  };
}

export async function listAssets(filters: { search?: string; type?: string; status?: string }) {
  return assets
    .filter((asset) => {
      if (filters.status && asset.status !== filters.status) return false;
      if (filters.type && !caseInsensitiveIncludes(assetTypeMap(asset).name, filters.type)) return false;
      if (filters.search) {
        const activeAssignment = workstationAssignmentsFor(asset.id, true)[0];
        const matches =
          caseInsensitiveIncludes(asset.assetCode, filters.search) ||
          caseInsensitiveIncludes(asset.serialNumber, filters.search) ||
          caseInsensitiveIncludes(activeAssignment?.workstation.code, filters.search);
        if (!matches) return false;
      }
      return true;
    })
    .map(assetView);
}

export async function getAssetById(id: string) {
  const asset = assets.find((item) => item.id === id);
  if (!asset) throw createError(404, "Asset not found");

  return {
    ...asset,
    assetType: assetTypeMap(asset),
    workstationAssignments: workstationAssignmentsFor(asset.id),
    repairs: repairs
      .filter((repair) => repair.assetId === asset.id)
      .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
      .map(repairView),
    alerts: alerts.filter((alert) => alert.assetId === asset.id).map(alertView)
  };
}

export async function listRepairs(filters: { status?: string; workstationId?: string; assetId?: string }) {
  return repairs
    .filter((repair) => {
      if (filters.status && repair.status !== filters.status) return false;
      if (filters.workstationId && repair.workstationId !== filters.workstationId) return false;
      if (filters.assetId && repair.assetId !== filters.assetId) return false;
      return true;
    })
    .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
    .map(repairView);
}

export async function createRepair(input: {
  workstationId: string;
  assetId: string;
  reportedDate: string;
  faultDescription: string;
  sentTo?: string | null;
  repairType: RepairType;
  sentDate?: string | null;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  diagnosis?: string | null;
  repairAction?: string | null;
  partsChanged?: string | null;
  cost?: number | null;
  handledBy?: string | null;
  notes?: string | null;
  status: RepairStatus;
  replacementAssetId?: string | null;
  replacementDate?: string | null;
  replacementReturnDate?: string | null;
  replacementStatus?: ReplacementStatus;
  replacementNotes?: string | null;
}) {
  const asset = assets.find((item) => item.id === input.assetId);
  if (!asset) throw createError(404, "Asset not found");

  const repair: RepairRecord = {
    id: `repair-${repairs.length + 1}`,
    workstationId: input.workstationId,
    assetId: input.assetId,
    reportedDate: input.reportedDate,
    faultDescription: input.faultDescription,
    sentTo: input.sentTo ?? null,
    repairType: input.repairType,
    sentDate: input.sentDate ?? null,
    expectedReturnDate: input.expectedReturnDate ?? null,
    actualReturnDate: input.actualReturnDate ?? null,
    diagnosis: input.diagnosis ?? null,
    repairAction: input.repairAction ?? null,
    partsChanged: input.partsChanged ?? null,
    cost: input.cost ?? null,
    handledBy: input.handledBy ?? null,
    notes: input.notes ?? null,
    status: input.status
  };

  repairs.unshift(repair);
  asset.status = input.actualReturnDate ? "ACTIVE" : "IN_REPAIR";
  asset.currentLocation = input.sentTo ?? asset.currentLocation;

  assignments.forEach((assignment) => {
    if (assignment.assetId === input.assetId && assignment.isActive) {
      assignment.isActive = false;
      assignment.unassignedDate = input.sentDate ?? input.reportedDate;
    }
  });

  alerts.unshift({
    id: `alert-${alerts.length + 1}`,
    workstationId: input.workstationId,
    assetId: input.assetId,
    repairId: repair.id,
    alertType: "MACHINE_SENT_FOR_REPAIR",
    message: `${asset.assetCode} was reported and sent for repair.`,
    alertDate: today().toISOString(),
    status: "NEW",
    priority: "MEDIUM"
  });

  if (input.expectedReturnDate && new Date(input.expectedReturnDate) < today() && !input.actualReturnDate) {
    alerts.unshift({
      id: `alert-${alerts.length + 1}`,
      workstationId: input.workstationId,
      assetId: input.assetId,
      repairId: repair.id,
      alertType: "REPAIR_OVERDUE",
      message: `${asset.assetCode} is already overdue based on the expected return date.`,
      alertDate: today().toISOString(),
      status: "NEW",
      priority: "HIGH"
    });
  }

  if (input.replacementAssetId && input.replacementDate) {
    await createReplacement({
      repairId: repair.id,
      originalAssetId: input.assetId,
      replacementAssetId: input.replacementAssetId,
      workstationId: input.workstationId,
      replacementDate: input.replacementDate,
      replacementReturnDate: input.replacementReturnDate ?? null,
      status: input.replacementStatus ?? "ACTIVE",
      notes: input.replacementNotes ?? null
    });
  }

  return repairView(repair);
}

export async function updateRepair(id: string, input: Record<string, unknown>) {
  const repair = repairs.find((item) => item.id === id);
  if (!repair) throw createError(404, "Repair not found");
  Object.assign(repair, input);
  return repairView(repair);
}

export async function listReplacements() {
  return replacements
    .slice()
    .sort((a, b) => b.replacementDate.localeCompare(a.replacementDate))
    .map((replacement) => ({
      ...replacement,
      workstation: workstations.find((workstation) => workstation.id === replacement.workstationId)!,
      originalAsset: assets.find((asset) => asset.id === replacement.originalAssetId)!,
      replacementAsset: assets.find((asset) => asset.id === replacement.replacementAssetId)!,
      repair: repairs.find((repair) => repair.id === replacement.repairId)!
    }));
}

export async function createReplacement(input: {
  repairId: string;
  originalAssetId: string;
  replacementAssetId: string;
  workstationId: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  status: ReplacementStatus;
  notes?: string | null;
}) {
  const replacement: ReplacementRecord = {
    id: `replacement-${replacements.length + 1}`,
    ...input
  };

  replacements.unshift(replacement);

  const replacementAsset = assets.find((asset) => asset.id === input.replacementAssetId);
  if (replacementAsset) {
    replacementAsset.status = "TEMPORARY_REPLACEMENT";
    replacementAsset.currentLocation = workstations.find(
      (workstation) => workstation.id === input.workstationId
    )?.code;
  }

  assignments.push({
    id: `assignment-${assignments.length + 1}`,
    workstationId: input.workstationId,
    assetId: input.replacementAssetId,
    assignmentType: "TEMPORARY_REPLACEMENT",
    assignedDate: input.replacementDate,
    isActive: true,
    notes: input.notes ?? null
  });

  alerts.unshift({
    id: `alert-${alerts.length + 1}`,
    workstationId: input.workstationId,
    assetId: input.replacementAssetId,
    repairId: input.repairId,
    alertType: "REPLACEMENT_ACTIVE",
    message: `${replacementAsset?.assetCode} is active as a temporary replacement.`,
    alertDate: today().toISOString(),
    status: "NEW",
    priority: "MEDIUM"
  });

  return {
    ...replacement,
    workstation: workstations.find((workstation) => workstation.id === replacement.workstationId)!,
    originalAsset: assets.find((asset) => asset.id === replacement.originalAssetId)!,
    replacementAsset: assets.find((asset) => asset.id === replacement.replacementAssetId)!,
    repair: repairs.find((repair) => repair.id === replacement.repairId)!
  };
}

export async function listAlerts(filters: { status?: string; priority?: string; workstationId?: string }) {
  return alerts
    .filter((alert) => {
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.priority && alert.priority !== filters.priority) return false;
      if (filters.workstationId && alert.workstationId !== filters.workstationId) return false;
      return true;
    })
    .sort((a, b) => b.alertDate.localeCompare(a.alertDate))
    .map(alertView);
}

export async function updateAlert(id: string, status: AlertStatus, resolvedAt?: string | null) {
  const alert = alerts.find((item) => item.id === id);
  if (!alert) throw createError(404, "Alert not found");
  alert.status = status;
  if (status === "RESOLVED") {
    alert.alertDate = resolvedAt ?? today().toISOString();
  }
  return alertView(alert);
}

export async function createWorkstation(input: {
  code: string;
  name: string;
  location: string;
  status: WorkstationStatus;
  notes?: string | null;
}) {
  const workstation: WorkstationRecord = {
    id: `ws-${workstations.length + 1}`,
    ...input
  };
  workstations.push(workstation);
  return workstationView(workstation);
}

export async function updateWorkstation(id: string, input: {
  code: string;
  name: string;
  location: string;
  status: WorkstationStatus;
  notes?: string | null;
}) {
  const workstation = workstations.find((item) => item.id === id);
  if (!workstation) throw createError(404, "Workstation not found");
  Object.assign(workstation, input);
  return workstationView(workstation);
}

export async function listAssetTypes() {
  return assetTypes;
}

export async function createWorkstationAssignment(
  workstationId: string,
  input: {
    assetId: string;
    assignmentType: AssignmentType;
    assignedDate?: string;
    notes?: string | null;
  }
) {
  const workstation = workstations.find((item) => item.id === workstationId);
  if (!workstation) throw createError(404, "Workstation not found");

  const asset = assets.find((item) => item.id === input.assetId);
  if (!asset) throw createError(404, "Asset not found");

  const activeAssignment = assignments.find(
    (assignment) => assignment.assetId === input.assetId && assignment.isActive
  );

  if (activeAssignment) {
    const assignedWorkstation = workstations.find(
      (item) => item.id === activeAssignment.workstationId
    )!;
    throw createError(
      409,
      `${asset.assetCode} is already actively assigned to ${assignedWorkstation.code}.`
    );
  }

  const assignment: AssignmentRecord = {
    id: `assignment-${assignments.length + 1}`,
    workstationId,
    assetId: input.assetId,
    assignmentType: input.assignmentType,
    assignedDate: input.assignedDate ?? new Date().toISOString(),
    isActive: true,
    notes: input.notes ?? null
  };

  assignments.unshift(assignment);
  asset.currentLocation = workstation.code;
  asset.status =
    input.assignmentType === "TEMPORARY_REPLACEMENT"
      ? "TEMPORARY_REPLACEMENT"
      : asset.status === "RETIRED" || asset.status === "DAMAGED"
        ? asset.status
        : "ACTIVE";

  return {
    ...assignment,
    workstation,
    asset: {
      ...asset,
      assetType: assetTypeMap(asset)
    }
  };
}

export async function createAsset(input: {
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  status: AssetStatus;
  currentLocation?: string | null;
  notes?: string | null;
}) {
  const asset: AssetRecord = {
    id: `asset-${assets.length + 1}`,
    ...input
  };
  assets.push(asset);
  return assetView(asset);
}

export async function updateAsset(id: string, input: {
  assetCode: string;
  assetTypeId: string;
  brand: string;
  model: string;
  serialNumber: string;
  specification?: string | null;
  purchaseDate?: string | null;
  status: AssetStatus;
  currentLocation?: string | null;
  notes?: string | null;
}) {
  const asset = assets.find((item) => item.id === id);
  if (!asset) throw createError(404, "Asset not found");
  Object.assign(asset, input);
  return assetView(asset);
}
