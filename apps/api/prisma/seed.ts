import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

const workstationDevicePlan = [
  { prefix: "MACH", typeName: "Machine", brand: "Dell", model: "OptiPlex 7000" },
  { prefix: "MON", typeName: "Monitor", brand: "Dell", model: "P2422H" },
  { prefix: "UPS", typeName: "UPS", brand: "APC", model: "BX1100C" },
  { prefix: "KEY", typeName: "Keyboard", brand: "Logitech", model: "K120" },
  { prefix: "MOU", typeName: "Mouse", brand: "Logitech", model: "M90" },
  { prefix: "PHN", typeName: "Phone", brand: "Panasonic", model: "KX-TS880" },
  { prefix: "TAB", typeName: "Tablet", brand: "Samsung", model: "Galaxy Tab A9" },
  { prefix: "TV", typeName: "TV", brand: "Samsung", model: "Business Display" },
  { prefix: "CBL", typeName: "VGA Cable", brand: "UGreen", model: "VGACore" }
];

const spareDevicePlan = [
  { assetCode: "MACH-101", typeName: "Machine", brand: "Lenovo", model: "ThinkCentre M70" },
  { assetCode: "MACH-102", typeName: "Machine", brand: "HP", model: "Pro Tower 400" },
  { assetCode: "MON-101", typeName: "Monitor", brand: "LG", model: "24MP400" },
  { assetCode: "MON-102", typeName: "Monitor", brand: "Dell", model: "P2422H" },
  { assetCode: "UPS-101", typeName: "UPS", brand: "APC", model: "BX1100C" }
];

function isoDate(value: string) {
  return new Date(`${value}T09:00:00.000Z`);
}

function workstationLocationLabel(index: number) {
  return index <= 6 ? "2nd Flow" : "1st Flow";
}

function workstationSideForType(prefix: string) {
  if (prefix === "MON" || prefix === "KEY" || prefix === "MOU") return "Left";
  return null;
}

function serialForAsset(assetCode: string) {
  return `SR-${assetCode}`;
}

async function main() {
  console.log("🧹 Clearing existing data...");

  await prisma.alert.deleteMany();
  await prisma.replacementLog.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.workstationAsset.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetType.deleteMany();
  await prisma.workstation.deleteMany();

  console.log("📦 Creating asset types...");

  const assetTypeIds = new Map<string, string>();

  for (const definition of assetTypeDefinitions) {
    const assetType = await prisma.assetType.create({ data: definition });
    assetTypeIds.set(definition.name, assetType.id);
  }

  console.log("🏢 Creating workstations...");

  const workstations = await Promise.all(
    Array.from({ length: 12 }, (_, index) => {
      const number = index + 1;
      const code = `WS-${String(number).padStart(2, "0")}`;

      return prisma.workstation.create({
        data: {
          code,
          name: `Workstation ${String(number).padStart(2, "0")}`,
          location: workstationLocationLabel(number),
          status: "ACTIVE"
        }
      });
    })
  );

  const workstationMap = new Map(workstations.map((w) => [w.code, w]));

  console.log("🖥️ Creating workstation assets...");

  for (let index = 1; index <= 12; index++) {
    const workstationCode = `WS-${String(index).padStart(2, "0")}`;
    const workstation = workstationMap.get(workstationCode)!;

    for (const device of workstationDevicePlan) {
      const assetCode = `${device.prefix}-${String(index).padStart(3, "0")}`;

      const asset = await prisma.asset.create({
        data: {
          assetCode,
          assetTypeId: assetTypeIds.get(device.typeName)!,
          brand: device.brand,
          model: device.model,
          serialNumber: serialForAsset(assetCode),
          purchaseDate: isoDate("2026-01-10"),
          warrantyExpiryDate: isoDate("2027-01-10"),
          status: "ACTIVE",
          assetScope: "WORKSTATION_DEVICE",
          currentLocation: workstationCode
        }
      });

      await prisma.workstationAsset.create({
        data: {
          workstationId: workstation.id,
          assetId: asset.id,
          assignmentType: "PRIMARY",
          status: "ACTIVE",
          generalLocation: workstation.location,
          side: workstationSideForType(device.prefix),
          startDate: isoDate("2026-04-01"),
          assignedDate: isoDate("2026-04-01"),
          isActive: true
        }
      });
    }
  }

  console.log("📦 Creating spare assets...");

  for (const spare of spareDevicePlan) {
    await prisma.asset.create({
      data: {
        assetCode: spare.assetCode,
        assetTypeId: assetTypeIds.get(spare.typeName)!,
        brand: spare.brand,
        model: spare.model,
        serialNumber: serialForAsset(spare.assetCode),
        purchaseDate: isoDate("2026-02-01"),
        warrantyExpiryDate: isoDate("2027-02-01"),
        status: "IN_STORE",
        currentLocation: "Main Store"
      }
    });
  }

  console.log("✅ Clean dataset created successfully!");
  console.log("📊 Total Workstations: 12");
  console.log("📊 Total Assets: 113");
  console.log("📊 Repairs/Replacements/Alerts: 0");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });