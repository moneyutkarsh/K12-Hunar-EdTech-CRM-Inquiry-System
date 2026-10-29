import { query } from '../config/db.js';
import { validateEnv } from '../config/env.js';

// Sample realistic Indian first and last names
const firstNames = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Dhruv', 'Kabir', 'Rohan', 'Kunal', 'Devansh', 'Ananya', 'Diya', 'Aadhya', 'Pari', 'Saanvi',
  'Ira', 'Myra', 'Ahana', 'Meera', 'Riya', 'Neha', 'Pooja', 'Tanvi', 'Avani', 'Sneha',
  'Vikram', 'Rajesh', 'Sunil', 'Sanjay', 'Alok', 'Deepak', 'Manish', 'Harish', 'Gaurav', 'Nitin'
];

const lastNames = [
  'Sharma', 'Verma', 'Gupta', 'Mehta', 'Patel', 'Shah', 'Iyer', 'Menon', 'Nair', 'Reddy',
  'Rao', 'Choudhury', 'Mukherjee', 'Chatterjee', 'Banerjee', 'Bhattacharya', 'Kulkarni', 'Deshmukh',
  'Joshi', 'Bhat', 'Singh', 'Kaur', 'Malhotra', 'Kapoor', 'Khanna', 'Chawla', 'Bhasin', 'Bansal'
];

const schoolNames = [
  'Delhi Public School, R.K. Puram', 'The Heritage School, Rohini', 'St. Xavier Senior Secondary',
  'Modern High School for Girls', 'National Public School, Indiranagar', 'Bishop Cotton Boys School',
  'The Cathedral & John Connon School', 'Dhirubhai Ambani International School', 'Bombay Scottish School',
  'DAV Public School, Sector 14', 'Springdales School, Dhaula Kuan', 'Kendriya Vidyalaya IIT Campus'
];

const categories = ['Admission', 'Scholarship', 'Concert', 'General Query'];
const userTypes = ['Parent', 'Student', 'School'];

const inquiryMessages = {
  Admission: [
    'Inquiring about admission criteria, syllabus roadmap, and entrance test requirements for Grade 9 for the upcoming academic cycle.',
    'We are relocating to Mumbai next term. What is the mid-year transfer evaluation process and seat availability in secondary section?',
    'Seeking details regarding teacher-to-student ratio, co-curricular sports focus, and transportation routes for junior batch.',
    'Could you please share fee schedule, installment payment options, and sibling discount policies for primary admissions?',
    'Looking for admission guidelines for Grade 11 Science stream with integrated competitive exam coaching.'
  ],
  Scholarship: [
    'My child has secured national ranking in Olympiads. What merit scholarship opportunities and tuition waivers are available?',
    'Applying for the talent grant in performing arts. Could you outline audition dates and required documentation?',
    'Seeking information on need-based financial aid, eligibility cutoffs, and application deadlines for the 2026-2027 cycle.',
    'Are there athletic fee exemptions for state-level badminton players? Please share sports scholarship criteria.',
    'Requesting guidance on the STEM innovation scholarship test syllabus and previous year assessment papers.'
  ],
  Concert: [
    'Our school would like to register a 25-student delegation for the Annual Inter-School Music and Dance Symphony.',
    'Inquiring about stage specs, sound check schedules, and reporting times for the upcoming regional folk concert.',
    'We wish to host an orchestral masterclass with the visiting maestros. Please let us know the guest instructor fee and logistics.',
    'Seeking tickets and VIP seating passes for the annual winter showcase for our alumni association council.',
    'Can our junior choir submit a pre-recorded audition tape for the finals, or is physical presence mandatory for selection?'
  ],
  'General Query': [
    'Requesting information regarding after-school coding, robotics club schedules, and mentor credentials.',
    'How do parents monitor weekly assignment submissions and attendance on the mobile parent portal app?',
    'Could our faculty receive a demo of the digital LMS and teacher analytics dashboard next Wednesday afternoon?',
    'Inquiring if weekend foreign language certificates (French / Spanish / German) are accredited by national boards.',
    'What are the campus health protocols, certified nurse availability, and student emergency care insurance terms?'
  ]
};

// Generates a timestamp weighted towards weekdays and 10:00-20:00 IST (UTC 04:30 to 14:30)
function generateRealisticDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  // Weekday weighting: if Saturday (6) or Sunday (0), 70% chance to shift to adjacent weekday
  const dayOfWeek = date.getDay();
  if ((dayOfWeek === 0 || dayOfWeek === 6) && Math.random() < 0.7) {
    date.setDate(date.getDate() + (dayOfWeek === 0 ? 1 : -1));
  }

  // IST hour: between 10:00 and 20:00 IST (80% probability), otherwise 08:00 to 22:00
  let istHour;
  if (Math.random() < 0.8) {
    istHour = 10 + Math.floor(Math.random() * 11); // 10 to 20
  } else {
    istHour = 8 + Math.floor(Math.random() * 14); // 8 to 22
  }
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);

  // Convert IST (UTC+5:30) to UTC
  const utcHours = istHour - 5.5;
  date.setUTCHours(Math.floor(utcHours));
  date.setUTCMinutes(minute + (utcHours % 1 !== 0 ? 30 : 0));
  date.setUTCSeconds(second);

  return date.toISOString();
}

export async function seedHistory({ force = false } = {}) {
  validateEnv();
  console.log('🌱 Starting seed:history for K12 Hunar CRM...');

  // 1. Check idempotency: count inquiries older than 7 days
  const checkSql = `SELECT COUNT(*) AS count FROM inquiries WHERE created_at < NOW() - INTERVAL '7 days'`;
  const checkRes = await query(checkSql);
  const olderCount = parseInt(checkRes.rows[0].count, 10);

  if (olderCount >= 40 && !force) {
    console.log(`ℹ️ Idempotency check: Found ${olderCount} inquiries older than 7 days. Skipping seed:history. (Pass --force to override)`);
    return { skipped: true, olderCount };
  }

  // 2. Fetch an active admin ID for activity log attribution
  const adminRes = await query(`SELECT id, email FROM admins WHERE is_active = true LIMIT 1`);
  const adminId = adminRes.rows[0]?.id || null;

  // 3. Generate 70 realistic inquiries spread across the last 90 days
  const targetCount = 70;
  console.log(`🚀 Inserting ${targetCount} historical inquiries across 90 days (weighted IST daytime)...`);

  let insertedCount = 0;

  for (let i = 0; i < targetCount; i++) {
    // Spread daysAgo non-linearly across 90 days to create a natural trajectory curve
    // More volume in recent 30 days, steady tapering back to 90 days
    const daysAgo = Math.floor(Math.pow(Math.random(), 1.6) * 89) + 1;
    const createdAt = generateRealisticDate(daysAgo);

    // Pick user type and category
    const userType = Math.random() < 0.2 ? 'School' : Math.random() < 0.65 ? 'Parent' : 'Student';
    const category = categories[Math.floor(Math.random() * categories.length)];

    let name, email, phone;
    if (userType === 'School') {
      name = schoolNames[Math.floor(Math.random() * schoolNames.length)];
      const prefix = name.toLowerCase().replace(/[^a-z]/g, '').slice(0, 10);
      email = `inquiries@${prefix}.edu.in`;
      phone = `+91 11 ${2000 + Math.floor(Math.random() * 8000)} ${1000 + Math.floor(Math.random() * 9000)}`;
    } else {
      const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
      const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
      name = `${fn} ${ln}`;
      email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 99)}@gmail.com`;
      phone = `+91 ${90000 + Math.floor(Math.random() * 9999)} ${10000 + Math.floor(Math.random() * 89999)}`;
    }

    const messages = inquiryMessages[category];
    const message = messages[Math.floor(Math.random() * messages.length)];

    // Status weighting based on age:
    // Older inquiries (>30d) are mostly Resolved; recent (<7d) are New / In Progress
    let status;
    const rand = Math.random();
    if (daysAgo > 30) {
      status = rand < 0.85 ? 'Resolved' : rand < 0.95 ? 'In Progress' : 'New';
    } else if (daysAgo > 7) {
      status = rand < 0.6 ? 'Resolved' : rand < 0.9 ? 'In Progress' : 'New';
    } else {
      status = rand < 0.25 ? 'Resolved' : rand < 0.7 ? 'In Progress' : 'New';
    }

    // Insert inquiry row
    const insertInquirySql = `
      INSERT INTO inquiries (
        user_type, category, name, email, phone, message, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      RETURNING id, created_at
    `;
    const inqRes = await query(insertInquirySql, [
      userType, category, name, email, phone, message, status, createdAt
    ]);
    const inquiryId = inqRes.rows[0].id;

    // Log creation activity
    await query(`
      INSERT INTO activity_log (inquiry_id, admin_id, action, from_value, to_value, created_at)
      VALUES ($1, NULL, 'created', NULL, 'New', $2)
    `, [inquiryId, createdAt]);

    // If In Progress or Resolved, add transition activity log entries
    if (status === 'In Progress' || status === 'Resolved') {
      const progressDate = new Date(new Date(createdAt).getTime() + (2 + Math.floor(Math.random() * 24)) * 3600000).toISOString();
      await query(`
        INSERT INTO activity_log (inquiry_id, admin_id, action, from_value, to_value, created_at)
        VALUES ($1, $2, 'status_changed', 'New', 'In Progress', $3)
      `, [inquiryId, adminId, progressDate]);

      if (status === 'Resolved') {
        const resolvedDate = new Date(new Date(progressDate).getTime() + (12 + Math.floor(Math.random() * 48)) * 3600000).toISOString();
        await query(`
          INSERT INTO activity_log (inquiry_id, admin_id, action, from_value, to_value, created_at)
          VALUES ($1, $2, 'status_changed', 'In Progress', 'Resolved', $3)
        `, [inquiryId, adminId, resolvedDate]);
      }
    }

    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} historical inquiries across 90 days!`);
  return { success: true, count: insertedCount };
}

// CLI execution handler
if (process.argv[1]?.endsWith('seedHistory.js')) {
  const force = process.argv.includes('--force');
  seedHistory({ force })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ seed:history failed:', err);
      process.exit(1);
    });
}
