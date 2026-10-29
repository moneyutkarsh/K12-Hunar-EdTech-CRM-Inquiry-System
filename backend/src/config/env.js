import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@k12hunar.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin@12345',
  useMockDb: process.env.USE_MOCK_DB === 'true' || process.env.NODE_ENV === 'test',
};

// Fail-fast assertion at startup (skip only if explicit test mock mode is enabled)
export function validateEnv() {
  if (config.useMockDb) {
    if (!config.jwtSecret || config.jwtSecret.length < 32) {
      config.jwtSecret = 'mock_secret_for_automated_testing_min_32_characters_long';
    }
    return;
  }

  const errors = [];
  if (!config.databaseUrl) {
    errors.push('DATABASE_URL is missing in environment variables.');
  }
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    errors.push('JWT_SECRET is missing or shorter than 32 characters.');
  }

  if (errors.length > 0) {
    console.error('❌ Environment configuration error:');
    errors.forEach((err) => console.error(`   - ${err}`));
    process.exit(1);
  }
}
