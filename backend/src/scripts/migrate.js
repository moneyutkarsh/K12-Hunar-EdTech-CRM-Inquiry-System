import pool, { query } from '../config/db.js';
import { generateReferenceCode } from '../utils/referenceCode.js';

async function migrate() {
  console.log('🚀 Running K12 Hunar CRM Database Migration (v2 additions)...');

  try {
    // 1. Add columns if not exists
    console.log('📦 Applying DDL column updates...');
    await query(`
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS reference_code TEXT;
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'Normal';
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL;
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
    `);

    // 2. Add priority check constraint idempotently
    await query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'inquiries_priority_check'
          ) THEN
              ALTER TABLE inquiries ADD CONSTRAINT inquiries_priority_check 
                  CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent'));
          END IF;
      END $$;
    `);

    // 3. Backfill reference codes for existing rows that lack one
    console.log('🔄 Backfilling reference codes for existing inquiries...');
    const unbackfilledRes = await query(`SELECT id FROM inquiries WHERE reference_code IS NULL`);
    const rows = unbackfilledRes.rows || [];
    console.log(`Found ${rows.length} inquiries requiring a unique reference code.`);

    for (const row of rows) {
      let updated = false;
      let attempts = 0;
      while (!updated && attempts < 10) {
        attempts++;
        const code = generateReferenceCode();
        try {
          await query(`UPDATE inquiries SET reference_code = $1 WHERE id = $2 AND reference_code IS NULL`, [
            code,
            row.id,
          ]);
          updated = true;
        } catch (err) {
          // If collision occurred, retry with another code
          if (err.code === '23505') {
            continue;
          }
          throw err;
        }
      }
      if (!updated) {
        throw new Error(`Failed to assign unique reference code for inquiry ${row.id} after 10 attempts.`);
      }
    }

    // 4. Create indexes idempotently
    console.log('⚡ Ensuring performance indexes exist...');
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_inquiries_reference_code ON inquiries (reference_code);
      CREATE INDEX IF NOT EXISTS idx_inquiries_email_lower ON inquiries (LOWER(email));
      CREATE INDEX IF NOT EXISTS idx_inquiries_priority ON inquiries (priority);
      CREATE INDEX IF NOT EXISTS idx_inquiries_assigned_to ON inquiries (assigned_to);
      CREATE INDEX IF NOT EXISTS idx_activity_log_cursor ON activity_log (created_at DESC, id);
      CREATE TABLE IF NOT EXISTS auth_otps (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        code TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'email',
        attempts INT NOT NULL DEFAULT 0,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON auth_otps (email);
    `);

    console.log('✅ Database migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
