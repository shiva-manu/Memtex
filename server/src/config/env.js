import "dotenv/config";
import { z } from "zod";


export const env = z.object({
  DATABASE_URL: z.string(),
  OPENAI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string(),
  GOOGLE_API_KEYS: z.string().optional().default("").transform(val => val ? val.split(",").map(k => k.trim()) : []),
  GOOGLE_EMBED_API_KEY: z.string().optional().default(process.env.GOOGLE_API_KEY || ""),

  SUPABASE_URL: z.string(),
  SUPABASE_KEY: z.string(),
  QDRANT_URL: z.string(),
  QDRANT_API_KEY: z.string(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z.string().default("6379"),
}).parse(process.env);