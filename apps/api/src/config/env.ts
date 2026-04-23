import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),

  USE_MOCK_DATA: z
    .string()
    .optional()
    .transform((value) => value === "true"),

  SITE_URL: z.string().url("SITE_URL must be a valid URL").optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

export const env = {
  ...parsed.data,
  SITE_URL:
    parsed.data.SITE_URL ??
    (parsed.data.NODE_ENV === "production"
      ? undefined
      : "http://localhost:3000")
};