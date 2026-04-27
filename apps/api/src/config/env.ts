import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).optional(),
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  USE_MOCK_DATA: z.coerce.boolean().default(false),
  SITE_URL: z.string().url("SITE_URL must be a valid URL").optional(),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url("NEXT_PUBLIC_SITE_URL must be a valid URL")
    .optional(),
  NEXT_PUBLIC_API_URL: z
    .string()
    .url("NEXT_PUBLIC_API_URL must be a valid URL")
    .optional(),
  VERCEL_URL: z.string().min(1).optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables");
}

const authSecret = parsed.data.AUTH_SECRET ?? parsed.data.JWT_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET or JWT_SECRET is required");
}

if (!parsed.data.USE_MOCK_DATA && !parsed.data.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when USE_MOCK_DATA=false");
}

const resolvedSiteUrl =
  parsed.data.NEXT_PUBLIC_SITE_URL ??
  parsed.data.SITE_URL ??
  (parsed.data.VERCEL_URL ? `https://${parsed.data.VERCEL_URL}` : undefined) ??
  (parsed.data.NODE_ENV === "production" ? undefined : "http://localhost:3000");

export const env = {
  ...parsed.data,
  AUTH_SECRET: authSecret,
  SITE_URL: resolvedSiteUrl,
  NEXT_PUBLIC_SITE_URL: resolvedSiteUrl
};
