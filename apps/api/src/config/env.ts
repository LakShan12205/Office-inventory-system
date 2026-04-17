import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
dotenv.config({ path: "../../.env", override: true });

const rawEnv = {
  ...process.env,
  AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.JWT_SECRET
};

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32),
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(4000),
  USE_MOCK_DATA: z.coerce.boolean().default(false)
});

const parsedEnv = envSchema.parse(rawEnv);

if (!parsedEnv.USE_MOCK_DATA && !parsedEnv.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when USE_MOCK_DATA=false");
}

export const env = parsedEnv;