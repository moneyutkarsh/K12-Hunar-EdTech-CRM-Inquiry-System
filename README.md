# K12 Hunar CRM & Inquiry System

A full-stack, production-grade EdTech Customer Relationship Management (CRM) and Inquiry Management System built with **React, Vite, TypeScript, Tailwind CSS, shadcn/ui**, and a **Node.js/Express** backend with custom JWT authentication and **Supabase PostgreSQL** (`pg` library with parameterized queries).

---

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
10. [API Reference](#api-reference)
11. [Deployment Guide (Render & Vercel)](#deployment-guide-render--vercel)
12. [Security & Production Hardening](#security--production-hardening)

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
| `POST` | `/api/inquiries` | Public (Rate Limited) | Submit an inquiry (Zod validated, honeypot protected) |
| `POST` | `/api/auth/login` | Public (5 req/15m) | Admin login (constant-time bcrypt check, returns JWT) |
| `GET` | `/api/auth/me` | Protected | Returns authenticated admin profile |
| `GET` | `/api/inquiries` | Protected | Paginated inquiries with filters, search, and sorting |
| `GET` | `/api/inquiries/stats` | Protected | Inquiries count by status (Total, New, In Progress, Resolved) |
| `GET` | `/api/inquiries/export`| Protected | Export filtered inquiries as sanitized CSV |
| `PATCH`| `/api/inquiries/:id/status` | Protected | Update status (`New`, `In Progress`, `Resolved`) |

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

## Security & Production Hardening

- **No Supabase Auth Used**: Pure PostgreSQL connection via `pg` library.
- **SQL Injection Defense**: 100% of database queries use parameterized `$1, $2` parameters. No raw string interpolation.
- **Timing Attack Mitigation**: When login fails on an unknown email, bcrypt still computes a hash comparison against a precomputed dummy hash to ensure constant response times.
- **CSV Formula Injection Mitigation**: Sanitizes all export cells that begin with `=, +, -, @` by prepending an apostrophe (`'`).
- **XSS & HTTP Headers**: `helmet()` sets strict CSP, HSTS, and frameguard protections.
- **CORS Protection**: Access strictly restricted to whitelisted frontend origins.
