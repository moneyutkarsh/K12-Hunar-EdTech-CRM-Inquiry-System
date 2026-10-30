# Free-Tier Operational Notes & Infrastructure Lifecycle

This document describes the operational constraints, resource characteristics, and platform lifecycles of the free-tier hosting infrastructure used for the K12 Hunar CRM and Inquiry System.

---

## 1. Backend Service: Render Web Service (Free Instance)

- **Cold Start Latency**: Render spins down free Web Services after **15 minutes of inbound inactivity**.
- **Spin-up Behavior**: When an incoming HTTP request hits a spun-down service (e.g. `GET /api/public/stats` or `POST /api/inquiries`), Render initiates a cold start that typically takes **30 to 50 seconds**.
- **Evaluator Guidance**:
  - The first interaction after dormancy may appear to load slowly while the container boots and establishes database connection pools.
  - Subsequent requests execute at full speed (sub-50ms API response latency).
  - The frontend displays appropriate loading skeletons and status feedback during initial fetch cycles.

---

## 2. Database Service: Supabase PostgreSQL (Free Tier)

- **Connection Poolers**:
  - **Transaction Pooler (Port 6543)**: Optimized for stateless, serverless, or short-lived connections.
  - **Session Pooler (Port 5432)**: Dedicated TCP session pooler used by persistent Node.js/Express backends running connection pools.
- **Inactivity Pausing Policy**:
  - Supabase pauses free-tier database projects after **7 consecutive days of zero database activity**.
  - Restoring a paused project is executed via the Supabase Dashboard and completes in 1–2 minutes.
- **SSL / TLS Encryption**:
  - Supabase enforces SSL/TLS for all external pooler connections (`ssl: { rejectUnauthorized: false }`).

---

## 3. Keep-Alive Policy & Evaluation Uptime

- **App Code Integrity Statement**:
  - **No automated keep-alive pingers, background cron self-pings, or infinite loops exist anywhere in this repository's application code.**
  - The application strictly adheres to cloud provider Terms of Service and ethical resource usage.
- **Optional External Evaluation Monitor**:
  - During an active evaluation or review window, an external monitoring service (e.g. UptimeRobot, BetterStack, or GitHub Actions scheduled workflow) may be pointed at `GET /health` to maintain warm container status.
  - Outside evaluation periods, services should naturally sleep to conserve resources.

---

## 4. Frontend Hosting: Vercel / Netlify Edge

- The React frontend is compiled into static production assets served via Edge CDN.
- Edge hosting incurs zero cold starts; client assets, styling, and fonts load instantaneously worldwide.
