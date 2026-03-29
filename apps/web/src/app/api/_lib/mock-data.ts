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
  trackIndividually: boolean;
  createdAt: string;
  updatedAt: string;
};

type WorkstationRecord = {
  id: string;
  code: string;
  name: string;
  location: string;
  status: WorkstationStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};

type MockDb = {
  assetTypes: AssetTypeRecord[];
  workstations: WorkstationRecord[];
  assets: AssetRecord[];
  assignments: AssignmentRecord[];
  repairs: RepairRecord[];
  replacements: ReplacementRecord[];
  alerts: AlertRecord[];
};

type CreateAssetInput = {
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

type CreateAssignmentInput = {
  assetId: string;
  assignmentType: AssignmentType;
  assignedDate?: string;
  notes?: string | null;
};

type CreateRepairInput = {
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
};

function makeError(status: number, message: string) {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

function nowIso() {
  return new Date("2026-03-28T09:00:00.000Z").toISOString();
}

function iso(value: string) {
  return new Date(value).toISOString();
}

function slug(prefix: string, index: number) {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

function today() {
  return new Date("2026-03-28T09:00:00.000Z");
}

function buildSeedData(): MockDb {
  const createdAt = iso("2026-03-01");
  const assetTypes: AssetTypeRecord[] = [
    { id: "type-monitor", code: "MON", name: "Monitor", description: "Office monitor", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-tv", code: "TV", name: "TV", description: "Display television", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-machine", code: "MACH", name: "Machine", description: "Workstation machine", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-ups", code: "UPS", name: "UPS", description: "Power backup unit", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-keyboard", code: "KEY", name: "Keyboard", description: "Keyboard", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-mouse", code: "MOU", name: "Mouse", description: "Mouse", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-tablet", code: "TAB", name: "Tablet", description: "Tablet", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-phone", code: "PHN", name: "Phone", description: "Phone", trackIndividually: true, createdAt, updatedAt: createdAt },
    { id: "type-vga", code: "VGA", name: "VGA Cable", description: "VGA cable", trackIndividually: true, createdAt, updatedAt: createdAt }
  ];

  const workstations: WorkstationRecord[] = Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    return {
      id: `ws-${number}`,
      code: `WS-${String(number).padStart(2, "0")}`,
      name: `Workstation ${String(number).padStart(2, "0")}`,
      location: number <= 4 ? "Operations Floor" : number <= 8 ? "Support Wing" : "Executive Bay",
      status: number === 3 || number === 7 ? "NEEDS_ATTENTION" : "ACTIVE",
      notes: number === 7 ? "Original machine returned, replacement still pending removal." : null,
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
    };
  });

  const assets: AssetRecord[] = [];
  const assignments: AssignmentRecord[] = [];
  const repairs: RepairRecord[] = [];
  const replacements: ReplacementRecord[] = [];
  const alerts: AlertRecord[] = [];
  let assetCounter = 1;
  let assignmentCounter = 1;

  const getAssetTypeByName = (name: string) => assetTypes.find((assetType) => assetType.name === name)!;
  const getWorkstationByCode = (code: string) => workstations.find((workstation) => workstation.code === code)!;

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
        notes: notes ?? null,
        createdAt,
        updatedAt: createdAt,
        deletedAt: null
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
        notes: notes ?? null,
        createdAt: assignedDate,
        updatedAt: assignedDate
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

    [monitorA, monitorB, tv, machineA, machineB, ups, keyboard, mouse, tablet, phone, vgaA, vgaB].forEach((asset) =>
      assign(asset.id)
    );
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
      notes: "Mock spare machine",
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
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
      notes: "Mock spare machine",
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
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
      notes: "Available spare",
      createdAt,
      updatedAt: createdAt,
      deletedAt: null
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
      notes: "Replacement for MACH-005",
      createdAt: iso("2026-03-15"),
      updatedAt: iso("2026-03-15")
    },
    {
      id: `assignment-${assignmentCounter++}`,
      workstationId: ws07.id,
      assetId: "asset-spare-2",
      assignmentType: "TEMPORARY_REPLACEMENT",
      assignedDate: iso("2026-03-10"),
      isActive: true,
      notes: "Replacement for MACH-013",
      createdAt: iso("2026-03-10"),
      updatedAt: iso("2026-03-10")
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
      status: "IN_PROGRESS",
      createdAt: iso("2026-03-14"),
      updatedAt: iso("2026-03-15")
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
      status: "RETURNED",
      createdAt: iso("2026-03-08"),
      updatedAt: iso("2026-03-24")
    },
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
      status: "CLOSED",
      createdAt: iso("2025-11-10"),
      updatedAt: iso("2025-11-13")
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
      status: "CLOSED",
      createdAt: iso("2026-01-05"),
      updatedAt: iso("2026-01-07")
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
      status: "CLOSED",
      createdAt: iso("2026-02-18"),
      updatedAt: iso("2026-02-20")
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
      notes: "Replacement issued while machine is away",
      createdAt: iso("2026-03-15"),
      updatedAt: iso("2026-03-15")
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
      notes: "Original returned but replacement still active",
      createdAt: iso("2026-03-10"),
      updatedAt: iso("2026-03-24")
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
      priority: "MEDIUM",
      createdAt: iso("2026-03-15"),
      updatedAt: iso("2026-03-15"),
      resolvedAt: null
    },
    {
      id: "alert-2",
      workstationId: ws03.id,
      assetId: mach005.id,
      repairId: "repair-1",
      alertType: "REPAIR_OVERDUE",
      message: "Repair for MACH-005 is overdue. Expected back on 2026-03-20.",
      alertDate: nowIso(),
      status: "NEW",
      priority: "HIGH",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resolvedAt: null
    },
    {
      id: "alert-3",
      workstationId: ws03.id,
      assetId: "asset-spare-1",
      repairId: "repair-1",
      alertType: "REPLACEMENT_ACTIVE",
      message: "WS-03 is operating with temporary replacement MACH-025.",
      alertDate: nowIso(),
      status: "NEW",
      priority: "MEDIUM",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resolvedAt: null
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
      priority: "MEDIUM",
      createdAt: iso("2026-03-24"),
      updatedAt: iso("2026-03-24"),
      resolvedAt: null
    },
    {
      id: "alert-5",
      workstationId: ws07.id,
      assetId: "asset-spare-2",
      repairId: "repair-2",
      alertType: "REPLACEMENT_NOT_REMOVED",
      message: "Replacement MACH-026 is still active more than 2 days after MACH-013 returned.",
      alertDate: nowIso(),
      status: "NEW",
      priority: "HIGH",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resolvedAt: null
    },
    {
      id: "alert-6",
      workstationId: ws09.id,
      assetId: mach017.id,
      repairId: null,
      alertType: "REPEATED_REPAIR",
      message: "MACH-017 has reached 3 repair records and should be reviewed for replacement.",
      alertDate: nowIso(),
      status: "NEW",
      priority: "HIGH",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      resolvedAt: null
    }
  );

  return { assetTypes, workstations, assets, assignments, repairs, replacements, alerts };
}

declare global {
  var __officeInventoryMockDb: MockDb | undefined;
}

function getDb() {
  if (!globalThis.__officeInventoryMockDb) {
    globalThis.__officeInventoryMockDb = buildSeedData();
  }

  return globalThis.__officeInventoryMockDb;
}

function assetTypeMap(assetTypeId: string) {
  return getDb().assetTypes.find((assetType) => assetType.id === assetTypeId)!;
}

function workstationAssignmentsFor(assetId: string, onlyActive = false) {
  return getDb()
    .assignments.filter((assignment) => assignment.assetId === assetId && (!onlyActive || assignment.isActive))
    .map((assignment) => ({
      ...assignment,
      workstation: getDb().workstations.find((workstation) => workstation.id === assignment.workstationId)!
    }))
    .sort((a, b) => b.assignedDate.localeCompare(a.assignedDate));
}

function assetListView(asset: AssetRecord) {
  return {
    ...asset,
    assetType: assetTypeMap(asset.assetTypeId),
    workstationAssignments: workstationAssignmentsFor(asset.id, true),
    repairs: getDb()
      .repairs.filter((repair) => repair.assetId === asset.id)
      .map((repair) => repairView(repair))
      .slice(0, 3)
  };
}

function repairView(repair: RepairRecord) {
  const db = getDb();
  const asset = db.assets.find((item) => item.id === repair.assetId)!;
  const replacementLog = db.replacements.find((replacement) => replacement.repairId === repair.id);
  return {
    ...repair,
    workstation: db.workstations.find((workstation) => workstation.id === repair.workstationId)!,
    asset: { ...asset, assetType: assetTypeMap(asset.assetTypeId) },
    replacementLog: replacementLog
      ? {
          ...replacementLog,
          originalAsset: db.assets.find((item) => item.id === replacementLog.originalAssetId)!,
          replacementAsset: db.assets.find((item) => item.id === replacementLog.replacementAssetId)!,
          workstation: db.workstations.find((workstation) => workstation.id === replacementLog.workstationId)!
        }
      : null
  };
}

function alertView(alert: AlertRecord) {
  const db = getDb();
  const asset = alert.assetId ? db.assets.find((item) => item.id === alert.assetId) : null;
  return {
    ...alert,
    workstation: alert.workstationId ? db.workstations.find((item) => item.id === alert.workstationId)! : null,
    asset: asset ? { ...asset, assetType: assetTypeMap(asset.assetTypeId) } : null,
    repair: alert.repairId ? db.repairs.find((repair) => repair.id === alert.repairId)! : null
  };
}

function workstationListView(workstation: WorkstationRecord) {
  const db = getDb();
  const workstationAssets = db.assignments
    .filter((assignment) => assignment.workstationId === workstation.id && assignment.isActive)
    .map((assignment) => {
      const asset = db.assets.find((item) => item.id === assignment.assetId)!;
      return {
        ...assignment,
        asset: { ...asset, assetType: assetTypeMap(asset.assetTypeId) }
      };
    });

  return {
    ...workstation,
    _count: {
      assets: workstationAssets.length,
      repairs: db.repairs.filter((repair) => repair.workstationId === workstation.id).length
    },
    assets: workstationAssets
  };
}

function workstationDetailView(workstation: WorkstationRecord) {
  const db = getDb();
  return {
    ...workstation,
    assets: db.assignments
      .filter((assignment) => assignment.workstationId === workstation.id && assignment.isActive)
      .map((assignment) => {
        const asset = db.assets.find((item) => item.id === assignment.assetId)!;
        return {
          ...assignment,
          asset: {
            ...asset,
            assetType: assetTypeMap(asset.assetTypeId),
            workstationAssignments: workstationAssignmentsFor(asset.id, true)
          }
        };
      }),
    repairs: db.repairs
      .filter((repair) => repair.workstationId === workstation.id)
      .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
      .map(repairView),
    alerts: db.alerts
      .filter((alert) => alert.workstationId === workstation.id)
      .sort((a, b) => b.alertDate.localeCompare(a.alertDate))
      .map(alertView)
  };
}

function contains(value: string | undefined | null, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function matchesAssetTypeFilter(assetTypeName: string, filter?: string) {
  if (!filter) return true;

  const normalizedFilter = filter.trim().toLowerCase();
  const normalizedType = assetTypeName.trim().toLowerCase();

  if (normalizedFilter === "peripheral") {
    return ["keyboard", "mouse", "tablet", "phone", "vga cable", "cable"].some((value) =>
      normalizedType.includes(value)
    );
  }

  if (normalizedFilter === "cable") {
    return normalizedType.includes("cable") || normalizedType.includes("vga");
  }

  return normalizedType.includes(normalizedFilter);
}

function definedValue(value: string | null) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function listAssetTypes() {
  return getDb().assetTypes.slice().sort((a, b) => a.name.localeCompare(b.name));
}

export function getDashboardData() {
  const db = getDb();
  return {
    stats: {
      totalWorkstations: db.workstations.length,
      totalAssets: db.assets.length,
      machinesInRepair: db.assets.filter((asset) => asset.status === "IN_REPAIR").length,
      activeTemporaryReplacements: db.replacements.filter((replacement) => replacement.status !== "REMOVED").length,
      overdueRepairs: db.repairs.filter(
        (repair) => repair.expectedReturnDate && new Date(repair.expectedReturnDate) < today() && !repair.actualReturnDate
      ).length
    },
    latestAlerts: db.alerts.slice().sort((a, b) => b.alertDate.localeCompare(a.alertDate)).slice(0, 6).map(alertView),
    recentRepairs: db.repairs.slice().sort((a, b) => b.reportedDate.localeCompare(a.reportedDate)).slice(0, 6).map(repairView)
  };
}

export function listWorkstations(filters: { search?: string; status?: string; location?: string }) {
  const db = getDb();
  return db.workstations
    .filter((workstation) => {
      if (filters.status && workstation.status !== filters.status) return false;
      if (filters.location && !contains(workstation.location, filters.location)) return false;
      if (filters.search && !contains(workstation.code, filters.search) && !contains(workstation.name, filters.search)) return false;
      return true;
    })
    .map(workstationListView);
}

export function getWorkstationById(id: string) {
  const workstation = getDb().workstations.find((item) => item.id === id);
  if (!workstation) throw makeError(404, "Workstation not found");
  return workstationDetailView(workstation);
}

function parsePositiveNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function listAssets(filters: {
  search?: string;
  type?: string;
  status?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}) {
  const db = getDb();
  const filtered = db.assets
    .filter((asset) => {
      if (filters.status && asset.status !== filters.status) return false;
      if (filters.type && !matchesAssetTypeFilter(assetTypeMap(asset.assetTypeId).name, filters.type)) return false;
      const activeAssignment = workstationAssignmentsFor(asset.id, true)[0];
      const locationValue =
        activeAssignment?.workstation.code ??
        activeAssignment?.workstation.location ??
        asset.currentLocation ??
        "Store";

      if (filters.location && !contains(locationValue, filters.location)) return false;
      if (filters.search) {
        const matches =
          contains(asset.assetCode, filters.search) ||
          contains(asset.serialNumber, filters.search) ||
          contains(asset.brand, filters.search) ||
          contains(asset.model, filters.search);
        if (!matches) return false;
      }
      return true;
    })
    .map(assetListView);

  const pageSize = [25, 50, 100].includes(filters.pageSize ?? 25) ? (filters.pageSize ?? 25) : 25;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(filters.page ?? 1, totalPages);
  const startIndex = total === 0 ? 0 : (page - 1) * pageSize;

  return {
    items: filtered.slice(startIndex, startIndex + pageSize),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      start: total === 0 ? 0 : startIndex + 1,
      end: total === 0 ? 0 : Math.min(startIndex + pageSize, total)
    }
  };
}

export function getAssetById(id: string) {
  const asset = getDb().assets.find((item) => item.id === id);
  if (!asset) throw makeError(404, "Asset not found");
  return {
    ...asset,
    assetType: assetTypeMap(asset.assetTypeId),
    workstationAssignments: workstationAssignmentsFor(asset.id),
    repairs: getDb().repairs.filter((repair) => repair.assetId === asset.id).sort((a, b) => b.reportedDate.localeCompare(a.reportedDate)).map(repairView),
    alerts: getDb().alerts.filter((alert) => alert.assetId === asset.id).map(alertView)
  };
}

export function listRepairs(filters: { status?: string; workstationId?: string; assetId?: string }) {
  return getDb()
    .repairs.filter((repair) => {
      if (filters.status && repair.status !== filters.status) return false;
      if (filters.workstationId && repair.workstationId !== filters.workstationId) return false;
      if (filters.assetId && repair.assetId !== filters.assetId) return false;
      return true;
    })
    .sort((a, b) => b.reportedDate.localeCompare(a.reportedDate))
    .map(repairView);
}

export function listAlerts(filters: { status?: string; priority?: string; workstationId?: string }) {
  return getDb()
    .alerts.filter((alert) => {
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.priority && alert.priority !== filters.priority) return false;
      if (filters.workstationId && alert.workstationId !== filters.workstationId) return false;
      return true;
    })
    .sort((a, b) => b.alertDate.localeCompare(a.alertDate))
    .map(alertView);
}

export function listReplacements() {
  const db = getDb();
  return db.replacements
    .slice()
    .sort((a, b) => b.replacementDate.localeCompare(a.replacementDate))
    .map((replacement) => ({
      ...replacement,
      workstation: db.workstations.find((workstation) => workstation.id === replacement.workstationId)!,
      originalAsset: db.assets.find((asset) => asset.id === replacement.originalAssetId)!,
      replacementAsset: db.assets.find((asset) => asset.id === replacement.replacementAssetId)!,
      repair: db.repairs.find((repair) => repair.id === replacement.repairId)!
    }));
}

export function createAsset(input: CreateAssetInput) {
  const db = getDb();
  const now = nowIso();
  if (db.assets.some((asset) => asset.assetCode === input.assetCode)) {
    throw makeError(409, "Asset code already exists.");
  }
  if (db.assets.some((asset) => asset.serialNumber === input.serialNumber)) {
    throw makeError(409, "Serial number already exists.");
  }

  const asset: AssetRecord = {
    id: `asset-${db.assets.length + 1}`,
    ...input,
    specification: input.specification ?? null,
    purchaseDate: input.purchaseDate ?? null,
    currentLocation: input.currentLocation ?? null,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null
  };

  db.assets.push(asset);
  return assetListView(asset);
}

export function createWorkstationAssignment(workstationId: string, input: CreateAssignmentInput) {
  const db = getDb();
  const workstation = db.workstations.find((item) => item.id === workstationId);
  if (!workstation) throw makeError(404, "Workstation not found");

  const asset = db.assets.find((item) => item.id === input.assetId);
  if (!asset) throw makeError(404, "Asset not found");

  const activeAssignment = db.assignments.find((assignment) => assignment.assetId === input.assetId && assignment.isActive);
  if (activeAssignment) {
    const assignedWorkstation = db.workstations.find((item) => item.id === activeAssignment.workstationId)!;
    throw makeError(409, `${asset.assetCode} is already actively assigned to ${assignedWorkstation.code}.`);
  }

  const assignedDate = input.assignedDate ?? nowIso();
  const assignment: AssignmentRecord = {
    id: `assignment-${db.assignments.length + 1}`,
    workstationId,
    assetId: input.assetId,
    assignmentType: input.assignmentType,
    assignedDate,
    isActive: true,
    notes: input.notes ?? null,
    createdAt: assignedDate,
    updatedAt: assignedDate
  };

  db.assignments.unshift(assignment);
  asset.currentLocation = workstation.code;
  asset.updatedAt = nowIso();
  asset.status =
    input.assignmentType === "TEMPORARY_REPLACEMENT"
      ? "TEMPORARY_REPLACEMENT"
      : asset.status === "RETIRED" || asset.status === "DAMAGED"
        ? asset.status
        : "ACTIVE";

  return {
    ...assignment,
    workstation,
    asset: { ...asset, assetType: assetTypeMap(asset.assetTypeId) }
  };
}

export function createRepair(input: CreateRepairInput) {
  const db = getDb();
  const asset = db.assets.find((item) => item.id === input.assetId);
  if (!asset) throw makeError(404, "Asset not found");

  const repair: RepairRecord = {
    id: `repair-${db.repairs.length + 1}`,
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
    status: input.status,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };

  db.repairs.unshift(repair);
  asset.status = input.actualReturnDate ? "ACTIVE" : "IN_REPAIR";
  asset.currentLocation = input.sentTo ?? asset.currentLocation;
  asset.updatedAt = nowIso();

  db.assignments.forEach((assignment) => {
    if (assignment.assetId === input.assetId && assignment.isActive) {
      assignment.isActive = false;
      assignment.unassignedDate = input.sentDate ?? input.reportedDate;
      assignment.updatedAt = nowIso();
    }
  });

  if (input.replacementAssetId && input.replacementDate) {
    createWorkstationAssignment(input.workstationId, {
      assetId: input.replacementAssetId,
      assignmentType: "TEMPORARY_REPLACEMENT",
      assignedDate: input.replacementDate,
      notes: input.replacementNotes ?? null
    });
  }

  return repairView(repair);
}

export function parseAssetFilters(searchParams: URLSearchParams) {
  return {
    search: definedValue(searchParams.get("search")),
    type: definedValue(searchParams.get("type")),
    status: definedValue(searchParams.get("status")),
    location: definedValue(searchParams.get("location")),
    page: parsePositiveNumber(searchParams.get("page"), 1),
    pageSize: parsePositiveNumber(searchParams.get("pageSize"), 25)
  };
}

export function parseWorkstationFilters(searchParams: URLSearchParams) {
  return {
    search: definedValue(searchParams.get("search")),
    status: definedValue(searchParams.get("status")),
    location: definedValue(searchParams.get("location"))
  };
}

export function parseRepairFilters(searchParams: URLSearchParams) {
  return {
    status: definedValue(searchParams.get("status")),
    workstationId: definedValue(searchParams.get("workstationId")),
    assetId: definedValue(searchParams.get("assetId"))
  };
}

export function parseAlertFilters(searchParams: URLSearchParams) {
  return {
    status: definedValue(searchParams.get("status")),
    priority: definedValue(searchParams.get("priority")),
    workstationId: definedValue(searchParams.get("workstationId"))
  };
}
