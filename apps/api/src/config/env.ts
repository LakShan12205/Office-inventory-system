import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(4000),
  USE_MOCK_DATA: z.coerce.boolean().default(true)
});

const parsedEnv = envSchema.parse(process.env);

if (!parsedEnv.USE_MOCK_DATA && !parsedEnv.DATABASE_URL) {
  throw new Error("DATABASE_URL is required when USE_MOCK_DATA=false");
}

export const env = parsedEnv;
