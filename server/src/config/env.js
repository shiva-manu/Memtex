import "dotenv/config";
import { z } from "zod";


export const env = z.object({
  DATABASE_URL: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string(),

  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  QDRANT_URL: z.string(),
  QDRANT_API_KEY: z.string(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().default("6379"),
}).parse(process.env);