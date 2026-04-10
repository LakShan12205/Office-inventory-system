import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import createError from "http-errors";
import { prisma } from "../../db/prisma.js";

function sanitizeUser(user: {
  id: string;
  fullName: string;
  username: string;
  email: string;
  employeeId: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    employeeId: user.employeeId,
    role: user.role,
    status: user.status,
    mustChangePassword: user.mustChangePassword,
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}

export async function login(input: { username: string; password: string }) {
  const loginId = input.username.trim();

  console.info("Login lookup started.", {
    loginId
  });

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { username: { equals: loginId, mode: "insensitive" } },
        { email: { equals: loginId, mode: "insensitive" } }
      ]
    }
  });

  console.info("Login lookup completed.", {
    loginId,
    userFound: Boolean(user)
  });

  if (!user || user.status !== "ACTIVE") {
    throw createError(401, "Invalid username or password.");
  }

  if (!user.passwordHash) {
    console.error("Login failed: passwordHash missing for active user.", {
      loginId,
      userId: user.id
    });
    throw createError(500, "Server error. Please try again later.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw createError(401, "Invalid username or password.");
  }

  return sanitizeUser(user);
}

export async function getCurrentUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw createError(404, "User not found.");
  }

  return sanitizeUser(user);
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string }
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.status !== "ACTIVE") {
    throw createError(404, "User not found.");
  }

  const passwordMatches = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!passwordMatches) {
    throw createError(401, "Current password is incorrect.");
  }

  const nextHash = await bcrypt.hash(input.newPassword, 12);
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: nextHash,
      mustChangePassword: false,
      tokenVersion: {
        increment: 1
      }
    }
  });

  return sanitizeUser(updatedUser);
}

export async function submitAccessRequest(input: {
  fullName: string;
  employeeId: string;
  email: string;
  requestedUsername: string;
}) {
  const [existingUser, existingPendingRequest] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: input.email, mode: "insensitive" } },
          { employeeId: { equals: input.employeeId, mode: "insensitive" } },
          { username: { equals: input.requestedUsername, mode: "insensitive" } }
        ]
      }
    }),
    prisma.accessRequest.findFirst({
      where: {
        status: "PENDING",
        OR: [
          { email: { equals: input.email, mode: "insensitive" } },
          { employeeId: { equals: input.employeeId, mode: "insensitive" } },
          { requestedUsername: { equals: input.requestedUsername, mode: "insensitive" } }
        ]
      }
    })
  ]);

  if (existingUser) {
    console.warn("Access request rejected due to existing user match.", {
      email: input.email,
      employeeId: input.employeeId,
      requestedUsername: input.requestedUsername
    });
    throw createError(409, "This request cannot be submitted with the provided details.");
  }

  if (existingPendingRequest) {
    console.warn("Access request rejected due to pending duplicate.", {
      email: input.email,
      employeeId: input.employeeId,
      requestedUsername: input.requestedUsername
    });
    throw createError(409, "This request cannot be submitted with the provided details.");
  }

  return prisma.accessRequest.create({
    data: input
  });
}

export async function invalidateUserSession(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      tokenVersion: {
        increment: 1
      }
    }
  });
}

export async function listAccessRequests() {
  const requests = await prisma.accessRequest.findMany({
    include: {
      reviewedBy: true
    },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }]
  });

  return requests.map((request) => ({
    id: request.id,
    fullName: request.fullName,
    employeeId: request.employeeId,
    email: request.email,
    requestedUsername: request.requestedUsername,
    status: request.status,
    submittedAt: request.submittedAt.toISOString(),
    reviewedAt: request.reviewedAt?.toISOString() ?? null,
    reviewedBy: request.reviewedBy
      ? {
          id: request.reviewedBy.id,
          fullName: request.reviewedBy.fullName,
          username: request.reviewedBy.username
        }
      : null
  }));
}

function generateTemporaryPassword() {
  return `Temp-${randomBytes(6).toString("base64url")}9A`;
}

export async function approveAccessRequest(input: {
  requestId: string;
  reviewerId: string;
  role: "ADMIN" | "SUPERVISOR" | "MANAGER" | "EMPLOYEE";
}) {
  const request = await prisma.accessRequest.findUnique({
    where: { id: input.requestId }
  });

  if (!request) {
    throw createError(404, "Access request not found.");
  }

  if (request.status !== "PENDING") {
    throw createError(409, "Only pending access requests can be approved.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: request.email, mode: "insensitive" } },
        { employeeId: { equals: request.employeeId, mode: "insensitive" } },
        { username: { equals: request.requestedUsername, mode: "insensitive" } }
      ]
    }
  });

  if (existingUser) {
    throw createError(409, "A user with these details already exists.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);

  const [user] = await prisma.$transaction([
    prisma.user.create({
      data: {
        fullName: request.fullName,
        username: request.requestedUsername,
        email: request.email,
        employeeId: request.employeeId,
        passwordHash,
        role: input.role,
        status: "ACTIVE",
        mustChangePassword: true
      }
    }),
    prisma.accessRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        reviewedById: input.reviewerId
      }
    })
  ]);

  return {
    user: sanitizeUser(user),
    temporaryPassword
  };
}

export async function rejectAccessRequest(input: {
  requestId: string;
  reviewerId: string;
  reason?: string | null;
}) {
  const request = await prisma.accessRequest.findUnique({
    where: { id: input.requestId }
  });

  if (!request) {
    throw createError(404, "Access request not found.");
  }

  if (request.status !== "PENDING") {
    throw createError(409, "Only pending access requests can be rejected.");
  }

  return prisma.accessRequest.update({
    where: { id: request.id },
    data: {
      status: "REJECTED",
      reviewedAt: new Date(),
      reviewedById: input.reviewerId
    }
  });
}
