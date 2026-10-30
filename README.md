# K12 Hunar CRM & Inquiry System (Advanced Edition)

[![CI Build & Test](https://github.com/utkarshdubey/k12-hunar-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/utkarshdubey/k12-hunar-crm/actions)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node: 20+](https://img.shields.io/badge/Node-20%2B-green.svg)
![Database: Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20Postgres-3ECF8E.svg)

A full-stack, production-grade EdTech Customer Relationship Management (CRM) and Inquiry System built with **React 18/19, Vite, TypeScript, Tailwind CSS, shadcn/ui**, and an **Express.js (Node 20+)** backend with custom timing-safe JWT authentication and **Supabase PostgreSQL** accessed strictly as plain relational Postgres via `pg.Pool` on port 6543.

- 📚 **Interactive Swagger API Documentation**: `http://localhost:5000/api/docs` (or deployed at `/api/docs`)
- 🧪 **Automated Test Suite**: 88 Vitest unit & integration tests + 7 smoke assertions (100% green)

---

---

## ? Evaluator Quick Path

| Key Resource | URL / Credential |
| :--- | :--- |
| **Live Frontend URL** | `https://k12-hunar-crm.vercel.app` *(or local: `http://localhost:5173`)* |
| **Live API Backend URL** | `https://k12-hunar-crm.onrender.com/api` *(or local: `http://localhost:5000/api`)* |
| **Interactive OpenAPI Docs** | `https://k12-hunar-crm.onrender.com/api/docs` *(or local: `/api/docs`)* |
| **Documented Evaluator Account** | **Email:** `admin@k12hunar.com` &bull; **Password:** `Admin@12345` |

> [!NOTE]
> **Free-Tier Cold-Start Notice:** If accessing the live Render deployment after inactivity, the free-tier service spins down. The initial API health ping may take ~45?50 seconds to warm up the container. The frontend features an automatic server wakeup detection banner that resolves as soon as the API responds.

### 6-Step Evaluator Walkthrough (Takes < 90 Seconds)
1. **Submit an Inquiry (`/inquiry`):** Open the public inquiry form. Select `Parent` &rarr; `Scholarship`, enter your details, and submit.
2. **Copy Reference Code:** Upon submission, an 8-character reference code (e.g. `KH-7F2K9M4X`) is generated and presented on screen with a one-click copy button.
3. **Track Your Submission (`/track`):** Navigate to the Public Tracker. Enter the reference code and your registered email address to view live status and the estimated resolution timeline.
4. **Sign In as Administrator (`/admin/login`):** Use the pre-filled quick demo credentials (`admin@k12hunar.com` / `Admin@12345`) or enter your email for OTP verification.
5. **Manage & Update Status:** In the Admin Dashboard (`/admin`), locate the inquiry via the instant search filter (`/`), open the inquiry drawer, change the status to `In Progress`, set priority to `High`, and log an internal note.
6. **Verify Audit Trail (`/admin/activity`):** Open the Activity feed to confirm that the status change and note are immediately reflected with actor attribution, timestamp, and metadata.

---

## ?? What's New in v2

* **Home (`/`):** Redesigned editorial poster card carousel with technical grid overlays, live countdowns, Asia/Kolkata date tiles, interactive Liquid GooeyNav navigation, live aggregates counter, and FAQ accordion.
* **Public Inquiry (`/inquiry`):** Split-pane design with real-time Zod validation, invisible honeypot bot trap, and instant reference code generation.
* **Public Tracker (`/track`):** Privacy-safe public status lookup requiring both reference code and registered email, returning normalized stages without exposing PII.
* **Admin Activity Audit Feed (`/admin/activity`):** Cursor-paginated immutable audit feed of all administrative actions, status transitions, priority changes, and counselor notes.
* **Admin Settings & Security (`/admin/settings`):** Profile preferences, timing-safe password update with entropy complexity rules, instant session revocation via `token_version` invalidation (`/auth/logout-all`), and GPU background rendering toggles.
* **Unique Reference Codes:** Algorithmic `KH-XXXXXXXX` identifier generated on submission for zero-friction inquiry tracking.
* **Priority Routing & Assignment:** Native `High`, `Medium`, and `Low` priority classification with counselor assignment and related contact submission history count.
* **Related Contacts Aggregation:** Real-time lookup grouping prior submissions from the same email with historical submission count badges.
* **Automated Database Migrations:** Idempotent migration runner (`npm run db:migrate`) managing schema evolution across Supabase instances.
* **New v2 OpenAPI Endpoints:**
  * `POST /api/track` - Public inquiry status lookup
  * `GET /api/public/stats` - Public resolved/active metrics
  * `GET /api/activity` - Cursor-paginated admin audit log
  * `GET /api/admins/options` - Active counselor directory for assignment
  * `PATCH /api/inquiries/:id/priority` - Update inquiry priority
  * `PATCH /api/inquiries/:id/assign` - Assign inquiry to administrator
  * `PATCH /api/inquiries/bulk-status` - Batch status update
  * `PATCH /api/auth/password` - Timing-safe password modification
  * `POST /api/auth/logout-all` - Global session revocation
  * `POST /api/auth/otp/send` - Branded 6-digit email OTP dispatch
  * `POST /api/auth/otp/verify` - One-time password verification & session provisioning

## 📑 Table of Contents
1. [Overview & Features](#overview--features)
2. [Architecture Diagram](#architecture-diagram)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Getting Your Database Credentials (Supabase)](#getting-your-database-credentials-supabase)
6. [Generating Your JWT Secret](#generating-your-jwt-secret)
7. [Local Environment Setup](#local-environment-setup)
8. [Database Setup & Seeding](#database-setup--seeding)
9. [How to Test the Custom JWT Auth (Ready-to-Paste cURL Commands)](#how-to-test-the-custom-jwt-auth)
10. [API Reference & OpenAPI 3](#api-reference)
11. [Deployment Guide (Render & Vercel)](#deployment-guide-render--vercel)
12. [Security & Production Hardening](#security--production-hardening)
13. [Architecture Decisions (ADR)](#architecture-decisions-adr)

---

## Overview & Features

### 1. Public Inquiry Portal (`/`)
- **Split-Card Layout**: Modern dark theme with yellow accents (#FFD60A) and glassmorphism.
- **Aero Shards Background**: Interactive WebGL shader animated shards with lazy-loading and accessible fallbacks.
- **Role & Category Selection**: Inquiries from Parents, Students, and Schools across Scholarship, Concert, Admission, and General Query.
- **Bot Protection**: Invisible honeypot field rejecting automated bot spam.
- **Validation**: Full client-side & server-side validation with Zod.
- **Animated Success State**: Clean confirmation screen with one-click re-submission.

### 2. Custom Admin Auth & Security (`/admin/login`)
- **Zero Third-Party Auth Lock-in**: Custom JWT authentication written from scratch in Node.js using `bcryptjs` and `jsonwebtoken`.
- **Timing Attack Mitigation**: Employs constant-time dummy password comparison when user accounts are not found.
- **Strict Rate Limiting**: Maximum 5 login attempts per 15 minutes per IP.
- **Session Auto-Expiry & Refresh**: Tokens valid for 8 hours; automatic interceptors handle 401s and redirect to login with toasts.

### 3. Admin Management Dashboard (`/admin`)
- **Dynamic Time Greeting**: Contextual morning/afternoon/evening greeting with current formatted date.
- **Real-Time Stat Counters**: Animated count-up metrics for Total, New, In Progress, and Resolved.
- **Dual View Modes**:
  - **Data Table View**: Dense tabular view with sticky header, sortable columns, and inline status changer.
  - **Pipeline Kanban Board**: Interactive 3-column workflow board (New, In Progress, Resolved).
- **Search & Filters**: 400ms debounced search (matches name or normalized phone) and multi-select filtering with state synced in the URL query string.
- **CSV Export**: Server-side filtered export with CSV Formula Injection (`=`, `+`, `-`, `@`) mitigation.
- **Side Details Drawer**: Slide-over panel displaying comprehensive inquiry details and direct actions.

---

## Architecture Diagram

```mermaid
graph TD
    User([Public Visitor / Parent / Student / School]) -->|1. Submit Inquiry| Frontend[React + Vite Frontend<br/>Vercel]
    Admin([School Administrator]) -->|2. Admin Login & Dashboard| Frontend

    Frontend -->|3. REST API / HTTPS| Backend[Node.js + Express Backend<br/>Render]
    
    subgraph Backend Services
        AuthMW[Custom Auth Middleware<br/>JWT Verification]
        RateLimiter[Express Rate Limiter]
        Validator[Zod Schema Validators]
        SQLQuery[pg Client - Parameterized SQL]
    end

    Backend --> RateLimiter --> Validator --> AuthMW --> SQLQuery
    SQLQuery -->|Session Pooler SSL:5432| DB[(Supabase PostgreSQL<br/>admins & inquiries tables)]
```

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router v7, react-hook-form, Zod, Axios, Sonner, Lucide React, Aero Shards WebGL |
| **Backend** | Node.js (ES Modules), Express.js, `pg` (node-postgres), `bcryptjs`, `jsonwebtoken`, `zod`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv` |
| **Database** | Supabase PostgreSQL (Standard connection string using `pg`, no Supabase Auth/client) |
| **Hosting** | Vercel (Frontend), Render (Backend) |

---

## Prerequisites

- **Node.js** (v18.x, v20.x, or newer)
- **npm** (v9.x or newer)
- A free **Supabase** account (for PostgreSQL)

---

## Getting Your Database Credentials (Supabase)

This project connects to Supabase as a **standard PostgreSQL database** using the `pg` library. You do **not** need Supabase Auth or API keys. You only need the standard PostgreSQL connection string.

### Step-by-Step:
1. Log in to [Supabase](https://supabase.com/) and click **New Project**.
2. Name your project (e.g., `k12-hunar-crm`), enter a secure database password, and choose your preferred region. Click **Create new project**.
3. Once the project finishes provisioning (about 1-2 minutes):
   - In the left sidebar, click the **Settings** gear icon (⚙️) -> **Database**.
   - Scroll down to the **Connection string** section.
   - Select the **Session Pooler** or **Transaction Pooler** tab (using Port `5432`).
   - Copy the URI string. It looks like:
     ```
     postgresql://postgres.yourprojectref:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
     ```
   *(Note: On cloud platforms like Render, Supabase's direct connection is IPv6-only; the Pooler connection supports IPv4 and connects seamlessly).*
4. Replace `YOUR_PASSWORD` with the database password you created in Step 2.

---

## Generating Your JWT Secret

Your custom authentication requires a random 32+ character string to securely sign tokens:

Run this one-line command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy the generated string. You will paste it as `JWT_SECRET` in your backend `.env`.

---

## Local Environment Setup

### 1. Clone & Configure Backend
Navigate to `/backend`:
```bash
cd backend
npm install
```
Create `backend/.env` (copy from `.env.example`):
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.yourprojectref:yourpassword@aws-0-your-region.pooler.supabase.com:5432/postgres
JWT_SECRET=paste_your_48_byte_random_hex_string_here
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@k12hunar.com
ADMIN_PASSWORD=Admin@12345
```

### 2. Configure Frontend
Navigate to `/frontend`:
```bash
cd ../frontend
npm install
```
Create `frontend/.env` (copy from `.env.example`):
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## Database Setup & Seeding

Run these scripts from the `/backend` directory:

### 1. Execute SQL Schema
Creates the `admins` and `inquiries` tables and all performance and trigram indexes:
```bash
npm run db:setup
```
*(Alternatively, copy and run `backend/schema.sql` directly inside the Supabase Web SQL Editor).*

### 2. Seed Default Admin Account
Creates or updates the admin account using credentials from `ADMIN_EMAIL` and `ADMIN_PASSWORD`:
```bash
npm run seed:admin
```
- **Default Email**: `admin@k12hunar.com`
- **Default Password**: `Admin@12345`

### 3. Seed Realistic Sample Inquiries
Populates 25 realistic inquiries across all user types and categories:
```bash
npm run seed:inquiries
```

---

## Starting the Application

In terminal 1 (Backend):
```bash
cd backend
npm run dev
```

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## How to Test the Custom JWT Auth

Here are ready-to-paste `curl` commands to test the backend authentication and security:

### 1. Admin Login (Get Token)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@k12hunar.com","password":"Admin@12345"}'
```
*Expected response (200 OK):*
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "email": "admin@k12hunar.com" }
}
```

### 2. Access Inquiries with NO Token (Fails with 401)
```bash
curl -i http://localhost:5000/api/inquiries
```
*Expected response (401 Unauthorized):*
```json
{ "error": { "message": "Authentication required. Missing Bearer token." } }
```

### 3. Access Inquiries with BAD Token (Fails with 401)
```bash
curl -i http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer invalid_or_forged_token_here"
```
*Expected response (401 Unauthorized):*
```json
{ "error": { "message": "Invalid authentication token." } }
```

### 4. Access Inquiries with VALID Token (Succeeds with 200)
*(Replace `<TOKEN>` with the token from Step 1)*:
```bash
curl http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Update Status (PATCH)
```bash
curl -X PATCH http://localhost:5000/api/inquiries/<INQUIRY_UUID>/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Server health check (Render warm-up) |
| `GET` | `/api/docs` | Public | Interactive OpenAPI 3 / Swagger documentation UI |
| `POST` | `/api/inquiries` | Public (Rate Limited) | Submit an inquiry (Zod validated, honeypot protected) |
| `POST` | `/api/auth/login` | Public (5 req/15m) | Admin login (constant-time bcrypt check, returns JWT) |
| `GET` | `/api/auth/me` | Protected | Returns authenticated admin profile |
| `GET` | `/api/inquiries` | Protected | Paginated inquiries with server filters, search, and sorting |
| `GET` | `/api/inquiries/stats` | Protected | Inquiries count by status (Total, New, In Progress, Resolved) |
| `GET` | `/api/inquiries/analytics` | Protected | 30-day zero-filled volume timeseries and category distribution |
| `GET` | `/api/inquiries/export`| Protected | Export filtered inquiries as sanitized CSV |
| `GET` | `/api/inquiries/:id` | Protected | Complete inquiry details with notes and audit timeline |
| `PATCH`| `/api/inquiries/:id/status` | Protected | Update status (`New`, `In Progress`, `Resolved`) with audit log |
| `GET` | `/api/inquiries/:id/notes` | Protected | Retrieve reverse-chronological notes for an inquiry |
| `POST` | `/api/inquiries/:id/notes` | Protected | Add an internal admin note with audit trail log |

---

## Architecture Decisions (ADR)

Detailed engineering decision records are maintained in `/docs`:
- [ADR-001: Supabase Session Pooler (Port 6543)](docs/ADR/ADR-001-supabase-pooler.md)
- [ADR-002: JWT Bearer Tokens vs Cookies](docs/ADR/ADR-002-jwt-vs-cookies.md)
- [ADR-003: Timing-Safe Auth & Brute-Force Lockout](docs/ADR/ADR-003-timing-safe-auth.md)
- [ADR-004: Server-Side Filtering, Search & Window Pagination](docs/ADR/ADR-004-server-side-filtering.md)
- [ADR-005: AeroShards WebGL Background & Fallback](docs/ADR/ADR-005-webgl-background-fallback.md)
- [Database ER Diagram](docs/ER-DIAGRAM.md)
- [System Architecture & Sequence Flows](docs/ARCHITECTURE.md)
- [Production Deployment Checklist](docs/DEPLOY-CHECKLIST.md)

---

## Deployment Guide (Render & Vercel)

### Backend on Render
1. Push your repository to GitHub.
2. In Render Dashboard, click **New +** -> **Web Service**.
3. Select your repository.
4. Set settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
5. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase Session Pooler connection string.
   - `JWT_SECRET`: Your generated 32+ char secret.
   - `CLIENT_URL`: Your frontend Vercel URL (e.g. `https://your-app.vercel.app`).
   - `ADMIN_EMAIL`: `admin@k12hunar.com`
   - `ADMIN_PASSWORD`: `Admin@12345`

### Frontend on Vercel
1. In Vercel Dashboard, click **Add New...** -> **Project**.
2. Select your repository.
3. Configure settings:
   - **Root Directory**: Select `frontend`.
   - **Framework Preset**: `Vite`.
4. Add Environment Variable:
   - `VITE_API_URL`: Your Render backend URL + `/api` (e.g. `https://your-backend.onrender.com/api`).
5. Click **Deploy**.
*(The included `frontend/vercel.json` automatically handles SPA client-side routing for `/admin` and `/admin/login`).*

---

## Maintenance

### Official Program Links Health Check

To verify that all featured event URLs on the official portal (`k12hunar.com`) are active and returning HTTP 200 without downloading or parsing external page content:

```bash
cd frontend
npm run check:links
```

This utility:
- Reads typed event constants from `src/features/home/programs.ts`.
- Sends polite `HEAD` requests with a 10-second timeout and descriptive User-Agent (`K12Hunar-LinkHealthChecker/1.0`).
- Validates the 3 official event pages:
  - `bsef-2026`: `https://k12hunar.com/events/72`
  - `hrip`: `https://k12hunar.com/events/111`
  - `hsip`: `https://k12hunar.com/events/107`
- Operates under a warn-only policy (exits with code 0) and is excluded from CI and production app bundles.

---

## Security & Production Hardening

- **No Supabase Auth Used**: Pure PostgreSQL connection via `pg` library.
- **SQL Injection Defense**: 100% of database queries use parameterized `$1, $2` parameters. No raw string interpolation.
- **Timing Attack Mitigation**: When login fails on an unknown email, bcrypt still computes a hash comparison against a precomputed dummy hash to ensure constant response times.
- **CSV Formula Injection Mitigation**: Sanitizes all export cells that begin with `=, +, -, @` by prepending an apostrophe (`'`).
- **XSS & HTTP Headers**: `helmet()` sets strict CSP, HSTS, and frameguard protections.
- **CORS Protection**: Access strictly restricted to whitelisted frontend origins.
