import { query, default as pool } from '../config/db.js';

async function run() {
  await query("UPDATE admins SET name = 'TK Admin' WHERE email = 'tk@gmail.com' AND name IS NULL");
  
  const adminsRes = await query("SELECT id, email, name FROM admins WHERE email IN ('admin@k12hunar.com', 'moneyutkarsh@gmail.com', 'tk@gmail.com', 'priya@k12hunar.com', 'rahul@k12hunar.com') ORDER BY email");
  const admins = adminsRes.rows;
  console.log('Target admins:', admins.map(a => `${a.name} (${a.email})`));

  const inquiriesRes = await query("SELECT id FROM inquiries ORDER BY created_at DESC");
  const inquiries = inquiriesRes.rows;
  console.log('Total inquiries to distribute:', inquiries.length);

  // Distribute inquiries: Each admin gets their own distinct set, with some unassigned
  for (let i = 0; i < inquiries.length; i++) {
    const slot = i % (admins.length + 1); // 0..admins.length (last slot = unassigned)
    if (slot < admins.length) {
      await query("UPDATE inquiries SET assigned_to = $1 WHERE id = $2", [admins[slot].id, inquiries[i].id]);
    } else {
      await query("UPDATE inquiries SET assigned_to = NULL WHERE id = $1", [inquiries[i].id]);
    }
  }

  const breakdown = await query(`
    SELECT a.email, a.name, COUNT(i.id) AS assigned_count
    FROM admins a
    LEFT JOIN inquiries i ON a.id = i.assigned_to
    GROUP BY a.id, a.email, a.name
    ORDER BY assigned_count DESC
  `);
  console.log('Assignment breakdown:');
  console.table(breakdown.rows);

  const unassigned = await query("SELECT count(*) FROM inquiries WHERE assigned_to IS NULL");
  console.log('Unassigned inquiries:', unassigned.rows[0].count);

  await pool.end();
}

run().catch(console.error);
