# Candidate Submission Note - K12 Hunar CRM & Inquiry System

**Candidate**: Utkarsh Dubey  
**Role Applied**: Senior Full-Stack Engineer  
**Project**: K12 Hunar CRM & Inquiry System (Advanced Edition)  

---

### Highlights Summary
1. **Custom Auth & Security**: Zero third-party auth dependencies; custom bcrypt password hashing with constant-time dummy comparisons, HS256 JWT lifecycle, and a 5-attempt/15-minute sliding window account lockout.
2. **Supabase PostgreSQL Direct**: Utilized strictly as a standard relational database via Node `pg.Pool` with SSL over Session Pooler (port 6543) with parameterized queries and GIN trigram indexes.
3. **Server-Side Data Pipeline**: Full text search, multi-select filters, sorting, and pagination processed strictly in SQL using `COUNT(*) OVER()` window functions in a single round-trip.
4. **Black & Yellow Glassmorphic UI**: High-polish dark interface featuring React Bits AeroShards WebGL shader background with graceful reduced-motion fallbacks, live character counters, and responsive dual-view Table & Pipeline Board.
5. **Production Verification Suite**: 30 Vitest unit & integration tests (100% green) alongside a live production smoke script (`smoke.mjs`) verifying all user and admin flows.

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
> **Note on Free-Tier Hosting**: When the backend is deployed on Render's free tier, the service spins down after 15 minutes of inactivity. The initial wake-up request may take ~30-50 seconds. The frontend includes an automated `useWakeServer` hook that pings `/api/health` on load and displays an informative ambient notification while the service warms up.

---

### Quick Verification Commands
```bash
# 1. Run all backend unit & integration tests against PostgreSQL (30 tests)
cd backend && npm test

# 2. Run the production smoke script against the active API
cd backend && node src/scripts/smoke.mjs
```
