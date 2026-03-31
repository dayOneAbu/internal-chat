import "server-only";

import { z } from "zod";

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}, z.string().min(1).optional());

const optionalBoolean = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return value;
}, z.boolean().optional());

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  SUPABASE_SECRET_KEY: optionalString,
  SUPABASE_JWT_SECRET: optionalString,
  GOOGLE_AUTH_ENABLED: optionalBoolean,
  GEMINI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
});

const secretKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

export const serverEnv = serverEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  SUPABASE_SECRET_KEY: secretKey,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
  GOOGLE_AUTH_ENABLED: process.env.GOOGLE_AUTH_ENABLED,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
});

export type ServerEnv = typeof serverEnv;
