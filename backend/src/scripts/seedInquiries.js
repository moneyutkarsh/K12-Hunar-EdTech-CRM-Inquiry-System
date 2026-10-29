import { query } from '../config/db.js';
import { validateEnv } from '../config/env.js';

const sampleInquiries = [
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Pooja Bhattacharya',
    email: 'pooja.bhatt@gmail.com',
    phone: '+91 98201 12345',
    message: 'Seeking admission criteria and curriculum roadmap for Grade 8 student starting upcoming academic year.',
    status: 'New',
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Rohan Mehra',
    email: 'rohan.mehra@outlook.com',
    phone: '+91 98711 44556',
    message: 'Requesting details for the National Young Innovator music & STEM scholarship test dates.',
    status: 'In Progress',
  },
  {
    user_type: 'School',
    category: 'Concert',
    name: 'St. Xavier High School',
    email: 'activities@stxavierschool.edu',
    phone: '+91 11 2688 1234',
    message: 'Interested in partnering for the Winter Inter-School Choir and Classical Dance concert series.',
    status: 'Resolved',
  },
  {
    user_type: 'Parent',
    category: 'Scholarship',
    name: 'Ananya Deshmukh',
    email: 'ananya.desh@yahoo.co.in',
    phone: '+91 94250 88990',
    message: 'My daughter is a state-level chess player. Are there specialized sports & academic scholarships available?',
    status: 'New',
  },
  {
    user_type: 'Student',
    category: 'Admission',
    name: 'Aditya Varma',
    email: 'aditya.v@gmail.com',
    phone: '+91 99887 66554',
    message: 'Can I transfer credits into the EdTech online cohort from another board mid-session?',
    status: 'In Progress',
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Heritage International Academy',
    email: 'principal@heritageacademy.ac.in',
    phone: '+91 22 2778 9900',
    message: 'Seeking information on institutional teacher training modules and student inquiry portal integration.',
    status: 'New',
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Vikramjit Singh',
    email: 'vikram.singh@gmail.com',
    phone: '+91 98140 11223',
    message: 'Are counseling sessions available on weekends for parents exploring blended learning tracks?',
    status: 'Resolved',
  },
  {
    user_type: 'Student',
    category: 'Concert',
    name: 'Tanvi Nair',
    email: 'tanvi.nair@icloud.com',
    phone: '+91 97455 33221',
    message: 'Audition guidelines for the Hunar acoustic guitar ensemble performance next month.',
    status: 'New',
  },
  {
    user_type: 'School',
    category: 'Scholarship',
    name: 'Kendriya Vidyalaya No. 2',
    email: 'kv2.coordination@gov.in',
    phone: '+91 11 2554 4433',
    message: 'How can our underprivileged top-rankers register for the fee waiver and laptop grant program?',
    status: 'In Progress',
  },
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Deepak Kulkarni',
    email: 'deepak.kulkarni@tcs.com',
    phone: '+91 98220 55441',
    message: 'Do you offer robotics after-school electives along with the standard high school curriculum?',
    status: 'New',
  },
  {
    user_type: 'Student',
    category: 'General Query',
    name: 'Sara Khan',
    email: 'sara.khan2010@gmail.com',
    phone: '+91 99100 88776',
    message: 'Where can I access past question papers for the Hunar Talent Olympiad?',
    status: 'Resolved',
  },
  {
    user_type: 'School',
    category: 'Admission',
    name: 'Oakridge Global School',
    email: 'admissions@oakridge.org',
    phone: '+91 40 2345 6789',
    message: 'Requesting collaborative exchange program admission guidelines for 11th grade international baccalaureate.',
    status: 'In Progress',
  },
  {
    user_type: 'Parent',
    category: 'Concert',
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@gmail.com',
    phone: '+91 94440 12349',
    message: 'Can non-enrolled students purchase tickets for the upcoming youth symphony concert?',
    status: 'New',
  },
  {
    user_type: 'Student',
    category: 'Scholarship',
    name: 'Kabir Sengupta',
    email: 'kabir.sen@gmail.com',
    phone: '+91 98301 77665',
    message: 'Need clarification regarding the income certificate submission deadline for the fellowship.',
    status: 'In Progress',
  },
  {
    user_type: 'School',
    category: 'Concert',
    name: 'The Cathedral School',
    email: 'arts@cathedralschool.edu',
    phone: '+91 22 2200 4545',
    message: 'Proposing an inter-state digital performing arts showcase for K12 learners.',
    status: 'Resolved',
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Sunita Rao',
    email: 'sunita.rao@hotmail.com',
    phone: '+91 98800 66551',
    message: 'What is the teacher-to-student ratio in the live interactive science cohorts?',
    status: 'New',
  },
  {
    user_type: 'Student',
    category: 'Admission',
    name: 'Manish Rawat',
    email: 'manish.rawat@gmail.com',
    phone: '+91 98730 22334',
    message: 'Inquiring about late admission penalty or fee structure for semester 2 enrollment.',
    status: 'New',
  },
  {
    user_type: 'School',
    category: 'Scholarship',
    name: 'Army Public School',
    email: 'principal@apsdhaula.edu',
    phone: '+91 11 2615 1100',
    message: 'Special defense personnel ward scholarship quotas and documentation checklist.',
    status: 'Resolved',
  },
  {
    user_type: 'Parent',
    category: 'Scholarship',
    name: 'Harpreet Kaur',
    email: 'harpreet.k@gmail.com',
    phone: '+91 98150 99887',
    message: 'Is there a sibling scholarship discount if two children enroll concurrently?',
    status: 'In Progress',
  },
  {
    user_type: 'Student',
    category: 'General Query',
    name: 'Yashwardhan Joshi',
    email: 'yash.joshi@gmail.com',
    phone: '+91 94050 44332',
    message: 'How can I connect with an academic mentor for guidance on career choices in AI & design?',
    status: 'New',
  },
  {
    user_type: 'School',
    category: 'General Query',
    name: 'Delhi Public School R.K. Puram',
    email: 'headmistress@dpsrkp.net',
    phone: '+91 11 4911 5500',
    message: 'Organizing a career symposium on futuristic vocations for classes 10-12.',
    status: 'In Progress',
  },
  {
    user_type: 'Parent',
    category: 'Admission',
    name: 'Kavita Menon',
    email: 'kavita.menon@gmail.com',
    phone: '+91 98470 55112',
    message: 'Can we schedule a one-on-one virtual campus tour before finalizing the admission form?',
    status: 'Resolved',
  },
  {
    user_type: 'Student',
    category: 'Concert',
    name: 'Farhan Zaidi',
    email: 'farhan.z@gmail.com',
    phone: '+91 98920 11990',
    message: 'Inquiry regarding backstage volunteering and audio engineering internship at the concert.',
    status: 'New',
  },
  {
    user_type: 'School',
    category: 'Admission',
    name: 'Modern High School for Girls',
    email: 'admissions@mhsforgirls.com',
    phone: '+91 33 2475 1234',
    message: 'Collaborative curriculum integration query for junior coding and visual arts lab.',
    status: 'New',
  },
  {
    user_type: 'Parent',
    category: 'General Query',
    name: 'Rajesh Chawla',
    email: 'rajesh.chawla@gmail.com',
    phone: '+91 98101 77221',
    message: 'What payment gateway options are supported, and is EMI available on annual tuition?',
    status: 'Resolved',
  },
];

async function seedInquiries() {
  validateEnv();

  console.log(`🌱 Seeding ${sampleInquiries.length} sample inquiries...`);

  let insertedCount = 0;
  for (const item of sampleInquiries) {
    const insertSql = `
      INSERT INTO inquiries (user_type, category, name, email, phone, message, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await query(insertSql, [
      item.user_type,
      item.category,
      item.name,
      item.email,
      item.phone,
      item.message,
      item.status,
    ]);
    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} realistic inquiries!`);
  process.exit(0);
}

seedInquiries().catch((err) => {
  console.error('❌ Failed to seed inquiries:', err.message);
  process.exit(1);
});
