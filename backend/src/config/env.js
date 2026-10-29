import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  JWT_ISSUER: z.string().default('k12-crm'),
  JWT_AUDIENCE: z.string().default('k12-crm-admin'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('admin@k12hunar.com'),
  ADMIN_PASSWORD: z.string().min(8).default('Admin@12345'),
  USE_MOCK_DB: z.coerce.boolean().default(false),
  LOG_LEVEL: z.string().default('info'),
});

let parsedConfig;

export function validateEnv() {
  if (parsedConfig) return parsedConfig;

  // In test mode without live DB, assign mock defaults
  const raw = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'mock_jwt_secret_minimum_32_characters_long_k12_hunar' : undefined),
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_ISSUER: process.env.JWT_ISSUER,
    JWT_AUDIENCE: process.env.JWT_AUDIENCE,
    CLIENT_URL: process.env.CLIENT_URL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    USE_MOCK_DB: process.env.USE_MOCK_DB === 'true' || (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL),
    LOG_LEVEL: process.env.LOG_LEVEL,
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    console.error('❌ FATAL: Environment validation failed:');
    result.error.errors.forEach((e) => {
      console.error(`   - ${e.path.join('.')}: ${e.message}`);
    });
    process.exit(1);
  }

  // Ensure DATABASE_URL is present unless explicitly in test mock mode
  if (!result.data.USE_MOCK_DB && !result.data.DATABASE_URL) {
    console.error('❌ FATAL: DATABASE_URL is missing in environment variables.');
    process.exit(1);
  }

  parsedConfig = {
    ...result.data,
    port: result.data.PORT,
    nodeEnv: result.data.NODE_ENV,
    databaseUrl: result.data.DATABASE_URL,
    jwtSecret: result.data.JWT_SECRET,
    jwtExpiresIn: result.data.JWT_EXPIRES_IN,
    jwtIssuer: result.data.JWT_ISSUER,
    jwtAudience: result.data.JWT_AUDIENCE,
    clientUrl: result.data.CLIENT_URL,
    adminEmail: result.data.ADMIN_EMAIL,
    adminPassword: result.data.ADMIN_PASSWORD,
    useMockDb: result.data.USE_MOCK_DB,
    logLevel: result.data.LOG_LEVEL,
  };
  return parsedConfig;
}

export const config = validateEnv();

