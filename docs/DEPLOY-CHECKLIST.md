# Production Deployment Checklist

Follow these exact steps in sequence to deploy K12 Hunar CRM to Supabase, Render, and Vercel.

---

## Step 1: Supabase PostgreSQL Setup
1. Create a new project in [Supabase](https://supabase.com). Choose the closest region (e.g., AWS Frankfurt or London).
2. Go to **Project Settings** -> **Database** -> **Connection string** -> Select **Session Pooler** (Port `6543`).
3. Copy the connection string:
   ```text
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```
   *Note: If your password contains special characters like `@` or `%`, URL-encode them (e.g., `@` becomes `%40`).*
4. Open the Supabase **SQL Editor**, paste the contents of `backend/schema.sql`, and execute it.
   *(Or run `npm run db:setup` locally with your `DATABASE_URL` in `backend/.env`).*
5. Seed initial data:
   ```bash
   cd backend
   npm run seed:admin
   npm run seed:inquiries
   ```

---

## Step 2: Deploy Backend to Render
1. In [Render](https://render.com), click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
4. Set the following **Environment Variables** in Render:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default for Render)
   - `DATABASE_URL`: `[Your Supabase Session Pooler URL on port 6543]`
   - `JWT_SECRET`: `[Minimum 32-character secret, e.g. from openssl rand -base64 32]`
   - `JWT_EXPIRES_IN`: `8h`
   - `JWT_ISSUER`: `k12-crm`
   - `JWT_AUDIENCE`: `k12-crm-admin`
   - `CLIENT_URL`: `https://[your-app-name].vercel.app` (add `http://localhost:5173` if testing locally)
   - `ADMIN_EMAIL`: `admin@k12hunar.com`
   - `ADMIN_PASSWORD`: `Admin@12345`
5. Click **Create Web Service**. Wait for the build and deployment to complete.
6. Verify deployment by visiting `https://[your-render-service].onrender.com/api/health` (should return `{ "status": "ok", "db": "up" }`).

---

## Step 3: Deploy Frontend to Vercel
1. In [Vercel](https://vercel.com), click **Add New...** -> **Project**.
2. Select your repository.
3. In **Build and Output Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Configure **Environment Variables**:
   - `VITE_API_URL`: `https://[your-render-service].onrender.com/api`
   - `VITE_SHOW_DEMO_HINT`: `true` (enables one-click demo credentials banner for evaluators)
5. Click **Deploy**.

---

## Step 4: Verify Deployment with Smoke Script
Once both frontend and backend are live, run the verification smoke script against the production endpoint:

```bash
cd backend
API_URL=https://[your-render-service].onrender.com/api \
ADMIN_EMAIL=admin@k12hunar.com \
ADMIN_PASSWORD=Admin@12345 \
node src/scripts/smoke.mjs
```

All 7 checks must report `PASS`.
