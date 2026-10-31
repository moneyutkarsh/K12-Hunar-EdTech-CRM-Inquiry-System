<div align="center">

# K12 Hunar CRM & Inquiry System

**A full-stack EdTech inquiry platform. Visitors submit and track inquiries, and the K12 Hunar team triages them from a secure admin dashboard.**

![License: MIT](https://img.shields.io/badge/License-MIT-FFD60A.svg)
![Node 20+](https://img.shields.io/badge/Node-20%2B-339933.svg?logo=node.js&logoColor=white)
![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-API-000000.svg?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E.svg?logo=supabase&logoColor=white)

[Live Demo](#evaluator-quick-path) · [API Docs](#api-reference) · [Architecture](#architecture) · [Getting Started](#getting-started) · [Deployment](#deployment)

</div>

---

## Table of Contents

1. [Evaluator Quick Path](#evaluator-quick-path)
2. [Assessment Requirements Checklist](#assessment-requirements-checklist)
3. [Screenshots](#screenshots)
4. [Overview](#overview)
5. [Features](#features)
6. [Tech Stack](#tech-stack)
7. [Architecture](#architecture)
8. [Workflows](#workflows)
9. [Project Structure](#project-structure)
10. [Getting Started](#getting-started)
11. [Configuration](#configuration)
12. [Testing](#testing)
13. [API Reference](#api-reference)
14. [Keyboard Shortcuts](#keyboard-shortcuts)
15. [Security](#security)
16. [Performance and Accessibility](#performance-and-accessibility)
17. [Deployment](#deployment)
18. [Troubleshooting](#troubleshooting)
19. [Maintenance](#maintenance)
20. [Architecture Decision Records](#architecture-decision-records)
21. [Roadmap](#roadmap)
22. [Credits and Attributions](#credits-and-attributions)
23. [License](#license)
24. [Author](#author)

---

## Evaluator Quick Path

| Resource | Link or credential |
| :--- | :--- |
| **Live frontend** | https://k12-hunar-crm.vercel.app *(local: http://localhost:5173)* |
| **Live API** | https://k12-hunar-crm.onrender.com/api *(local: http://localhost:5000/api)* |
| **Interactive API docs (OpenAPI 3)** | https://k12-hunar-crm.onrender.com/api/docs *(local: `/api/docs`)* |
| **Evaluator admin account** | Email: `admin@k12hunar.com` · Password: `Admin@12345` |

> [!NOTE]
> **Cold start:** the backend runs on a free hosting tier that sleeps after inactivity. The first request can take up to about a minute. The frontend shows a "waking up the server" banner and continues automatically once the API responds.

> [!WARNING]
> The evaluator account exists only for review. For any real deployment, change the password in **Admin → Settings → Security** and use your own `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

### Six-step walkthrough (about 90 seconds)

1. **Submit an inquiry** at `/inquiry`. Choose a user type and a category, fill in your details, and submit.
2. **Copy the reference code** shown on the success screen (format `KH-XXXXXXXX`).
3. **Track it** at `/track` using the reference code and the email you entered. You get the current status and a sanitized timeline, with no personal data exposed.
4. **Sign in** at `/admin/login` with the evaluator account above.
5. **Manage the inquiry** in `/admin`: find it with search (press `/`), open the drawer, change the status to *In Progress*, set the priority, assign it, and add an internal note.
6. **Verify the audit trail** at `/admin/activity`. Every change appears with the actor, the action and a timestamp.

---

## Assessment Requirements Checklist

| Requirement | Implementation |
| :--- | :--- |
| Public inquiry form with User Type, Category, Name, Email, Phone, Message | `/inquiry`, validated with Zod on the client **and** the server |
| Saves directly to Supabase PostgreSQL | Backend writes through `pg.Pool` using parameterized SQL |
| Supabase used only as a database (no Supabase Auth) | Standard connection string, no `supabase-js`, no Supabase Auth |
| Custom JWT authentication written from scratch | `bcryptjs` hashing, `jsonwebtoken` signing, custom auth middleware |
| Protected admin dashboard | `/admin` requires a valid token; invalid or revoked tokens return `401` |
| Table with Name, Phone, Email, User Type, Category, Date, Status | Admin dashboard table view |
| Filters by Category and User Type, search by Name or Phone | Server-side SQL filtering, debounced search, state kept in the URL |
| `schema.sql` | [`backend/schema.sql`](backend/schema.sql) (plus idempotent `npm run db:migrate`) |
| `.env.example` | [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example) |
| README with setup and JWT testing | This file: [Getting Started](#getting-started) and [Testing](#testing) |
| Live demo link | See [Evaluator Quick Path](#evaluator-quick-path) |

---

## Screenshots

> Place these images in `docs/screenshots/readme/` (compressed, under about 200 KB each). Remove this section if you prefer not to show images.

| Home | Inquiry form |
| :---: | :---: |
| ![Home page](Home.png) | ![Inquiry form](Inquiry.png) |

| Admin dashboard | Pipeline board |
| :---: | :---: |
| ![Admin dashboard](dashboard.png) | ![Pipeline board](board.png) 

| Public tracker | 
| :---: | :---: |
| ![Tracker](docs/screenshots/readme/tracker.png)

---

## Overview

K12 Hunar receives questions from **parents, students and schools** about scholarships, admissions, concerts and general topics. This project gives those visitors one clean place to ask, and gives the team one place to manage everything.

**For visitors**
- Ask a question in under two minutes with no account.
- Receive a **reference code** and check progress later on a privacy-safe tracker page.

**For the admin team**
- See every inquiry in a table or a Kanban pipeline.
- Narrow the list with server-side filters and search.
- Prioritize, assign, annotate and resolve inquiries, with a full audit trail.
- Spot repeat contacts and inquiries that have waited too long.

The backend is a layered Express API with custom JWT authentication. The database is Supabase PostgreSQL used as plain Postgres through the `pg` driver. The frontend is a React single-page app with a black and gold design system.

---

## Features

### Public experience

| Area | Highlights |
| :--- | :--- |
| **Home (`/`)** | Landing page with an animated hero, services, "who it's for", how it works, live aggregate stats (hidden if the API is unavailable), an FAQ with structured data, and a Featured Programs carousel. Program cards open the official `k12hunar.com` event pages in a new tab and can also start an inquiry with the program prefilled. |
| **Inquiry form (`/inquiry`)** | User type and category pickers, live validation, honeypot spam trap, duplicate-submission protection, optional prefill from `?category=`, `?userType=` and `?topic=`, and a success screen with a copyable reference code. |
| **Tracker (`/track`)** | Look up an inquiry with its reference code **and** the submitter's email. Returns only the status and a sanitized timeline. No message, phone, notes or admin identities are ever returned. Rate limited. |

### Admin dashboard

| Area | Highlights |
| :--- | :--- |
| **Overview** | Time-aware greeting, stat cards (Total, New, In Progress, Resolved) with count-up numbers, deltas and sparklines, click-to-filter, a "needs attention" strip, and KPI tiles (today's inquiries, average first response, resolution rate, busiest category). |
| **Analytics** | Daily trajectory chart with 7, 30 and 90 day ranges and an optional previous-period comparison, plus a category donut that filters when clicked. |
| **Table view** | Sticky header, sortable columns, inline status changes, server-side pagination, URL-synced filters, and CSV export of the filtered result. |
| **Pipeline board** | Three-column Kanban (New, In Progress, Resolved) with drag and drop and a keyboard-accessible "Move" fallback. |
| **Filters and search** | Category, user type and status filters, plus a debounced search across name and normalized phone number. All filtering runs in SQL on the server. |
| **Inquiry drawer** | Full details, status, priority, assignee, internal notes, activity timeline, related inquiries from the same contact, and previous/next navigation. |
| **Priority and assignment** | Priority levels (Low, Normal, High, Urgent) and assignment to any active admin. A repeat-contact badge flags people who have written more than once. |
| **Activity feed (`/admin/activity`)** | Cursor-paginated audit log of status changes, priority changes, assignments and notes, with filter chips and click-through to the inquiry. |
| **Settings (`/admin/settings`)** | Profile, password change with a live complexity checklist, **sign out of all devices** (instant session revocation), and UI preferences including background effects. |
| **Productivity** | Command palette (`Ctrl/Cmd + K`), keyboard shortcuts, quick views with live counts, and polling that notifies you when new inquiries arrive. |

### Design and experience

- **Black and gold design system**: obsidian `#050505` base, brand yellow `#FFD60A`, glass surfaces, and semantic colors for statuses and categories.
- **Three route-scoped WebGL backgrounds**: Ghost Fibers (Home), Aero Shards (public form, tracker, login), Grid Scan (admin area). Each has a lightweight CSS fallback.
- **Typography**: Space Grotesk for headings and metrics, Inter for interface text, with tabular numerals for data.
- **Respect for user settings**: reduced motion, small screens, low-power devices and data-saver mode automatically switch to the CSS fallback.

---

## Tech Stack

| Layer | Technology | Why it is used |
| :--- | :--- | :--- |
| **Frontend framework** | React 19, TypeScript (strict) | Typed components and predictable rendering |
| **Build tool** | Vite | Fast development server and optimized production builds |
| **Styling** | Tailwind CSS v4, shadcn/ui (Radix primitives) | Design tokens, accessible headless components |
| **Routing** | React Router v7 | Client routing and URL-based filter state |
| **Forms and validation** | React Hook Form, Zod | Low re-render forms with shared schema style on client and server |
| **HTTP** | Axios | Interceptors for the Bearer token and 401 handling |
| **State** | React Context and URL query parameters | Small, dependency-light state model |
| **Charts and drag and drop** | Recharts, `@dnd-kit` | Analytics charts and the Kanban board |
| **Motion and feedback** | Framer Motion, Sonner, Lucide | Animation, toasts and a consistent icon set |
| **Visual effects** | WebGL2 shaders, adapted React Bits components | Branded backgrounds with fallbacks |
| **Backend** | Node.js 20+, Express (ES modules) | Layered REST API |
| **Database driver** | `pg` (node-postgres) | Parameterized queries, connection pooling |
| **Authentication** | `bcryptjs`, `jsonwebtoken` | Custom JWT authentication, no third-party auth |
| **Validation and security** | Zod, helmet, cors, express-rate-limit | Input validation, headers, CORS allow-list, throttling |
| **Logging and docs** | morgan, Swagger UI (OpenAPI 3) | Request logs and interactive API documentation |
| **Database** | Supabase PostgreSQL (session pooler) | Managed Postgres used purely as a database |
| **Testing** | Vitest (unit and integration), smoke script | Fast tests for logic, API and deployment checks |
| **CI and hosting** | GitHub Actions, Vercel (frontend), Render (backend) | Automated checks and deployment |

---

## Architecture

### System overview

```mermaid
flowchart LR
    subgraph Clients
        V["Visitor<br/>(Parent / Student / School)"]
        A["Admin<br/>(K12 Hunar team)"]
    end

    subgraph Vercel["Vercel"]
        FE["React + Vite SPA"]
    end

    subgraph Render["Render (Node 20+)"]
        API["Express API"]
    end

    subgraph Supabase["Supabase"]
        DB[("PostgreSQL<br/>session pooler")]
    end

    V --> FE
    A --> FE
    FE -- "HTTPS / JSON<br/>Bearer JWT on admin routes" --> API
    API -- "pg.Pool, SSL<br/>parameterized SQL" --> DB
```

### Backend layers

```mermaid
flowchart TB
    subgraph MW["Middleware layer"]
        direction LR
        M1["helmet + CORS allow-list"]
        M2["Rate limiters"]
        M3["Zod validators"]
        M4["JWT auth middleware"]
    end
    R["Routes"] --> C["Controllers"]
    C --> S["Services"]
    S --> Q["Repositories<br/>(parameterized SQL)"]
    Q --> D[("PostgreSQL")]
    MW --> R
```

Routes stay thin, controllers translate HTTP to service calls, services hold business rules, and repositories are the only place SQL lives.

### Frontend routes and backgrounds

| Route | Page | Access | Background |
| :--- | :--- | :--- | :--- |
| `/` | Home | Public | Ghost Fibers |
| `/inquiry` | Inquiry form | Public | Aero Shards |
| `/track` | Inquiry tracker | Public | Aero Shards |
| `/admin/login` | Admin login | Public | Aero Shards |
| `/admin` | Dashboard (table and board) | Admin | Grid Scan |
| `/admin/activity` | Activity feed | Admin | Grid Scan |
| `/admin/settings` | Settings and security | Admin | Grid Scan |

Only one WebGL background is mounted at a time, and each loads in its own lazy chunk.

### Data model

```mermaid
erDiagram
    ADMINS ||--o{ INQUIRIES : "assigned to"
    ADMINS ||--o{ INQUIRY_NOTES : writes
    ADMINS ||--o{ ACTIVITY_LOG : performs
    INQUIRIES ||--o{ INQUIRY_NOTES : has
    INQUIRIES ||--o{ ACTIVITY_LOG : records

    ADMINS {
        uuid id PK
        text email UK
        text name
        text password_hash
        text role
        int token_version
        timestamptz created_at
    }

    INQUIRIES {
        uuid id PK
        text reference_code UK
        text user_type
        text category
        text name
        text email
        text phone
        text message
        text status
        text priority
        uuid assigned_to FK
        timestamptz created_at
        timestamptz updated_at
    }

    INQUIRY_NOTES {
        uuid id PK
        uuid inquiry_id FK
        uuid admin_id FK
        text note
        timestamptz created_at
    }

    ACTIVITY_LOG {
        uuid id PK
        uuid inquiry_id FK
        uuid admin_id FK
        text action
        text from_value
        text to_value
        timestamptz created_at
    }
```

Allowed values are enforced with database `CHECK` constraints and mirrored in Zod schemas:

| Field | Values |
| :--- | :--- |
| `user_type` | Parent, Student, School |
| `category` | Scholarship, Concert, Admission, General Query |
| `status` | New, In Progress, Resolved |
| `priority` | Low, Normal, High, Urgent |

Indexes support the common queries: date ordering, category, user type, status, trigram name search, and phone lookup. See [`docs/ER-DIAGRAM.md`](docs/ER-DIAGRAM.md) for the full definition.

---

## Workflows

### Inquiry lifecycle

```mermaid
stateDiagram-v2
    state "In Progress" as InProgress
    [*] --> New: Visitor submits an inquiry
    New --> InProgress: Admin picks it up
    InProgress --> Resolved: Admin resolves it
    New --> Resolved: Quick resolution
    Resolved --> InProgress: Reopened
    Resolved --> [*]
```

Admins can move an inquiry between statuses from the table, the board or the drawer. Every change is written to the audit log with the actor and a timestamp.

### Visitor flow: submit and track

```mermaid
sequenceDiagram
    actor V as Visitor
    participant FE as React SPA
    participant API as Express API
    participant DB as PostgreSQL

    V->>FE: Fill in the inquiry form
    FE->>FE: Zod validation (client)
    FE->>API: POST /api/inquiries
    API->>API: Rate limit, honeypot check, Zod validation
    API->>DB: INSERT inquiry (parameterized)
    DB-->>API: id and reference_code
    API-->>FE: 201 with referenceCode
    FE-->>V: Success screen with KH-XXXXXXXX

    V->>FE: Open /track, enter code and email
    FE->>API: POST /api/track
    API->>DB: Match reference_code AND lower(email)
    DB-->>API: Matching row or nothing
    API-->>FE: Sanitized status and timeline (generic 404 if no match)
```

### Admin authentication and session flow

```mermaid
sequenceDiagram
    actor A as Admin
    participant FE as React SPA
    participant API as Express API
    participant DB as PostgreSQL

    A->>FE: Email and password
    FE->>API: POST /api/auth/login
    API->>DB: SELECT admin by lower(email)
    API->>API: bcrypt.compare (dummy hash if the user does not exist)
    API-->>FE: 200 with JWT (8h, includes token version)

    FE->>API: GET /api/inquiries with Bearer token
    API->>API: Verify signature and expiry
    API->>DB: Compare token version with admins.token_version
    API-->>FE: 200 data

    Note over FE,API: Password change or "sign out everywhere" increments token_version.<br/>Older tokens then receive 401 and the client returns to login.
```

### Admin triage routine

```mermaid
flowchart LR
    A["Open dashboard"] --> B["Review stats and<br/>needs-attention strip"]
    B --> C["Filter or search"]
    C --> D["Open inquiry drawer"]
    D --> E["Set priority and assignee"]
    E --> F["Add notes, move to<br/>In Progress"]
    F --> G["Resolve"]
    G --> H["Visible in<br/>Activity feed"]
```

---

## Project Structure

Abridged view of the repository:

```text
k12-hunar-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # env validation, pg pool, logger
│   │   ├── middleware/      # auth, validation, rate limiters, errors
│   │   ├── routes/          # route definitions
│   │   ├── controllers/     # HTTP layer
│   │   ├── services/        # business rules
│   │   ├── repositories/    # parameterized SQL
│   │   ├── validators/      # Zod schemas
│   │   ├── utils/           # helpers (phone, CSV, pagination)
│   │   ├── scripts/         # db setup, migrate, seeds, smoke test
│   │   ├── docs/            # OpenAPI document
│   │   ├── app.js           # builds the Express app
│   │   └── server.js        # starts the server
│   ├── tests/               # unit and integration tests
│   ├── schema.sql
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/             # router, providers, route guards
│   │   ├── features/        # home, inquiry form, tracker, auth, dashboard, activity, settings
│   │   ├── components/      # ui primitives, layout, backgrounds
│   │   ├── lib/             # API client, formatting helpers
│   │   ├── hooks/           # shared hooks
│   │   └── styles/          # design tokens
│   ├── vercel.json          # SPA rewrite
│   └── .env.example
├── docs/                    # ADRs, architecture, ER diagram, deployment checklist
├── .github/workflows/       # CI
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js 20 or newer** and **npm 9 or newer**
- A free **Supabase** account (used only as PostgreSQL)
- **Git**

### 1. Clone and install

```bash
git clone https://github.com/utkarshdubey/k12-hunar-crm.git
cd k12-hunar-crm

cd backend && npm install
cd ../frontend && npm install
```

### 2. Get your database connection string (Supabase)

This project uses Supabase **only as a PostgreSQL database** through `pg`. You do not need Supabase Auth or API keys.

1. Create a project at [supabase.com](https://supabase.com/) and set a database password.
2. Wait for provisioning (about a minute or two).
3. Open **Project Settings → Database → Connection string** and choose the **Session pooler** tab (port `5432`).
4. Copy the URI and replace `YOUR_PASSWORD` with your database password.

```text
postgresql://postgres.<project-ref>:YOUR_PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
```

> [!TIP]
> Use the **pooler** string, especially on Render. The direct database host is IPv6-only and often fails from hosting platforms. If your password contains special characters, URL-encode them (for example `@` becomes `%40`).

### 3. Generate a JWT secret

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 4. Configure environment variables

Create `backend/.env` from `backend/.env.example`:

```ini
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres.<project-ref>:YOUR_PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
JWT_SECRET=paste_your_generated_secret_here
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173
ADMIN_EMAIL=admin@k12hunar.com
ADMIN_PASSWORD=Admin@12345
```

Create `frontend/.env` from `frontend/.env.example`:

```ini
VITE_API_URL=http://localhost:5000/api
```

### 5. Prepare the database

Run these from `backend/`, in this order. All scripts are safe to run more than once.

```bash
npm run db:setup        # create tables, constraints and indexes from schema.sql
npm run db:migrate      # apply idempotent v2 additions (reference codes, priority, assignment, token versions)
npm run seed:admin      # create or update the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run seed:inquiries  # optional: add realistic sample inquiries
```

Alternatively, paste `backend/schema.sql` into the Supabase **SQL Editor**, then run `db:migrate` and `seed:admin`.

To create an additional admin for testing assignment:

```bash
npm run seed:admin -- --email priya@example.com --password "Str0ng!Pass" --name "Priya Sharma"
```

### 6. Run the app

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173. Swagger docs are at http://localhost:5000/api/docs.

### 7. Verify your setup

Run these quick checks to confirm everything is connected:

```bash
curl http://localhost:5000/api/health
```

The response should report a healthy status. Then check the app in the browser:

| Check | Where | Expected |
| :--- | :--- | :--- |
| Home page loads | http://localhost:5173 | Hero, services and programs carousel render with no console errors |
| Public form saves data | `/inquiry` | Success screen with a `KH-XXXXXXXX` reference code |
| Admin login works | `/admin/login` | Redirects to `/admin` and shows inquiries (use the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you seeded) |
| API docs load | http://localhost:5000/api/docs | Swagger UI lists the endpoints |

If a check fails, see [Troubleshooting](#troubleshooting).

> [!TIP]
> **Windows users:** run the shell snippets in this README in **Git Bash** or **WSL**. In PowerShell, use `curl.exe` instead of `curl` (PowerShell's `curl` is an alias for a different command) and set environment variables with `$env:NAME="value"`.

### Command reference

| Location | Command | Purpose |
| :--- | :--- | :--- |
| `backend` | `npm run dev` | Start the API in development mode |
| `backend` | `npm start` | Start the API for production |
| `backend` | `npm test` | Run backend unit and integration tests |
| `backend` | `npm run db:setup` | Apply `schema.sql` |
| `backend` | `npm run db:migrate` | Apply idempotent schema additions |
| `backend` | `npm run seed:admin` | Create or update an admin (`--email`, `--password`, `--name`) |
| `backend` | `npm run seed:inquiries` | Insert sample inquiries |
| `frontend` | `npm run dev` | Start the Vite development server |
| `frontend` | `npm run build` | Typecheck and build for production |
| `frontend` | `npm test` | Run frontend tests |
| `frontend` | `npm run check:links` | Check the official program links (warn only) |

---

## Configuration

### Backend (`backend/.env`)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `PORT` | No | API port (default `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | Supabase **session pooler** connection string |
| `JWT_SECRET` | Yes | Random secret of at least 32 characters |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `8h`) |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS, with no trailing slash. Separate several origins with commas. |
| `ADMIN_EMAIL` | For seeding | Email used by `npm run seed:admin` |
| `ADMIN_PASSWORD` | For seeding | Password used by `npm run seed:admin` |

Any additional optional variables, such as email delivery settings, are documented in `backend/.env.example`.

### Frontend (`frontend/.env`)

| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_API_URL` | Yes | API base URL including `/api`. Vite reads it **at build time**, so redeploy after changing it. |

---

## Testing

### Automated tests

```bash
cd backend && npm test        # unit and integration tests
cd frontend && npm test       # frontend unit tests
cd frontend && npm run build  # typecheck and production build
```

### Deployment smoke test

Runs a short end-to-end check against any running API (local or deployed) and prints PASS or FAIL per step:

```bash
API_URL=https://k12-hunar-crm.onrender.com/api \
ADMIN_EMAIL=admin@k12hunar.com \
ADMIN_PASSWORD=Admin@12345 \
node backend/src/scripts/smoke.mjs
```

On Windows PowerShell:

```powershell
$env:API_URL="https://k12-hunar-crm.onrender.com/api"
$env:ADMIN_EMAIL="admin@k12hunar.com"
$env:ADMIN_PASSWORD="Admin@12345"
node backend/src/scripts/smoke.mjs
```

### Testing the custom JWT authentication

<details>
<summary><strong>Ready-to-paste cURL commands</strong> (click to expand)</summary>

Replace `http://localhost:5000` with the live API origin if testing the deployment.

**1. Log in and get a token (200)**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@k12hunar.com","password":"Admin@12345"}'
```

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "id": "...", "email": "admin@k12hunar.com" }
}
```

**2. Protected route with no token (401)**

```bash
curl -i http://localhost:5000/api/inquiries
```

```json
{ "error": { "message": "Authentication required. Missing Bearer token." } }
```

**3. Protected route with a forged token (401)**

```bash
curl -i http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer invalid_or_forged_token_here"
```

```json
{ "error": { "message": "Invalid authentication token." } }
```

**4. Protected route with a valid token (200)**

```bash
curl http://localhost:5000/api/inquiries \
  -H "Authorization: Bearer <TOKEN>"
```

**5. Filter, search and paginate on the server**

```bash
curl "http://localhost:5000/api/inquiries?category=Scholarship&userType=Parent&search=98&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

**6. Update a status**

```bash
curl -X PATCH http://localhost:5000/api/inquiries/<INQUIRY_UUID>/status \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'
```

**7. Public tracker (reference code and email must both match)**

```bash
curl -X POST http://localhost:5000/api/track \
  -H "Content-Type: application/json" \
  -d '{"reference":"KH-XXXXXXXX","email":"visitor@example.com"}'
```

**8. Session revocation: a token stops working after "sign out everywhere"**

```bash
# Revoke all sessions for this admin
curl -X POST http://localhost:5000/api/auth/logout-all \
  -H "Authorization: Bearer <TOKEN>"

# The same token is now rejected (401)
curl -i http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

</details>

### Verifying the security controls

<details>
<summary><strong>Hands-on checks for spam protection, duplicates, CSV safety and rate limits</strong> (click to expand)</summary>

Set these variables once (`jq` reads the token; without it, copy the token from the login response by hand):

```bash
API=http://localhost:5000/api
TOKEN=$(curl -s -X POST $API/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@k12hunar.com","password":"Admin@12345"}' | jq -r .token)
```

**Honeypot.** A bot that fills the hidden `website` field gets a normal-looking `201`, but nothing is stored. The total should not change:

```bash
curl -s $API/inquiries/stats -H "Authorization: Bearer $TOKEN" | jq '.total'   # note the number

curl -i -X POST $API/inquiries -H "Content-Type: application/json" -d '{
  "userType":"Parent","category":"Scholarship","name":"Bot Test",
  "email":"bot@example.com","phone":"+919876543210",
  "message":"This submission should be silently discarded.",
  "website":"i-am-a-bot"}'

curl -s $API/inquiries/stats -H "Authorization: Bearer $TOKEN" | jq '.total'   # same number
```

**Duplicate protection.** Sending the same inquiry twice within 10 minutes returns `201` the first time and `200` with the existing record the second time:

```bash
BODY='{"userType":"Student","category":"Admission","name":"Aarav Sharma","email":"aarav.sharma@example.com","phone":"+919876543210","message":"Please share the admission process and key dates."}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/inquiries -H "Content-Type: application/json" -d "$BODY"
curl -s -o /dev/null -w "%{http_code}\n" -X POST $API/inquiries -H "Content-Type: application/json" -d "$BODY"
```

**CSV formula injection.** Submit a name that starts with `=`, export, and confirm the cell is prefixed with a single quote:

```bash
curl -s -o /dev/null -X POST $API/inquiries -H "Content-Type: application/json" -d '{
  "userType":"Parent","category":"General Query","name":"=SUM(1+1)",
  "email":"csv@example.com","phone":"+919876543211",
  "message":"Checking that spreadsheet formulas are neutralized."}'

curl -s "$API/inquiries/export" -H "Authorization: Bearer $TOKEN" | grep "SUM(1+1)"
# the cell should begin with a single quote: '=SUM(1+1)
```

**Tracker privacy and rate limit.** An unknown lookup returns a generic `404`. The tracker allows 10 requests per 15 minutes per IP, so the later requests below should return `429`:

```bash
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code} " -X POST $API/track \
    -H "Content-Type: application/json" \
    -d '{"reference":"KH-AAAAAAAA","email":"nobody@example.com"}'
done; echo
```

**Login lockout.** After 5 failed attempts the API answers `429`. Test it with a made-up email such as `nobody@example.com` so the real admin is not locked out:

```bash
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "%{http_code} " -X POST $API/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@example.com","password":"wrong-password"}'
done; echo
```

> [!WARNING]
> The rate-limit and lockout tests restrict your own IP or email for about 15 minutes. Do not run them right before a demo or a submission check. Restarting a local backend resets in-memory rate limiters.

</details>

### Reproducing the query plan

<details>
<summary><strong>See the indexes at work</strong> (click to expand)</summary>

Open the Supabase **SQL Editor** and run:

```sql
EXPLAIN ANALYZE
SELECT id, name, category, status, created_at, COUNT(*) OVER()
FROM inquiries
WHERE category = 'Scholarship' AND lower(name) % 'priya'
ORDER BY created_at DESC
LIMIT 10;
```

Look for a **Bitmap Index Scan on `idx_inquiries_name_trgm`** and a single query that returns both the rows and the total count (`COUNT(*) OVER()`), which avoids a separate count query.

On a small table PostgreSQL may choose a sequential scan because it is cheaper. To see the index plan anyway, force it for the session:

```sql
SET enable_seqscan = off;
EXPLAIN ANALYZE
SELECT id, name, category, status, created_at, COUNT(*) OVER()
FROM inquiries
WHERE category = 'Scholarship' AND lower(name) % 'priya'
ORDER BY created_at DESC
LIMIT 10;
RESET enable_seqscan;
```

Treat the timings as a demonstration on your own data, not as a benchmark.

</details>

### Pre-submission checklist

Run this against the **deployed** site, in a private browser window and on a phone:

- [ ] `GET /api/health` responds, and `/api/docs` loads
- [ ] Home page loads with no console or CORS errors
- [ ] A new inquiry submits and shows a reference code
- [ ] The code and email work on `/track`
- [ ] The evaluator account signs in at `/admin/login`
- [ ] Category filter, user type filter and search work, and refreshing `/admin` does not return a 404
- [ ] A status change appears in `/admin/activity`
- [ ] Unauthenticated `GET /api/inquiries` returns `401`
- [ ] `backend/schema.sql`, both `.env.example` files and this README are in the repository
- [ ] No `.env` file or secret is committed (`git ls-files | grep -i "\.env"` lists only `.env.example` files)

---

## API Reference

Full interactive documentation is served at `/api/docs` (Swagger UI, OpenAPI 3). Protected routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | Health check, also used to wake the server |
| `GET` | `/api/docs` | Public | Interactive OpenAPI documentation |
| `GET` | `/api/public/stats` | Public (rate limited, cached) | Aggregate figures for the Home page, no personal data |
| `POST` | `/api/inquiries` | Public (rate limited) | Submit an inquiry (Zod validated, honeypot protected) |
| `POST` | `/api/track` | Public (rate limited) | Look up status by reference code and email |
| `POST` | `/api/auth/login` | Public (5 attempts per 15 minutes) | Admin login, returns a JWT |
| `POST` | `/api/auth/otp/send` | Public (rate limited) | Send an email one-time code, available when email delivery is configured |
| `POST` | `/api/auth/otp/verify` | Public (rate limited) | Verify the one-time code and start a session |
| `GET` | `/api/auth/me` | Admin | Current admin profile |
| `PATCH` | `/api/auth/password` | Admin | Change password, revokes other sessions |
| `POST` | `/api/auth/logout-all` | Admin | Revoke all sessions for the current admin |
| `GET` | `/api/admins/options` | Admin | Active admins available for assignment |
| `GET` | `/api/inquiries` | Admin | List with filters, search, sorting and pagination |
| `GET` | `/api/inquiries/stats` | Admin | Totals and counts by status |
| `GET` | `/api/inquiries/analytics` | Admin | Time series and category distribution |
| `GET` | `/api/inquiries/export` | Admin | CSV export of the filtered list |
| `GET` | `/api/inquiries/:id` | Admin | Full inquiry with notes, timeline and related inquiries |
| `PATCH` | `/api/inquiries/:id/status` | Admin | Update status (audit logged) |
| `PATCH` | `/api/inquiries/:id/priority` | Admin | Update priority |
| `PATCH` | `/api/inquiries/:id/assign` | Admin | Assign or unassign an admin |
| `PATCH` | `/api/inquiries/bulk-status` | Admin | Update the status of several inquiries |
| `GET` | `/api/inquiries/:id/notes` | Admin | List internal notes |
| `POST` | `/api/inquiries/:id/notes` | Admin | Add an internal note |
| `GET` | `/api/activity` | Admin | Cursor-paginated audit feed |

**Common query parameters for `GET /api/inquiries`:** `page`, `limit`, `category`, `userType`, `status`, `search`, `sort`, `order`.

Errors use one consistent shape:

```json
{ "error": { "message": "Human-readable description" } }
```

---

## Keyboard Shortcuts

| Shortcut | Scope | Action |
| :--- | :--- | :--- |
| `Ctrl / Cmd + K` | Admin | Open the command palette |
| `?` | Admin | Show the shortcuts cheat sheet |
| `/` | Dashboard | Focus the search box |
| `T` | Admin | Switch to table view |
| `B` | Admin | Switch to pipeline board |
| `Esc` | Admin | Close the drawer, palette or dialog |
| `Ctrl + Enter` | Drawer | Save the internal note |
| `[` and `]` | Drawer | Previous and next inquiry |

---

## Security

| Area | Implementation |
| :--- | :--- |
| **Authentication** | Custom JWT flow with `bcryptjs` hashing and `jsonwebtoken` signing. No Supabase Auth. Admins are provisioned with the seed script. |
| **Timing attacks** | When an email is unknown, login still runs a bcrypt comparison against a dummy hash so response times do not reveal which accounts exist. |
| **Brute force** | Login is limited to 5 attempts per 15 minutes per IP. The tracker and public form have their own limits. |
| **Session revocation** | Tokens carry a version. Changing a password or choosing "sign out everywhere" increments `token_version`, which invalidates older tokens immediately. |
| **Password policy** | Minimum length with upper case, lower case, number and symbol requirements. |
| **SQL injection** | Every query uses parameterized placeholders. Sort columns come from whitelists. |
| **Input validation** | Zod schemas on the client and the server, plus database `CHECK` constraints. |
| **Spam protection** | Hidden honeypot field and duplicate-submission detection on the public form. |
| **Privacy** | The tracker needs both the reference code and the email, answers unknown lookups with the same generic 404, and returns only status information. |
| **CSV exports** | Cells starting with `=`, `+`, `-` or `@` are neutralized to prevent formula injection. |
| **HTTP hardening** | `helmet` security headers and a CORS allow-list restricted to `CLIENT_URL`. |
| **Secrets** | Environment variables only. `.env` files are git-ignored and only `.env.example` is committed. |
| **Privacy of visual effects** | The WebGL backgrounds contain no camera or microphone code. |

> [!NOTE]
> Tokens are sent as Bearer tokens rather than cookies because the frontend and API run on different origins. See [ADR-002](docs/ADR/ADR-002-jwt-vs-cookies.md) for the trade-offs.

---

## Performance and Accessibility

- **Lazy-loaded effects:** each WebGL background and the heavier sections load in separate chunks, so the first paint is not blocked.
- **Automatic fallbacks:** reduced motion, narrow screens, low-memory or low-core devices, data-saver mode and missing WebGL switch to a pure CSS background. Users can also set **Background effects** in the admin settings.
- **Pixel ratio cap and pausing:** rendering is capped and pauses when the tab is hidden or the effect is off-screen.
- **Server-side data work:** filtering, search, sorting and pagination run in SQL, so the browser receives only the page it needs.
- **Accessibility:** semantic landmarks, labeled form controls, visible focus rings, keyboard-operable table, board, drawer and command palette, and `prefers-reduced-motion` support.
- **Layout stability:** reserved dimensions, self-hosted fonts and skeleton loaders limit layout shift.

---

## Deployment

**Recommended order:** database → backend → frontend → connect them.

### 1. Database (Supabase)

Run the [database setup](#5-prepare-the-database) against your production `DATABASE_URL`, including `db:migrate` and `seed:admin`.

### 2. Backend on Render

1. Push the repository to GitHub.
2. In Render choose **New → Web Service** and select the repository.
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
4. Environment variables:
   - `NODE_ENV=production`
   - `DATABASE_URL` (session pooler string)
   - `JWT_SECRET` (32+ random characters)
   - `JWT_EXPIRES_IN=8h`
   - `CLIENT_URL` (set after the frontend is deployed)
5. Check `https://<your-service>.onrender.com/api/health`.

### 3. Frontend on Vercel

1. In Vercel choose **Add New → Project** and select the repository.
2. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite
3. Environment variable: `VITE_API_URL=https://<your-service>.onrender.com/api`
4. Deploy. The included `frontend/vercel.json` rewrites client routes so refreshing `/admin` works.

### 4. Connect and verify

1. Copy the Vercel URL (no trailing slash) into `CLIENT_URL` on Render and redeploy the backend.
2. Run the [smoke test](#deployment-smoke-test) against the live API.
3. Walk through the [six-step evaluator path](#six-step-walkthrough-about-90-seconds) in a private browser window and on a phone.

### Free-tier notes

- The Render free tier sleeps after inactivity, so the first request can take up to about a minute.
- Free Supabase projects can pause after a period of inactivity. Check the current policy and resume the project from the dashboard if needed.
- An external uptime monitor that calls `/api/health` every 10 to 14 minutes can keep the API warm during an evaluation window.

See [`docs/DEPLOY-CHECKLIST.md`](docs/DEPLOY-CHECKLIST.md) for a printable checklist.

---

## Troubleshooting

<details>
<summary><strong>Common problems and fixes</strong> (click to expand)</summary>

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| Database connection times out or `ENETUNREACH` on Render | Direct Supabase host is IPv6-only | Use the **session pooler** connection string |
| `password authentication failed` | Wrong password or unescaped special characters | Re-check the password and URL-encode symbols (`@` → `%40`) |
| Browser shows a CORS error | `CLIENT_URL` does not exactly match the frontend origin | Use the exact origin with no trailing slash and redeploy the backend |
| Deployed site calls `localhost` | `VITE_API_URL` was missing at build time | Set it in Vercel and redeploy the frontend |
| Refreshing `/admin` returns 404 | SPA rewrite not applied | Make sure Vercel's root directory is `frontend` so `vercel.json` is used |
| `401` after changing the password | Expected: other sessions are revoked | Sign in again |
| First load is very slow | Hosting free tier is waking up | Wait for the banner to clear or call `/api/health` first |
| Backgrounds are static or plain | Reduced motion, small or low-power device, or effects turned off | Check the OS motion setting and **Settings → Background effects** |
| `Missing or invalid environment variable` on boot | Required variable not set | Compare `.env` with `.env.example` |

</details>

---

## Maintenance

### Official program links check

The Featured Programs section links to official event pages on `k12hunar.com`. To confirm they still respond:

```bash
cd frontend
npm run check:links
```

The script reads the typed constants in `src/features/home/programs.ts`, sends one polite `HEAD` request per URL with a 10 second timeout and a descriptive user agent, and prints the status. It only warns (exit code 0), never downloads page content, and is not part of the production bundle.

Program details are indicative. Confirm final dates on the official pages.

---

## Architecture Decision Records

| Record | Topic |
| :--- | :--- |
| [ADR-001](docs/ADR/ADR-001-supabase-pooler.md) | Supabase pooler connection |
| [ADR-002](docs/ADR/ADR-002-jwt-vs-cookies.md) | JWT Bearer tokens versus cookies |
| [ADR-003](docs/ADR/ADR-003-timing-safe-auth.md) | Timing-safe authentication and brute-force protection |
| [ADR-004](docs/ADR/ADR-004-server-side-filtering.md) | Server-side filtering, search and pagination |
| [ADR-005](docs/ADR/ADR-005-webgl-background-fallback.md) | WebGL backgrounds and fallbacks |

Related documents: [Architecture and sequence flows](docs/ARCHITECTURE.md) · [ER diagram](docs/ER-DIAGRAM.md) · [Deployment checklist](docs/DEPLOY-CHECKLIST.md)

---

## Roadmap

- Superadmin team management page, so admins can be created and deactivated from the UI
- Email notifications for new inquiries and confirmation messages with the reference code
- Playwright end-to-end tests in CI for the full submit, track, triage flow
- Refresh tokens with httpOnly cookies if the frontend and API move to one domain
- Saved filter views and a printable weekly summary
- Hindi and English language toggle for public pages

---

## Credits and Attributions

- **[React Bits](https://reactbits.dev/)**: Aero Shards, Grid Scan and Ghost Fibers backgrounds (adapted), Glass Icons, Masked Heading, Depth Carousel and Gooey Nav. Please refer to the React Bits repository and each component's source header for license terms.
- **[shadcn/ui](https://ui.shadcn.com/)** and **[Radix UI](https://www.radix-ui.com/)** for accessible primitives.
- **[Lucide](https://lucide.dev/)**, **[Recharts](https://recharts.org/)**, **[dnd kit](https://dndkit.com/)**, **[Framer Motion](https://www.framer.com/motion/)** and **[Sonner](https://sonner.emilkowal.ski/)**.
- **[Fontsource](https://fontsource.org/)** for self-hosted Space Grotesk and Inter.

This is an independent project built for a full-stack assessment. K12 Hunar names, event titles and links belong to their respective owners, and program details shown on the Home page are indicative.

---

## License

Released under the [MIT License](LICENSE).

---

## Author

**Utkarsh Dubey**

- GitHub: [@utkarshdubey](https://github.com/utkarshdubey)

<div align="center">

*If this project helped you, consider giving the repository a star.*

</div>
