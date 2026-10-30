# K12 Hunar CRM: 90-Second Product Demo Script

**Total Duration:** 01:30 (90 seconds)  
**Presenter:** Engineering Lead / Product Evaluator  
**Video Recording Guidelines:** 1080p, 60fps, clean browser window (1440x900), no browser chrome extensions.

---

### [00:00 ? 00:15] Hook & Editorial Home Page
* **Visual:** Browser opens to `http://localhost:5173` (or production URL). Dark obsidian theme (`#050505`), gold accents (`#FFD60A`), liquid GooeyNav header, and editorial poster cards carousel.
* **Narration:**
  > "Welcome to K12 Hunar CRM 2.0?a full-stack, enterprise-grade admissions and inquiry management platform engineered for Indian grade schools. Built with React 19, Vite, and Node 20 with pure Supabase PostgreSQL, it delivers high performance and zero-dependency reliability."

---

### [00:15 ? 00:30] Public Inquiry Submission & Reference Code
* **Visual:** Click "Submit an inquiry". Select `Parent` and `Scholarship`. Type parent name, email, phone, and inquiry message. Click "Submit Inquiry". Form transitions smoothly into confirmation state with reference code `KH-8F3K2Q4M`. Click "Copy Code".
* **Narration:**
  > "Prospective parents and students submit structured inquiries in seconds. The form includes real-time Zod validation, invisible honeypot bot defenses, and instantly generates a unique 8-character reference code for transparent tracking."

---

### [00:30 ? 00:45] Privacy-Preserving Public Tracker
* **Visual:** Click "Track Inquiry" in navbar (`/track`). Paste the reference code and registered email. Click "Track Status".
* **Narration:**
  > "Using the Public Tracker, submitters verify inquiry progress in real time without exposing sensitive PII. The portal displays current processing stages and estimated counselor response timelines."

---

### [00:45 ? 01:05] Admin Sign-In & Dashboard Operations
* **Visual:** Navigate to `/admin/login`. Click quick-fill demo credentials (`admin@k12hunar.com` / `Admin@12345`) or enter Google verification. Land on Admin Dashboard (`/admin`). Press `/` to focus search, filter by the new inquiry, open the right drawer, change status to `In Progress`, set priority to `High`, and log an internal note: *"Reviewed scholarship eligibility with principal."*
* **Narration:**
  > "Admins access a high-density, keyboard-driven command center. Counselors can instantly search, update statuses, set priority tiers, assign team members, and view related submission history from the same family."

---

### [01:05 ? 01:20] Real-Time Audit Trail & Security
* **Visual:** Navigate to `/admin/activity`. Show the real-time audit event feed displaying the status change and note with timestamp. Navigate to `/admin/settings` &rarr; Security. Highlight session revocation (`Revoke All Sessions`).
* **Narration:**
  > "Every mutation is captured in an immutable audit feed for compliance. In Admin Settings, counselors have timing-safe password controls and one-click global session revocation via monotonic token versioning."

---

### [01:20 ? 01:30] Wrap-up & OpenAPI Documentation
* **Visual:** Switch tab to `/api/docs` showing complete Swagger OpenAPI 3.0 documentation. Show terminal passing 88 tests and 0.000% visual diff.
* **Narration:**
  > "Backed by 88 automated tests, zero visual regression, and comprehensive OpenAPI documentation, K12 Hunar CRM is fully production-ready."
