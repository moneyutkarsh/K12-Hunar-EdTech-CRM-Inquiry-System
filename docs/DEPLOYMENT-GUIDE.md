# Complete Deployment Guide: Vercel & Render

This guide provides step-by-step instructions to deploy the K12 Hunar CRM & Inquiry System to production on **Vercel** (Frontend) and **Render** (Backend API), connected to **Supabase** (PostgreSQL).

---

## 1. Prerequisites Checklist
- A GitHub repository containing this codebase.
- A **Supabase** account with an active PostgreSQL database (obtain your Connection String).
- A **Render** account (for backend hosting).
- A **Vercel** account (for frontend hosting).

---

## 2. Deploying Backend on Render

### Step 2.1: Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Fill in the service configuration:
   - **Name**: `k12-hunar-crm-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/scripts/migrate.js && node src/server.js`
   - **Instance Type**: `Free`

### Step 2.2: Set Environment Variables on Render
Under **Environment Variables**, add the following:

| Key | Example Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Production mode |
| `DATABASE_URL` | `postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require` | Supabase pooler connection string |
| `JWT_SECRET` | `min_32_characters_random_secure_jwt_secret_key_123` | Secret for signing admin JWTs |
| `CLIENT_URL` | `*` (or your Vercel URL: `https://your-app.vercel.app`) | Allowed CORS origin |
| `ADMIN_EMAIL` | `admin@k12hunar.com` | Initial administrator email |
| `ADMIN_PASSWORD` | `Admin@12345` | Initial administrator password |

*(Optional for email OTP)*:
| `SMTP_USER` | `your-email@gmail.com` | Gmail/SMTP user |
| `SMTP_PASS` | `your-16-char-app-password` | Gmail App Password |
| `SMTP_FROM` | `k12hunar@gmail.com` | Sender address |

5. Click **Create Web Service**.
6. Once deployed, copy your Render URL (e.g., `https://k12-hunar-crm-backend.onrender.com`).
7. Verify by opening `https://your-backend.onrender.com/api/health` in your browser. It should return:
   `{"status":"ok","db":"connected"}`.

---

## 3. Deploying Frontend on Vercel

### Step 3.1: Import Project to Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Select your GitHub repository.

### Step 3.2: Configure Project Settings
- **Framework Preset**: `Vite`
- **Root Directory**: Click `Edit` and select `frontend` (or leave as root; both are supported via root `vercel.json` and `frontend/vercel.json`).
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3.3: Set Environment Variables on Vercel
Under **Environment Variables**, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://your-backend.onrender.com/api` | Your live Render backend API URL |
| `VITE_SHOW_DEMO_HINT` | `true` | Enables evaluator 1-click credentials on login page |

4. Click **Deploy**.
5. Once deployment completes, your application is live at `https://[your-project].vercel.app`!

---

## 4. Post-Deployment Verification
1. Visit your Vercel URL.
2. Submit a test inquiry on `/inquiry` and copy the reference code (e.g. `HUNAR-2026-XXXXXX`).
3. Open `/track`, enter the reference code and email to verify public tracking.
4. Open `/admin/login`, log in with `admin@k12hunar.com` / `Admin@12345`.
5. Update inquiry status and verify changes appear in `/admin/activity`.
