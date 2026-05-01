import "dotenv/config";
import { PrismaClient, UserRole, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

/* ===========================
   🔐 CREATE ADMIN USER
=========================== */
async function createAdmin() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" }
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists");
    return;
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await prisma.user.create({
    data: {
      fullName: "Admin User",
      username: "admin",
      email: "admin@test.com",
      employeeId: "EMP001",
      passwordHash: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      mustChangePassword: false
    }
  });

  console.log("🔥 Admin user created");
}

/* ===========================
   📦 YOUR EXISTING CODE
=========================== */

const assetTypeDefinitions = [
  { code: "MON", name: "Monitor", description: "Desk monitor", trackIndividually: true },
  { code: "TV", name: "TV", description: "Wall-mounted display", trackIndividually: true },
  { code: "MACH", name: "Machine", description: "Desktop workstation machine", trackIndividually: true },
  { code: "AC", name: "AC", description: "Air conditioner", trackIndividually: true },
  { code: "UPS", name: "UPS", description: "Uninterruptible power supply", trackIndividually: true },
  { code: "KEY", name: "Keyboard", description: "Input keyboard", trackIndividually: true },
  { code: "MOU", name: "Mouse", description: "Pointing device", trackIndividually: true },
  { code: "TAB", name: "Tablet", description: "Tablet device", trackIndividually: true },
  { code: "PHN", name: "Phone", description: "Desk or mobile phone", trackIndividually: true },
  { code: "VGA", name: "VGA Cable", description: "Display cable", trackIndividually: true }
];

async function main() {
  console.log("🧹 Clearing existing data...");

  await prisma.alert.deleteMany();
  await prisma.replacementLog.deleteMany();
  await prisma.repair.deleteMany();
  await prisma.workstationAsset.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.workstation.deleteMany();

  /* 🔐 CREATE ADMIN FIRST */
  await createAdmin();

  console.log("📦 Creating asset types...");

  const assetTypeIds = new Map<string, string>();

  for (const definition of assetTypeDefinitions) {
    const assetType = await prisma.assetType.upsert({
      where: { code: definition.code },
      update: {
        name: definition.name,
        description: definition.description,
        trackIndividually: definition.trackIndividually
      },
      create: definition
    });
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
          location: number <= 6 ? "2nd Flow" : "1st Flow",
          status: "ACTIVE"
        }
      });
    })
  );

  console.log("✅ Full system seeded successfully!");
}

/* ===========================
   RUN
=========================== */

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("❌ Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
