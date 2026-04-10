import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config();
dotenv.config({ path: "../../.env", override: true });

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const fullName = requireEnv("BOOTSTRAP_ADMIN_FULL_NAME");
  const username = requireEnv("BOOTSTRAP_ADMIN_USERNAME");
  const email = requireEnv("BOOTSTRAP_ADMIN_EMAIL");
  const employeeId = requireEnv("BOOTSTRAP_ADMIN_EMPLOYEE_ID");
  const password = requireEnv("BOOTSTRAP_ADMIN_PASSWORD");
  const databaseUrl = requireEnv("DATABASE_URL");

  if (
    !databaseUrl.startsWith("postgresql://") &&
    !databaseUrl.startsWith("postgres://") &&
    !databaseUrl.startsWith("prisma://") &&
    !databaseUrl.startsWith("prisma+postgres://")
  ) {
    throw new Error(
      "DATABASE_URL is invalid. It must start with postgresql://, postgres://, prisma://, or prisma+postgres://"
    );
  }

  if (password.length < 10) {
    throw new Error("BOOTSTRAP_ADMIN_PASSWORD must be at least 10 characters long.");
  }

  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  if (existingAdmin) {
    throw new Error(
      `An active admin user already exists (${existingAdmin.username}). Bootstrap is blocked to avoid accidental duplicate admins.`
    );
  }

  const conflictingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: username, mode: "insensitive" } },
        { email: { equals: email, mode: "insensitive" } },
        { employeeId: { equals: employeeId, mode: "insensitive" } }
      ]
    }
  });

  if (conflictingUser) {
    throw new Error(
      `A user already exists with username, email, or employee ID matching ${username}.`
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      fullName,
      username,
      email,
      employeeId,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      mustChangePassword: false
    }
  });

  console.log("Initial admin user created successfully.");
  console.log(`Username: ${user.username}`);
  console.log(`Role: ${user.role}`);
  console.log(`Status: ${user.status}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Bootstrap admin failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });