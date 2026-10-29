import bcrypt from 'bcryptjs';
import pool, { query } from '../config/db.js';
import { config, validateEnv } from '../config/env.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed[key] = val;
    }
  }
  return parsed;
}

async function upsertSingleAdmin({ email, password, name, role = 'admin' }) {
  const cleanEmail = email.toLowerCase().trim();
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const sql = `
    INSERT INTO admins (email, password_hash, name, role, is_active)
    VALUES ($1, $2, $3, $4, true)
    ON CONFLICT (email)
    DO UPDATE SET 
      password_hash = EXCLUDED.password_hash,
      name = COALESCE(EXCLUDED.name, admins.name),
      role = EXCLUDED.role,
      is_active = true
    RETURNING id, email, name, role;
  `;

  const result = await query(sql, [cleanEmail, passwordHash, name, role]);
  return result.rows[0];
}

async function seedAdmin() {
  validateEnv();

  const args = parseArgs();

  if (args.email) {
    // Single CLI invocation with custom flags
    const email = String(args.email);
    const password = String(args.password || config.adminPassword || 'Admin@12345');
    const name = String(args.name || email.split('@')[0]);
    const role = String(args.role || 'admin');

    console.log(`🌱 Seeding specified admin account: ${email} (${name})...`);
    const admin = await upsertSingleAdmin({ email, password, name, role });
    console.log(`✅ Admin saved successfully (ID: ${admin.id}, Email: ${admin.email}, Name: ${admin.name})`);
  } else {
    // Default seed: primary admin + 2 counselors for assignment workflow
    const defaults = [
      {
        email: (config.adminEmail || 'admin@k12hunar.com').toLowerCase().trim(),
        password: config.adminPassword || 'Admin@12345',
        name: 'Lead Administrator',
        role: 'superadmin',
      },
      {
        email: 'priya@k12hunar.com',
        password: config.adminPassword || 'Admin@12345',
        name: 'Priya Sharma',
        role: 'admin',
      },
      {
        email: 'rahul@k12hunar.com',
        password: config.adminPassword || 'Admin@12345',
        name: 'Rahul Mehta',
        role: 'admin',
      },
    ];

    console.log(`🌱 Seeding team admins for assignment workflow...`);
    for (const item of defaults) {
      const admin = await upsertSingleAdmin(item);
      console.log(`✅ Admin ready: ${admin.name} <${admin.email}> (${admin.role})`);
    }
  }

  await pool.end();
  process.exit(0);
}

seedAdmin().catch(async (err) => {
  console.error('❌ Failed to seed admin:', err.message);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
