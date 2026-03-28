import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: "../../.env" });
dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),
  PORT: z.coerce.number().default(4000),
  USE_MOCK_DATA: z.coerce.boolean().default(true)
});

export const env = envSchema.parse(process.env);
