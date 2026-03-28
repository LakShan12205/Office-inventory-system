import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const today = new Date("2026-03-27T09:00:00.000Z");

const assetTypeDefinitions = [
  { code: "MON", name: "Monitor", description: "Desk monitor", trackIndividually: true },
  { code: "TV", name: "TV", description: "Wall-mounted display", trackIndividually: true },
  { code: "MACH", name: "Machine", description: "Desktop workstation machine", trackIndividually: true },
  { code: "UPS", name: "UPS", description: "Uninterruptible power supply", trackIndividually: true },
  { code: "KEY", name: "Keyboard", description: "Input keyboard", trackIndividually: true },
  { code: "MOU", name: "Mouse", description: "Pointing device", trackIndividually: true },
  { code: "TAB", name: "Tablet", description: "Tablet device", trackIndividually: true },
  { code: "PHN", name: "Phone", description: "Desk or mobile phone", trackIndividually: true },
  { code: "VGA", name: "VGA Cable", description: "Display cable", trackIndividually: true }
];

function createDate(value: string) {
  return new Date(value);
}

async function main() {
  await prisma.alert.deleteMany();
  await prisma.replacementLog.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.workstationAsset.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.workstation.deleteMany();

  const assetTypes = new Map<string, string>();
  for (const definition of assetTypeDefinitions) {
    const assetType = await prisma.assetType.create({ data: definition });
    assetTypes.set(definition.name, assetType.id);
  }

  const workstations = await Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      return prisma.workstation.create({
        data: {
          code: `WS-${String(number).padStart(2, "0")}`,
          name: `Workstation ${String(number).padStart(2, "0")}`,
          location: number <= 4 ? "Operations Floor" : number <= 8 ? "Support Wing" : "Executive Bay",
          status: number === 3 || number === 7 ? "NEEDS_ATTENTION" : "ACTIVE",
          notes: number === 7 ? "Using temporary replacement machine." : null
        }
      });
    })
  );

  const workstationMap = new Map(workstations.map((workstation) => [workstation.code, workstation]));
  const assetIds = new Map<string, string>();
  const machineAssignments = new Map<string, string>();

  async function createAsset(data: {
    assetCode: string;
    typeName: string;
    brand: string;
    model: string;
    serialNumber: string;
    specification?: string;
    purchaseDate?: string;
    status?: Prisma.AssetCreateInput["status"];
    currentLocation?: string;
    notes?: string;
  }) {
    const asset = await prisma.asset.create({
      data: {
        assetCode: data.assetCode,
        assetType: { connect: { id: assetTypes.get(data.typeName)! } },
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber,
        specification: data.specification,
        purchaseDate: data.purchaseDate ? createDate(data.purchaseDate) : null,
        status: data.status ?? "ACTIVE",
        currentLocation: data.currentLocation,
        notes: data.notes
      }
    });

    assetIds.set(data.assetCode, asset.id);
    return asset;
  }

  async function assignAsset(params: {
    workstationCode: string;
    assetCode: string;
    assignmentType?: Prisma.WorkstationAssetCreateInput["assignmentType"];
    assignedDate: string;
    isActive?: boolean;
    notes?: string;
  }) {
    const workstation = workstationMap.get(params.workstationCode)!;
    const assetId = assetIds.get(params.assetCode)!;
    return prisma.workstationAsset.create({
      data: {
        workstation: { connect: { id: workstation.id } },
        asset: { connect: { id: assetId } },
        assignmentType: params.assignmentType ?? "PRIMARY",
        assignedDate: createDate(params.assignedDate),
        isActive: params.isActive ?? true,
        notes: params.notes
      }
    });
  }

  for (let wsIndex = 1; wsIndex <= 12; wsIndex += 1) {
    const workstationCode = `WS-${String(wsIndex).padStart(2, "0")}`;

    for (let index = 1; index <= 4; index += 1) {
      await createAsset({
        assetCode: `MON-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "Monitor",
        brand: index % 2 === 0 ? "Dell" : "LG",
        model: index % 2 === 0 ? "P2422H" : "27MP400",
        serialNumber: `SR-MON-${wsIndex}-${index}`,
        specification: `${index % 2 === 0 ? 24 : 27}-inch display`,
        purchaseDate: "2024-01-10",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `MON-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });
    }

    for (let index = 1; index <= 4; index += 1) {
      await createAsset({
        assetCode: `TV-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "TV",
        brand: "Samsung",
        model: "Business Display",
        serialNumber: `SR-TV-${wsIndex}-${index}`,
        specification: "43-inch UHD panel",
        purchaseDate: "2024-01-12",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `TV-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });
    }

    for (let index = 1; index <= 2; index += 1) {
      const machineCode = `MACH-${String(((wsIndex - 1) * 2) + index).padStart(3, "0")}`;
      const machine = await createAsset({
        assetCode: machineCode,
        typeName: "Machine",
        brand: index % 2 === 0 ? "HP" : "Dell",
        model: index % 2 === 0 ? "EliteDesk 800" : "OptiPlex 7000",
        serialNumber: `SR-MACH-${wsIndex}-${index}`,
        specification: "Intel i7 / 16GB RAM / 512GB SSD",
        purchaseDate: "2024-01-20",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: machineCode, assignedDate: "2024-02-01" });
      machineAssignments.set(machine.assetCode, workstationCode);
    }

    for (let index = 1; index <= 2; index += 1) {
      await createAsset({
        assetCode: `UPS-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "UPS",
        brand: "APC",
        model: "BX1100C",
        serialNumber: `SR-UPS-${wsIndex}-${index}`,
        specification: "1100VA backup power",
        purchaseDate: "2024-01-18",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `UPS-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });

      await createAsset({
        assetCode: `KEY-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "Keyboard",
        brand: "Logitech",
        model: "K120",
        serialNumber: `SR-KEY-${wsIndex}-${index}`,
        specification: "USB keyboard",
        purchaseDate: "2024-01-18",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `KEY-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });

      await createAsset({
        assetCode: `MOU-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "Mouse",
        brand: "Logitech",
        model: "M90",
        serialNumber: `SR-MOU-${wsIndex}-${index}`,
        specification: "USB optical mouse",
        purchaseDate: "2024-01-18",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `MOU-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });
    }

    await createAsset({
      assetCode: `TAB-${String(wsIndex).padStart(2, "0")}`,
      typeName: "Tablet",
      brand: "Samsung",
      model: "Galaxy Tab A9",
      serialNumber: `SR-TAB-${wsIndex}`,
      specification: "Android tablet",
      purchaseDate: "2024-01-22",
      currentLocation: workstationCode
    });
    await assignAsset({ workstationCode, assetCode: `TAB-${String(wsIndex).padStart(2, "0")}`, assignedDate: "2024-02-01" });

    await createAsset({
      assetCode: `PHN-${String(wsIndex).padStart(2, "0")}`,
      typeName: "Phone",
      brand: "Panasonic",
      model: "KX-TS880",
      serialNumber: `SR-PHN-${wsIndex}`,
      specification: "Desk phone",
      purchaseDate: "2024-01-22",
      currentLocation: workstationCode
    });
    await assignAsset({ workstationCode, assetCode: `PHN-${String(wsIndex).padStart(2, "0")}`, assignedDate: "2024-02-01" });

    for (let index = 1; index <= 4; index += 1) {
      await createAsset({
        assetCode: `VGA-${String(wsIndex).padStart(2, "0")}-${index}`,
        typeName: "VGA Cable",
        brand: "UGreen",
        model: "VGACore",
        serialNumber: `SR-VGA-${wsIndex}-${index}`,
        specification: "2m VGA cable",
        purchaseDate: "2024-01-16",
        currentLocation: workstationCode
      });
      await assignAsset({ workstationCode, assetCode: `VGA-${String(wsIndex).padStart(2, "0")}-${index}`, assignedDate: "2024-02-01" });
    }
  }

  for (let index = 25; index <= 28; index += 1) {
    await createAsset({
      assetCode: `MACH-${String(index).padStart(3, "0")}`,
      typeName: "Machine",
      brand: index % 2 === 0 ? "Lenovo" : "HP",
      model: index % 2 === 0 ? "ThinkCentre M70" : "Pro Tower 400",
      serialNumber: `SR-SPARE-${index}`,
      specification: "Intel i5 / 16GB RAM / 256GB SSD",
      purchaseDate: "2025-08-10",
      status: "IN_STORE",
      currentLocation: "Main Store",
      notes: "Standby spare machine"
    });
  }

  const repair1 = await prisma.repair.create({
    data: {
      workstation: { connect: { id: workstationMap.get("WS-03")!.id } },
      asset: { connect: { id: assetIds.get("MACH-005")! } },
      reportedDate: createDate("2026-03-14"),
      faultDescription: "Fails to boot and emits beep code.",
      sentTo: "TechFix Workshop",
      repairType: "SENT_TO_SHOP",
      sentDate: createDate("2026-03-15"),
      expectedReturnDate: createDate("2026-03-20"),
      diagnosis: "Likely motherboard issue.",
      handledBy: "Nimal Perera",
      notes: "Awaiting board replacement",
      status: "IN_PROGRESS"
    }
  });

  await prisma.asset.update({
    where: { id: assetIds.get("MACH-005")! },
    data: { status: "IN_REPAIR", currentLocation: "TechFix Workshop" }
  });

  await assignAsset({
    workstationCode: "WS-03",
    assetCode: "MACH-025",
    assignmentType: "TEMPORARY_REPLACEMENT",
    assignedDate: "2026-03-15",
    notes: "Temporary replacement for MACH-005"
  });

  await prisma.asset.update({
    where: { id: assetIds.get("MACH-025")! },
    data: { status: "TEMPORARY_REPLACEMENT", currentLocation: "WS-03" }
  });

  await prisma.replacementLog.create({
    data: {
      repair: { connect: { id: repair1.id } },
      originalAsset: { connect: { id: assetIds.get("MACH-005")! } },
      replacementAsset: { connect: { id: assetIds.get("MACH-025")! } },
      workstation: { connect: { id: workstationMap.get("WS-03")!.id } },
      replacementDate: createDate("2026-03-15"),
      status: "ACTIVE",
      notes: "Replacement issued while original machine is at shop"
    }
  });

  const repair2 = await prisma.repair.create({
    data: {
      workstation: { connect: { id: workstationMap.get("WS-07")!.id } },
      asset: { connect: { id: assetIds.get("MACH-013")! } },
      reportedDate: createDate("2026-03-08"),
      faultDescription: "Random shutdown under load.",
      sentTo: "Office mechanic - S. Fernando",
      repairType: "ON_SITE",
      sentDate: createDate("2026-03-09"),
      expectedReturnDate: createDate("2026-03-16"),
      actualReturnDate: createDate("2026-03-24"),
      diagnosis: "Faulty power supply and dust buildup",
      repairAction: "Cleaned unit and replaced power supply",
      partsChanged: "450W PSU",
      cost: new Prisma.Decimal("75.00"),
      handledBy: "S. Fernando",
      notes: "Returned but replacement still active",
      status: "RETURNED"
    }
  });

  await prisma.asset.update({
    where: { id: assetIds.get("MACH-013")! },
    data: { status: "ACTIVE", currentLocation: "WS-07" }
  });

  await assignAsset({
    workstationCode: "WS-07",
    assetCode: "MACH-026",
    assignmentType: "TEMPORARY_REPLACEMENT",
    assignedDate: "2026-03-10",
    notes: "Temporary replacement still active after original return"
  });

  await prisma.asset.update({
    where: { id: assetIds.get("MACH-026")! },
    data: { status: "TEMPORARY_REPLACEMENT", currentLocation: "WS-07" }
  });

  await prisma.replacementLog.create({
    data: {
      repair: { connect: { id: repair2.id } },
      originalAsset: { connect: { id: assetIds.get("MACH-013")! } },
      replacementAsset: { connect: { id: assetIds.get("MACH-026")! } },
      workstation: { connect: { id: workstationMap.get("WS-07")!.id } },
      replacementDate: createDate("2026-03-10"),
      status: "PENDING_RESTORE",
      notes: "Original returned but replacement has not been removed yet"
    }
  });

  for (const reportedDate of ["2025-11-10", "2026-01-05", "2026-02-18"]) {
    await prisma.repair.create({
      data: {
        workstation: { connect: { id: workstationMap.get("WS-09")!.id } },
        asset: { connect: { id: assetIds.get("MACH-017")! } },
        reportedDate: createDate(reportedDate),
        faultDescription: "Intermittent freezing",
        sentTo: "Central Repair Hub",
        repairType: "SENT_TO_SHOP",
        sentDate: createDate(reportedDate),
        expectedReturnDate: createDate(reportedDate),
        actualReturnDate: createDate(reportedDate),
        diagnosis: "Thermal instability",
        repairAction: "Thermal paste refresh and diagnostics",
        status: "CLOSED",
        handledBy: "IT Helpdesk"
      }
    });
  }

  await prisma.alert.createMany({
    data: [
      {
        workstationId: workstationMap.get("WS-03")!.id,
        assetId: assetIds.get("MACH-005")!,
        repairId: repair1.id,
        alertType: "MACHINE_SENT_FOR_REPAIR",
        message: "MACH-005 was sent to TechFix Workshop on 2026-03-15.",
        alertDate: createDate("2026-03-15"),
        priority: "MEDIUM"
      },
      {
        workstationId: workstationMap.get("WS-03")!.id,
        assetId: assetIds.get("MACH-005")!,
        repairId: repair1.id,
        alertType: "REPAIR_OVERDUE",
        message: "Repair for MACH-005 is overdue. Expected back on 2026-03-20.",
        alertDate: today,
        priority: "HIGH"
      },
      {
        workstationId: workstationMap.get("WS-03")!.id,
        assetId: assetIds.get("MACH-025")!,
        repairId: repair1.id,
        alertType: "REPLACEMENT_ACTIVE",
        message: "WS-03 is operating with temporary replacement MACH-025.",
        alertDate: today,
        priority: "MEDIUM"
      },
      {
        workstationId: workstationMap.get("WS-07")!.id,
        assetId: assetIds.get("MACH-013")!,
        repairId: repair2.id,
        alertType: "ORIGINAL_RETURNED",
        message: "Original machine MACH-013 returned to WS-07 on 2026-03-24.",
        alertDate: createDate("2026-03-24"),
        priority: "MEDIUM"
      },
      {
        workstationId: workstationMap.get("WS-07")!.id,
        assetId: assetIds.get("MACH-026")!,
        repairId: repair2.id,
        alertType: "REPLACEMENT_NOT_REMOVED",
        message: "Replacement MACH-026 is still active more than 2 days after MACH-013 returned.",
        alertDate: today,
        priority: "HIGH"
      },
      {
        workstationId: workstationMap.get("WS-09")!.id,
        assetId: assetIds.get("MACH-017")!,
        alertType: "REPEATED_REPAIR",
        message: "MACH-017 has reached 3 repair records and should be reviewed for replacement.",
        alertDate: today,
        priority: "HIGH"
      }
    ]
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
