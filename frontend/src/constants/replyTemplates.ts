export interface ReplyTemplate {
  id: string;
  category: string;
  title: string;
  template: string;
}

export const REPLY_TEMPLATES: Record<string, ReplyTemplate[]> = {
  Admission: [
    {
      id: 'adm-brochure',
      category: 'Admission',
      title: 'Prospectus & Admission Roadmap',
      template:
        'Dear {name},\n\nThank you for reaching out to K12 Hunar regarding Admissions. We are delighted to share our comprehensive academic prospectus, curriculum roadmap, and grade-wise evaluation schedule.\n\nYou can schedule an in-person or virtual counseling session with our admissions team at your convenience.\n\nWarm regards,\nAdmissions Office | K12 Hunar',
    },
    {
      id: 'adm-callback',
      category: 'Admission',
      title: 'Counselor Callback Confirmation',
      template:
        'Hello {name},\n\nWe have received your admission inquiry. Our academic counselor will be contacting you shortly on this number to guide you through the enrollment process.\n\nBest wishes,\nK12 Hunar Admissions',
    },
  ],
  Scholarship: [
    {
      id: 'sch-eligibility',
      category: 'Scholarship',
      title: 'Merit Grant & Evaluation Criteria',
      template:
        'Dear {name},\n\nThank you for your inquiry about the K12 Hunar Talent & Merit Scholarship Program. We offer fee waivers and merit grants for academic excellence, STEM innovators, and sports achievers.\n\nPlease find the eligibility parameters and upcoming test dates attached.\n\nBest regards,\nScholarship Committee | K12 Hunar',
    },
    {
      id: 'sch-dates',
      category: 'Scholarship',
      title: 'Scholarship Assessment Dates',
      template:
        'Hello {name},\n\nThe next evaluation round for the K12 Hunar Scholarship Examination is scheduled for this coming weekend. Let us know if you require syllabus samples or mock assessment papers.\n\nWarm regards,\nK12 Hunar Team',
    },
  ],
  Concert: [
    {
      id: 'con-registration',
      category: 'Concert',
      title: 'Inter-School Showcase Registration',
      template:
        'Dear {name},\n\nThank you for your interest in the K12 Hunar Annual Performing Arts & Music Concert! Delegate passes, performance stage slots, and masterclass schedules have been reserved for your school delegation.\n\nLooking forward to an extraordinary showcase!\n\nCordially,\nCultural Committee | K12 Hunar',
    },
    {
      id: 'con-passes',
      category: 'Concert',
      title: 'Audience Passes & Logistics',
      template:
        'Hello {name},\n\nYour inquiry regarding the Annual Symphony Concert passes has been logged. We will issue digital entry QR passes 48 hours prior to the event.\n\nWarm regards,\nK12 Hunar Events Team',
    },
  ],
  'General Query': [
    {
      id: 'gen-welcome',
      category: 'General Query',
      title: 'General Assistance & Portal Guide',
      template:
        'Dear {name},\n\nThank you for contacting K12 Hunar. We have received your query regarding our learning portal and programs. One of our student advisors is reviewing your request and will provide full details shortly.\n\nKind regards,\nSupport Desk | K12 Hunar',
    },
    {
      id: 'gen-schedule',
      category: 'General Query',
      title: 'Consultation Appointment',
      template:
        'Hello {name},\n\nWe would be happy to host a dedicated walkthrough for you. Please let us know which day and time window suits your schedule.\n\nBest regards,\nK12 Hunar Team',
    },
  ],
};

export function fillTemplate(template: string, name: string, category: string): string {
  return template
    .replace(/{name}/g, name || 'Student / Parent')
    .replace(/{category}/g, category || 'Inquiry');
}
