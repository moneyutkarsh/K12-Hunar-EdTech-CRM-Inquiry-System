import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { validateEnv } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDb() {
  validateEnv();

  const schemaPath = path.resolve(__dirname, '../../schema.sql');
  console.log(`📦 Reading schema file from: ${schemaPath}...`);

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('🚀 Executing schema.sql on PostgreSQL database...');

  await query(sql);

  console.log('✅ Database schema setup completed successfully!');
  process.exit(0);
}

setupDb().catch((err) => {
  console.error('❌ Failed to run database setup:', err.message);
  process.exit(1);
});
