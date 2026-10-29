import { query } from '../config/db.js';
import { validateEnv } from '../config/env.js';

// Helper to generate dates spread across the last 45 days
function getDateAgo(daysAgo, hourOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(d.getHours() - hourOffset);
  return d.toISOString();
}

const sampleInquiries = [
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Pooja Bhattacharya',
    email: 'pooja.bhatt@gmail.com',
    phone: '+91 98201 12345',
    message: 'Seeking admission criteria and curriculum roadmap for Grade 8 student starting upcoming academic year.',
    status: 'New',
    created_at: getDateAgo(1, 2),
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@outlook.com',
    phone: '+91 98711 44556',
    message: 'Requesting details for the National Young Innovator music & STEM scholarship test dates.',
    status: 'In Progress',
    created_at: getDateAgo(2, 4),
  },
  {
    user_type: 'School',
    category: 'Concert',
    name: 'St. Xavier High School',
    email: 'activities@stxavierschool.edu',
    phone: '+91 11 2688 1234',
    message: 'Interested in partnering for the Winter Inter-School Choir and Classical Dance concert series.',
    status: 'Resolved',
    created_at: getDateAgo(3, 1),
  },
  {
    user_type: 'Parent',
    category: 'Scholarship',
    name: 'Ananya Deshmukh',
    email: 'ananya.desh@yahoo.co.in',
    phone: '+91 94250 88990',
    message: 'My daughter is a state-level chess player. Are there specialized sports & academic scholarships available?',
    status: 'New',
    created_at: getDateAgo(4, 3),
  },
  {
    user_type: 'Student',
    category: 'Admission',
    name: 'Aditya Varma',
    email: 'aditya.v@gmail.com',
    phone: '+91 99887 66554',
    message: 'Can I transfer credits into the EdTech online cohort from another board mid-session?',
    status: 'In Progress',
    created_at: getDateAgo(5, 5),
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Heritage International Academy',
    email: 'principal@heritageacademy.ac.in',
    phone: '+91 22 2778 9900',
    message: 'Seeking information on institutional teacher training modules and student inquiry portal integration.',
    status: 'New',
    created_at: getDateAgo(6, 2),
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Vikramjit Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+91 98140 11223',
    message: 'Are counseling sessions available on weekends for parents exploring blended learning tracks?',
    status: 'Resolved',
    created_at: getDateAgo(7, 6),
  },
  {
    user_type: 'Student',
    category: 'Concert',
    name: 'Tanvi Nair',
    email: 'tanvi.nair@icloud.com',
    phone: '+91 97455 33221',
    message: 'Audition guidelines for the Hunar acoustic guitar ensemble performance next month.',
    status: 'New',
    created_at: getDateAgo(8, 3),
  },
  {
    user_type: 'School',
    category: 'Scholarship',
    name: 'Kendriya Vidyalaya No. 2',
    email: 'kv2.coordination@gov.in',
    phone: '+91 11 2554 4433',
    message: 'How can our underprivileged top-rankers register for the fee waiver and laptop grant program?',
    status: 'In Progress',
    created_at: getDateAgo(9, 4),
  },
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Deepak Kulkarni',
    email: 'deepak.kulkarni@tcs.com',
    phone: '+91 98220 55441',
    message: 'Do you offer robotics after-school electives along with the standard high school curriculum?',
    status: 'New',
    created_at: getDateAgo(10, 1),
  },
  {
    user_type: 'Student',
    category: 'General Query',
    name: 'Sara Khan',
    email: 'sara.khan2010@gmail.com',
    phone: '+91 99100 88776',
    message: 'Where can I access past question papers for the Hunar Talent Olympiad?',
    status: 'Resolved',
    created_at: getDateAgo(11, 7),
  },
  {
    user_type: 'School',
    category: 'Admission',
    name: 'Oakridge Global School',
    email: 'admissions@oakridge.org',
    phone: '+91 40 2345 6789',
    message: 'Requesting collaborative exchange program admission guidelines for 11th grade international baccalaureate.',
    status: 'In Progress',
    created_at: getDateAgo(12, 3),
  },
  {
    user_type: 'Parent',
    category: 'Concert',
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@gmail.com',
    phone: '+91 94440 12349',
    message: 'Can non-enrolled students purchase tickets for the upcoming youth symphony concert?',
    status: 'New',
    created_at: getDateAgo(13, 2),
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Kabir Sengupta',
    email: 'kabir.sen@gmail.com',
    phone: '+91 98301 77665',
    message: 'Need clarification regarding the income certificate submission deadline for the fellowship.',
    status: 'In Progress',
    created_at: getDateAgo(14, 5),
  },
  {
    user_type: 'School',
    category: 'Concert',
    name: 'The Cathedral School',
    email: 'arts@cathedralschool.edu',
    phone: '+91 22 2200 4545',
    message: 'Proposing an inter-state digital performing arts showcase for K12 learners.',
    status: 'Resolved',
    created_at: getDateAgo(15, 6),
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Sunita Rao',
    email: 'sunita.rao@hotmail.com',
    phone: '+91 98800 66551',
    message: 'What is the teacher-to-student ratio in the live interactive science cohorts?',
    status: 'New',
    created_at: getDateAgo(16, 2),
  },
  {
    user_type: 'Student',
    category: 'Admission',
    name: 'Manish Rawat',
    email: 'manish.rawat@gmail.com',
    phone: '+91 98730 22334',
    message: 'Inquiring about late admission penalty or fee structure for semester 2 enrollment.',
    status: 'New',
    created_at: getDateAgo(17, 4),
  },
  {
    user_type: 'School',
    category: 'Scholarship',
    name: 'Army Public School',
    email: 'principal@apsdhaula.edu',
    phone: '+91 11 2615 1100',
    message: 'Special defense personnel ward scholarship quotas and documentation checklist.',
    status: 'Resolved',
    created_at: getDateAgo(18, 3),
  },
  {
    user_type: 'Parent',
    category: 'Scholarship',
    name: 'Harpreet Kaur',
    email: 'harpreet.k@gmail.com',
    phone: '+91 98150 99887',
    message: 'Is there a sibling scholarship discount if two children enroll concurrently?',
    status: 'In Progress',
    created_at: getDateAgo(19, 1),
  },
  {
    user_type: 'Student',
    category: 'General Query',
    name: 'Yashwardhan Joshi',
    email: 'yash.joshi@gmail.com',
    phone: '+91 94050 44332',
    message: 'How can I connect with an academic mentor for guidance on career choices in AI & design?',
    status: 'New',
    created_at: getDateAgo(20, 5),
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Delhi Public School R.K. Puram',
    email: 'headmistress@dpsrkp.net',
    phone: '+91 11 4911 5500',
    message: 'Organizing a career symposium on futuristic vocations for classes 10-12.',
    status: 'In Progress',
    created_at: getDateAgo(21, 2),
  },
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Kavita Menon',
    email: 'kavita.menon@gmail.com',
    phone: '+91 98470 55112',
    message: 'Can we schedule a one-on-one virtual campus tour before finalizing the admission form?',
    status: 'Resolved',
    created_at: getDateAgo(22, 4),
  },
  {
    user_type: 'Student',
    category: 'Concert',
    name: 'Farhan Zaidi',
    email: 'farhan.z@gmail.com',
    phone: '+91 98920 11990',
    message: 'Inquiry regarding backstage volunteering and audio engineering internship at the concert.',
    status: 'New',
    created_at: getDateAgo(23, 3),
  },
  {
    user_type: 'School',
    category: 'Admission',
    name: 'Modern High School for Girls',
    email: 'admissions@mhsforgirls.com',
    phone: '+91 33 2475 1234',
    message: 'Collaborative curriculum integration query for junior coding and visual arts lab.',
    status: 'New',
    created_at: getDateAgo(24, 6),
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Rajesh Chawla',
    email: 'rajesh.chawla@gmail.com',
    phone: '+91 98101 77221',
    message: 'What payment gateway options are supported, and is EMI available on annual tuition?',
    status: 'Resolved',
    created_at: getDateAgo(25, 2),
  },
  // Additional 15 rows distributed to reach 40 rows across 45 days
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Bhavna Chokshi',
    email: 'bhavna.c@gmail.com',
    phone: '+91 98250 11442',
    message: 'Inquiring about syllabus differences between ICSE and Cambridge primary boards.',
    status: 'New',
    created_at: getDateAgo(27, 4),
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Devansh Trivedi',
    email: 'devansh.t@outlook.com',
    phone: '+91 98790 33221',
    message: 'Eligibility criteria for Hunar Junior Mathematics Research Fellowship.',
    status: 'In Progress',
    created_at: getDateAgo(29, 1),
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Bishop Cotton Boys School',
    email: 'admin@bishopcotton.edu.in',
    phone: '+91 80 2221 1443',
    message: 'Looking to set up a smart robotics incubation club on campus for middle schoolers.',
    status: 'Resolved',
    created_at: getDateAgo(31, 5),
  },
  {
    user_type: 'Parent',
    category: 'Concert',
    name: 'Tarun Banerjee',
    email: 'tarun.b@yahoo.com',
    phone: '+91 98310 99881',
    message: 'How can parents obtain VIP seating passes for the annual inter-school theater showcase?',
    status: 'New',
    created_at: getDateAgo(33, 2),
  },
  {
    user_type: 'Student',
    category: 'Admission',
    name: 'Nandini Swaminathan',
    email: 'nandini.s@gmail.com',
    phone: '+91 98400 44552',
    message: 'Are there any prerequisite coding tests before joining the senior data science module?',
    status: 'Resolved',
    created_at: getDateAgo(35, 3),
  },
  {
    user_type: 'School',
    category: 'Scholarship',
    name: 'Mayo College',
    email: 'bursar@mayocollege.org',
    phone: '+91 145 266 0150',
    message: 'Seeking corporate CSR partnership details for rural boarding school scholarships.',
    status: 'In Progress',
    created_at: getDateAgo(36, 4),
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Gaurav Aggarwal',
    email: 'gaurav.aggarwal@gmail.com',
    phone: '+91 98110 55667',
    message: 'Can student evaluation reports be shared with both parents on separate email addresses?',
    status: 'Resolved',
    created_at: getDateAgo(38, 2),
  },
  {
    user_type: 'Student',
    category: 'Concert',
    name: 'Siddharth Roy',
    email: 'sid.roy@gmail.com',
    phone: '+91 98210 66778',
    message: 'Can students form inter-school bands for the Western Rock competition track?',
    status: 'New',
    created_at: getDateAgo(40, 5),
  },
  {
    user_type: 'School',
    category: 'Admission',
    name: 'La Martiniere for Boys',
    email: 'secretary@lamartiniere.edu.in',
    phone: '+91 33 2287 2414',
    message: 'Requesting batch enrollment prospectus for gifted learning acceleration programs.',
    status: 'Resolved',
    created_at: getDateAgo(41, 1),
  },
  {
    user_type: 'Parent',
    category: 'Scholarship',
    name: 'Shalini Murthy',
    email: 'shalini.murthy@wipro.com',
    phone: '+91 98801 88992',
    message: 'Do you offer girls-in-STEM leadership scholarships for Grade 10 students?',
    status: 'In Progress',
    created_at: getDateAgo(42, 6),
  },
  {
    user_type: 'Student',
    category: 'General Query',
    name: 'Arjun Dasgupta',
    email: 'arjun.dg@gmail.com',
    phone: '+91 98300 11993',
    message: 'How do I access recordings of missed live lectures during school exam weeks?',
    status: 'Resolved',
    created_at: getDateAgo(43, 2),
  },
  {
    user_type: 'School',
    category: 'Concert',
    name: 'Welham Girls School',
    email: 'performingarts@welhamgirls.edu.in',
    phone: '+91 135 265 7223',
    message: 'Confirming technical staging specs and light rigging for the Uttarakhand youth play.',
    status: 'Resolved',
    created_at: getDateAgo(44, 4),
  },
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Manoj Tiwari',
    email: 'manoj.tiwari@gmail.com',
    phone: '+91 99350 22114',
    message: 'What is the refund policy if a family relocates to another state during the academic term?',
    status: 'New',
    created_at: getDateAgo(45, 1),
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Rhea Pillai',
    email: 'rhea.pillai@gmail.com',
    phone: '+91 98450 77881',
    message: 'Can 12th grade students apply for university pre-foundation partial scholarships?',
    status: 'In Progress',
    created_at: getDateAgo(45, 6),
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Scindia School',
    email: 'principal@scindia.edu',
    phone: '+91 751 248 0750',
    message: 'Requesting an on-site experiential demonstration of the Hunar digital studio portal.',
    status: 'Resolved',
    created_at: getDateAgo(45, 8),
  },
];

async function seedInquiries() {
  validateEnv();

  console.log(`🌱 Seeding ${sampleInquiries.length} realistic inquiries across last 45 days...`);

  // Optional: check if truncate flag provided: node seedInquiries.js --truncate
  if (process.argv.includes('--truncate')) {
    console.log('🧹 Truncating inquiries table (--truncate flag passed)...');
    await query('TRUNCATE inquiries CASCADE');
  }

  let insertedCount = 0;
  for (const item of sampleInquiries) {
    // Check for duplicate by email to remain idempotent
    const checkSql = 'SELECT id FROM inquiries WHERE email = $1 LIMIT 1';
    const checkRes = await query(checkSql, [item.email.toLowerCase()]);

    if (checkRes.rows.length === 0) {
      const insertSql = `
        INSERT INTO inquiries (user_type, category, name, email, phone, message, status, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
      `;
      await query(insertSql, [
        item.user_type,
        item.category,
        item.name,
        item.email.toLowerCase(),
        item.phone,
        item.message,
        item.status,
        item.created_at,
      ]);
      insertedCount++;
    }
  }

  console.log(`✅ Seed process completed. Inserted ${insertedCount} new inquiries (Total dataset: 40).`);
  process.exit(0);
}

seedInquiries().catch((err) => {
  console.error('❌ Failed to seed inquiries:', err.message);
  process.exit(1);
});
