import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { config, validateEnv } from '../config/env.js';

async function seedAdmin() {
  validateEnv();

  const email = (config.adminEmail || 'admin@k12hunar.com').toLowerCase().trim();
  const password = config.adminPassword || 'Admin@12345';

  console.log(`🌱 Seeding admin account: ${email}...`);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const checkSql = 'SELECT id FROM admins WHERE LOWER(email) = LOWER($1)';
  const checkResult = await query(checkSql, [email]);

  if (checkResult.rows.length > 0) {
    const updateSql = 'UPDATE admins SET password_hash = $1 WHERE LOWER(email) = LOWER($2) RETURNING id';
    const updateResult = await query(updateSql, [passwordHash, email]);
    console.log(`✅ Admin updated successfully (ID: ${updateResult.rows[0].id})`);
  } else {
    const insertSql = 'INSERT INTO admins (email, password_hash) VALUES ($1, $2) RETURNING id';
    const insertResult = await query(insertSql, [email, passwordHash]);
    console.log(`✅ Admin created successfully (ID: ${insertResult.rows[0].id})`);
  }

  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Failed to seed admin:', err.message);
  process.exit(1);
});
