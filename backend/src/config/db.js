import pg from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { config } from './env.js';

const { Pool } = pg;

let pool = null;

// Lightweight in-memory mock database for automated testing without live credentials
class MockDatabase {
  constructor() {
    this.admins = [];
    this.inquiries = [];
    this.initDefaultAdmin();
  }

  initDefaultAdmin() {
    const salt = bcrypt.genSaltSync(10);
    this.admins.push({
      id: crypto.randomUUID(),
      email: (config.adminEmail || 'admin@k12hunar.com').toLowerCase(),
      password_hash: bcrypt.hashSync(config.adminPassword || 'Admin@12345', salt),
      created_at: new Date(),
    });
  }

  async query(text, params = []) {
    const normalized = text.trim();

    // 1. SELECT from admins by lowercase email
    if (normalized.includes('FROM admins') && normalized.includes('LOWER(email) = LOWER($1)')) {
      const email = (params[0] || '').toLowerCase();
      const admin = this.admins.find((a) => a.email.toLowerCase() === email);
      return { rows: admin ? [admin] : [] };
    }

    // 2. SELECT admin by id
    if (normalized.includes('FROM admins') && normalized.includes('id = $1')) {
      const id = params[0];
      const admin = this.admins.find((a) => a.id === id);
      return { rows: admin ? [admin] : [] };
    }

    // 3. INSERT or UPDATE admin
    if (normalized.includes('INSERT INTO admins')) {
      const [email, password_hash] = params;
      const existingIdx = this.admins.findIndex((a) => a.email.toLowerCase() === email.toLowerCase());
      if (existingIdx >= 0) {
        this.admins[existingIdx].password_hash = password_hash;
        return { rows: [this.admins[existingIdx]] };
      }
      const newAdmin = { id: crypto.randomUUID(), email: email.toLowerCase(), password_hash, created_at: new Date() };
      this.admins.push(newAdmin);
      return { rows: [newAdmin] };
    }

    // 4. INSERT into inquiries
    if (normalized.includes('INSERT INTO inquiries')) {
      const [user_type, category, name, email, phone, message] = params;
      const newInquiry = {
        id: crypto.randomUUID(),
        user_type,
        category,
        name,
        email,
        phone,
        message,
        status: 'New',
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.inquiries.unshift(newInquiry);
      return { rows: [{ id: newInquiry.id }] };
    }

    // 5. STATS: Total and per-status counts
    if (normalized.includes('COUNT(*)') && normalized.includes('FILTER (WHERE status =') && normalized.includes('FROM inquiries')) {
      const total = this.inquiries.length;
      const newCount = this.inquiries.filter((i) => i.status === 'New').length;
      const inProgressCount = this.inquiries.filter((i) => i.status === 'In Progress').length;
      const resolvedCount = this.inquiries.filter((i) => i.status === 'Resolved').length;

      return {
        rows: [
          {
            total: total.toString(),
            new_count: newCount.toString(),
            in_progress_count: inProgressCount.toString(),
            resolved_count: resolvedCount.toString(),
          },
        ],
      };
    }

    // 6. UPDATE inquiry status
    if (normalized.includes('UPDATE inquiries') && normalized.includes('SET status = $1')) {
      const [status, id] = params;
      const item = this.inquiries.find((i) => i.id === id);
      if (!item) return { rows: [] };
      item.status = status;
      item.updated_at = new Date();
      return { rows: [item] };
    }

    // 7. COUNT total inquiries matching filters
    if (normalized.includes('SELECT COUNT(*)') && normalized.includes('FROM inquiries')) {
      let filtered = [...this.inquiries];
      let paramIdx = 0;

      if (normalized.includes('category = $')) {
        const cat = params[paramIdx++];
        filtered = filtered.filter((i) => i.category === cat);
      }
      if (normalized.includes('user_type = $')) {
        const ut = params[paramIdx++];
        filtered = filtered.filter((i) => i.user_type === ut);
      }
      if (normalized.includes('status = $')) {
        const st = params[paramIdx++];
        filtered = filtered.filter((i) => i.status === st);
      }
      if (normalized.includes('ILIKE')) {
        const q = (params[paramIdx++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || i.phone.includes(q));
      }

      return { rows: [{ count: filtered.length.toString() }] };
    }

    // 8. SELECT inquiries list / export
    if (normalized.includes('SELECT') && normalized.includes('FROM inquiries')) {
      let filtered = [...this.inquiries];
      let paramIdx = 0;

      if (normalized.includes('category = $')) {
        const cat = params[paramIdx++];
        filtered = filtered.filter((i) => i.category === cat);
      }
      if (normalized.includes('user_type = $')) {
        const ut = params[paramIdx++];
        filtered = filtered.filter((i) => i.user_type === ut);
      }
      if (normalized.includes('status = $')) {
        const st = params[paramIdx++];
        filtered = filtered.filter((i) => i.status === st);
      }
      if (normalized.includes('ILIKE')) {
        const q = (params[paramIdx++] || '').replace(/%/g, '').toLowerCase();
        filtered = filtered.filter((i) => i.name.toLowerCase().includes(q) || i.phone.includes(q));
      }

      // Check limit and offset
      if (normalized.includes('LIMIT $') && normalized.includes('OFFSET $')) {
        const limit = parseInt(params[paramIdx++], 10);
        const offset = parseInt(params[paramIdx++], 10);
        const paginated = filtered.slice(offset, offset + limit);
        return { rows: paginated };
      }

      return { rows: filtered };
    }

    return { rows: [] };
  }

  async end() {
    return Promise.resolve();
  }
}

if (config.useMockDb) {
  console.log('⚡ Running in Mock Database mode for automated self-testing/fallback.');
  pool = new MockDatabase();
} else {
  // Production / Staging Supabase PostgreSQL Pool
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase connection pooler
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

/**
 * Executes a parameterized SQL query with the pg Pool.
 * Guaranteed no string concatenation.
 */
export const query = (text, params) => pool.query(text, params);

export default pool;
