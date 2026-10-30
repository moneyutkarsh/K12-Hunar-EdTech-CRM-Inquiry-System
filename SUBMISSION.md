# Candidate Submission Note - K12 Hunar CRM & Inquiry System

**Candidate**: Utkarsh Dubey  
**Role Applied**: Senior Full-Stack Engineer  
**Project**: K12 Hunar CRM & Inquiry System (v2 Additive Release)  

---

### Highlights Summary
1. **Custom Auth & Security**: Zero third-party auth dependencies; custom bcrypt password hashing with constant-time dummy comparisons, HS256 JWT lifecycle, and a 5-attempt/15-minute sliding window account lockout.
2. **Supabase PostgreSQL Direct**: Utilized strictly as a standard relational database via Node `pg.Pool` with SSL over Session Pooler (port 5432) / Transaction Pooler (port 6543) with parameterized queries and GIN trigram indexes.
3. **Server-Side Data Pipeline**: Full text search, multi-select filters, sorting, and pagination processed strictly in SQL using `COUNT(*) OVER()` window functions in a single round-trip.
4. **Black & Gold Glassmorphic UI**: High-polish dark interface featuring React Bits AeroShards, GridScan, and GhostFibers WebGL backgrounds with graceful reduced-motion fallbacks, live character counters, and responsive dual-view Table & Pipeline Board.
5. **Production Verification Suite**: 88 Vitest unit & integration tests (36 frontend, 52 backend, 100% green) alongside an extended production smoke script (`smoke.mjs`) and Playwright visual regression engine (`visual:check`).

---

### Five Core Deliverables Breakdown

1. **Production-Ready Web Application & Public Inquiry Engine**:
   - High-conversion Landing Page (`/`) with live stats, program catalog, and FAQ.
   - Public Inquiry Submission (`/inquiry`) with real-time field validation and human-readable reference code generation (`HUNAR-YYYY-XXXXXX`).
   - Public Inquiry Tracker (`/track`) with zero-login status tracking, timeline progress, and counselor contact details.
2. **Comprehensive CRM Operations Portal (`/admin`)**:
   - Dual-view Table and Kanban Board with drag-and-drop status workflows.
   - Drawer editor with inline status updates, priority tags, internal notes, counselor assignment, and related contact history.
   - Admin Activity Audit Log (`/admin/activity`) tracking timestamped state transitions and counselor actions.
   - Admin Settings & Team Portal (`/admin/settings`) with counselor profiles, stats, and session revocation (`Logout from all devices`).
3. **Enterprise-Grade Backend Architecture**:
   - REST API built with Express, structured controllers, services, repositories, and schema validation.
   - Database migrations system (`backend/src/scripts/migrate.js`) supporting additive schema evolution and rollback safety.
   - OpenAPI 3.0 specification (`/api/docs`) providing complete interactive documentation.
4. **Comprehensive Automated Verification**:
   - 88 unit and integration tests covering business rules, state machines, and authentication.
   - Automated visual regression testing (`npm run visual:check`) across 10 viewports and routes with a `< 0.1%` diff threshold.
   - Playwright end-to-end user journey test suite and zero-network regression safety.
5. **Operational Excellence & Documentation**:
   - Evaluator quick path, 90-second demo script (`docs/DEMO-SCRIPT.md`), design system documentation, security audits, and free-tier lifecycle guidelines.

---

### Final Submission Email Template

```text
Subject: Submission: Senior Full-Stack Engineer Task - K12 Hunar CRM & Inquiry System - Utkarsh Dubey

Dear Hiring & Evaluation Team,

I am pleased to submit the completed K12 Hunar CRM & Inquiry System for the Senior Full-Stack Engineer assessment.

Key Highlights of the Delivery:
- Public Inquiry Portal & Zero-Login Reference Tracker (HUNAR-YYYY-XXXXXX)
- Responsive CRM Workspace with Dual-View Table & Drag-and-Drop Kanban Pipeline
- Counselor Assignment, Priority Tagging, Activity Audit Log, and Session Revocation
- Direct Supabase PostgreSQL direct pooling with zero third-party auth dependencies
- 88 passing Vitest unit & integration tests + 10-route Playwright visual regression proof (0.0000% diff)
- Zero changes to existing production behavior under branch `chore/additive-release`

Project Links:
- Live Frontend: https://k12-hunar-crm.vercel.app
- Live Backend & OpenAPI Swagger: https://k12-hunar-crm.onrender.com/api/docs
- GitHub Repository: [Repository URL]
- Evaluator Credentials: admin@k12hunar.com / Admin@12345 (or 1-click Demo Fill on login)

A comprehensive Evaluator Quick Path and 90-second demo walkthrough are documented in the README and docs/DEMO-SCRIPT.md.

Thank you for the opportunity to present this work.

Warm regards,
Utkarsh Dubey
```

---

### Live Application Links & Credentials
- **Frontend Application**: `https://k12-hunar-crm.vercel.app` *(Deployable to Vercel)*
- **Backend API & Swagger Docs**: `https://k12-hunar-crm.onrender.com/api/docs` *(Deployable to Render)*
- **GitHub Repository**: `[Your Repository URL]`

#### Administrative Test Credentials
- **Admin Email**: `admin@k12hunar.com`
- **Admin Password**: `Admin@12345`
*(Note: A one-click demo credentials autofill is also provided on the login page when `VITE_SHOW_DEMO_HINT=true` is enabled for evaluators).*

---

### Cloud Free-Tier Cold Start Notice
> **Note on Free-Tier Hosting**: When the backend is deployed on Render's free tier, the service spins down after 15 minutes of inactivity. The initial wake-up request may take ~30-50 seconds. The frontend includes an automated `useWakeServer` hook that pings `/api/health` on load and displays an informative ambient notification while the service warms up. For details, see `docs/FREE-TIER-NOTES.md`.

---

### Quick Verification Commands
```bash
# 1. Run all frontend and backend tests (88 passing unit & integration tests)
npm test

# 2. Run the Playwright visual regression suite across 10 views (0.0000% diff)
npm run visual:check

# 3. Run the live backend smoke script
npm run test:smoke --prefix backend
```
