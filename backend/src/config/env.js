import { z } from "zod";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Auto-load .env file if present
try {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, "../../.env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      }
    }
  }
} catch (e) {
  // Ignore error if loading fails
}

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  SUPABASE_URL: z.string().url({ message: "SUPABASE_URL must be a valid URL" }),
  SUPABASE_SERVICE_KEY: z.string().min(10, { message: "SUPABASE_SERVICE_KEY is required" }),

  JWT_SECRET: z.string().min(4, { message: "JWT_SECRET must be at least 4 characters" }),

  GEMINI_API_KEY: z.string().min(10, { message: "GEMINI_API_KEY is required" }),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),

  CLIENT_URL: z.string().default("http://localhost:5173"),

  // Optional SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

const isTest = process.env.NODE_ENV === "test" || Boolean(process.env.JEST_WORKER_ID);

const testDefaults = isTest ? {
  SUPABASE_URL: "https://test.supabase.co",
  SUPABASE_SERVICE_KEY: "test_service_key_for_testing_123456",
  JWT_SECRET: "test_jwt_secret_min_16_characters_long",
  GEMINI_API_KEY: "test_gemini_api_key_placeholder",
} : {};

const _parsed = envSchema.safeParse({ ...testDefaults, ...process.env });

if (!_parsed.success) {
  console.error("❌  Invalid environment variables:\n");
  _parsed.error.issues.forEach((issue) => {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  });
  console.error("\nFix your .env file and restart.\n");
  process.exit(1);
}

export const env = _parsed.data;
