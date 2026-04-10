import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(8)
});

export const accessRequestSchema = z.object({
  fullName: z.string().trim().min(2),
  employeeId: z.string().trim().min(2),
  email: z.string().trim().email(),
  requestedUsername: z.string().trim().min(3)
});

export const approveAccessRequestSchema = z.object({
  role: z.enum(["ADMIN", "SUPERVISOR", "MANAGER", "EMPLOYEE"])
});

export const rejectAccessRequestSchema = z.object({
  reason: z.string().trim().optional().nullable()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(10)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter.")
    .regex(/[a-z]/, "Password must include at least one lowercase letter.")
    .regex(/[0-9]/, "Password must include at least one number.")
});
