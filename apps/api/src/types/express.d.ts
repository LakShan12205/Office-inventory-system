import type { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        username: string;
        role: UserRole;
        mustChangePassword: boolean;
        tokenVersion?: number;
      };
    }
  }
}

export {};
