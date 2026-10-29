# UI/UX UPGRADE LOG: K12 HUNAR CRM

## Baseline Checks (Branch: `feat/ui-upgrade`)
- **Git Branch**: `feat/ui-upgrade`
- **Backend Tests**: 30/30 passed (`vitest run`)
- **Frontend Typecheck & Build**: Passed with 0 errors (`tsc -b; vite build` in 1.50s)
- **Supabase DB Connectivity**: Connected & Verified (49 records)
- **Visual Identity Preserved**:
  - Dark base `#050505` with `#FFD60A` accent
  - Glass cards with rounded-2xl
  - Status colors (New #FFD60A, In Progress #FB923C, Resolved #4ADE80)
  - Bottom accent lines on stat cards
  - Table/Board toggle and Command Palette (Actions ⌘K)

---

## Upgrade Phases Progress

| Phase | Description | Status | Commit |
|---|---|---|---|
| U0 | Realistic Demo Data (90-day natural curve, IST weighted, idempotent) | In Progress | Pending |
| U1 | Overview Upgrades (Delta chips, 14d sparklines, click-to-filter, needs attention strip, secondary KPIs) | Pending | Pending |
| U2 | Charts Upgrades (7d/30d/90d toggle, donut center label, hover dimming, funnel/breakdown) | Pending | Pending |
| U3 | Table Upgrades (Initials avatar, 2-line date, unseen badge, hover quick actions, bulk bar) | Pending | Pending |
| U4 | Board Upgrades (@dnd-kit drag & drop, age dots, quick actions, column stats) | Pending | Pending |
| U5 | Drawer Upgrades (Prev/Next navigation, Quick reply templates, rich timeline) | Pending | Pending |
| U6 | Shell Upgrades (Sidebar quick views & today card, header status & polling bell) | Pending | Pending |
| U7 | Responsive Polish (Mobile cards, snap scroll, bottom sheets) | Pending | Pending |
| U8 | Micro-Polish (Noise overlay, focus rings, smooth count-up) | Completed | `7aae161` |

---

# V2 EXPANSION PACK UPGRADE LOG (Branch: `feat/v2-home-and-features`)

## V0 Baseline Checks
- **Branch**: `feat/v2-home-and-features`
- **Frontend Typecheck**: Passed (`tsc --noEmit` 0 errors)
- **Frontend Unit Tests**: 13/13 passed (`vitest run` in 647ms)
- **Frontend Build**: Passed (`vite build` in 1.62s; GridScan chunk 22.70 kB)
- **Backend Tests**: 32/32 passed (`vitest run` in 20.21s)

## V2 Phases Tracking

| Phase | Module | Scope | Status | Commit |
|---|---|---|---|---|
| **V0** | Baseline | Checks, screenshots directory setup, log initialization | Completed | `d020c48` |
| **V1** | P1 | Home Page + Ghost Fibers (WebGL + CSS fallback), route & background map, form prefill | Completed | `804cda7` |
| **V2** | N1 | Public Inquiry Tracker (`/track`), `reference_code` DB & migration, public stats API | Completed | `748f427` |
| **V3** | N2 + N3 | Priority & Assignee workflow, duplicate/related contacts detection | Completed | `1593cfa` |
| **V4** | N4 | Settings Page (`/admin/settings`), JWT `token_version` revocation, password change | Completed | `77fff8b` |
| **V5** | N5 | Activity Feed (`/admin/activity`), audit log cursor timeline & filter chips | Completed | `71e682a` |
| **V6** | N6 | Documentation, OpenAPI specification, and full verification suite | Completed | Pending |

### V1 Deliverables Summary:
- **Home Page (`/`)**: Comprehensive public landing experience with sticky glass navbar, word-by-word reveal Space Grotesk headline, Services cards (`#services`), Stakeholders section (`#who`), 3-step process (`#how-it-works`), live public stats trust strip, accessible FAQ accordion with JSON-LD schema, and CTA band with footer.
- **GhostFibers Background**: Installed from `@react-bits/GhostFibers-TS-TW` into `GhostFibersBackground.tsx`. Tuned for obsidian base (`#050505`), brand yellow (`#FFD60A`), warm amber (`#FB923C`), low density (0.35), capped DPR 1.5, tab visibility pause, IntersectionObserver hero scroll dimming (to 25%), and pure CSS diagonal streaks fallback. Zero camera/getUserMedia tracking. Dynamic chunk size: 26.94 kB (9.50 kB gzip).
- **Route & Background Isolation Map**:
  - `/`: HomePage + `GhostFibersBackground`
  - `/inquiry`: PublicInquiryPage + `AppBackground` (AeroShards)
  - `/track`: PublicTrackerPage + `AppBackground` (AeroShards)
  - `/admin/login`: AdminLoginPage + `AppBackground` (AeroShards)
  - `/admin`, `/admin/activity`, `/admin/settings`: AdminShell + `GridScan`
  - Strictly 1 canvas mounted at any time.

### V2 Deliverables Summary:
- **Reference Code Generator & Validator**: Unambiguous 32-character alphabet (`23456789ABCDEFGHJKMNPQRSTUVWXYZ`), formatted as `KH-XXXXXXXX`.
- **Database Migration (`backend/src/scripts/migrate.js`)**: Added `reference_code` column with unique index to `inquiries`, backfilled existing rows with conflict-safe loops, verified idempotent across multiple runs. Added `"db:migrate": "node src/scripts/migrate.js"`.
- **Public Inquiry Endpoint**: Returns `referenceCode` on both initial creation and duplicate window match.
- **Success Panel**: Displays highlighted reference code box, one-click clipboard copy button with toast, and direct "Track Inquiry" button.
- **Tracker Endpoint (`POST /api/track`)**: Strict rate-limited (10 req/15 min/IP). Matches uppercase reference and lowercase email. Zero PII or internal IDs leaked. Returns sanitized timeline from activity logs.
- **Tracker Page (`/track`)**: Interactive lookup form with auto-fill via `?ref=...`, visual 3-step pipeline (`Received` -> `In review` -> `Resolved`) with status badges and timeline history.
- **Public Stats API**: Created `GET /api/public/stats` with 60-second in-memory cache and rate limiting.

### V3 Deliverables Summary (Priority, Assignee & Duplicate Contacts):
- **Priority Levels**: Added `priority` column (`Low`, `Normal`, `High`, `Urgent`, default `Normal`) with check constraint and index. Added `PATCH /api/inquiries/:id/priority`.
- **Assignee Workflow**: Added `assigned_to UUID REFERENCES admins(id)`. Added `PATCH /api/inquiries/:id/assign` and `GET /api/admins/options`.
- **Duplicate & Repeat Contact Detection**: Inquiries query now includes `contact_count` subquery. Drawer loads up to 5 related inquiries by matching email or phone. UI shows `×N` badge on repeat contact rows and cards.
- **Multi-Admin Seed**: CLI flags for `seedAdmin.js` (`--email`, `--password`, `--name`). Seeded Priya Sharma and Rahul Mehta alongside Lead Admin.
- **UI Enhancements**: Inquiry Table and Board cards render priority badges, repeat contact chips, and assignee avatars. Drawer includes priority buttons, assignee dropdown, and clickable related inquiry list.

### V4 Deliverables Summary (Settings & Session Revocation):
- **Session Revocation**: Added `token_version INT NOT NULL DEFAULT 1` to `admins`. JWT tokens include `tv` claim. Auth middleware verifies token version against DB; mismatched tokens return 401 `REVOKED_TOKEN`.
- **Password Policy & Endpoints**:
  - `PATCH /api/auth/password`: Validates current password, enforces complexity rules (min 8 chars, uppercase, lowercase, number, symbol), updates password hash, and increments `token_version` to invalidate all other sessions.
  - `POST /api/auth/logout-all`: Increments `token_version` to terminate all active logins across devices.
  - `GET /api/auth/me`: Returns profile with name, email, role, and security `tokenVersion`.
- **Admin Settings Page (`/admin/settings`)**:
  - Profile tab: Avatar, name, role badge, copyable email, security version indicator.
  - Security tab: Change password form with real-time complexity checklist, and emergency "Revoke All Active Sessions" confirmation modal.
  - UI Preferences tab: Toggles for GridScan background, sound feedback, and compact table density.

### V5 Deliverables Summary (Activity Feed):
- **Activity API (`GET /api/activity`)**: Protected endpoint supporting cursor-based pagination (`nextCursor`, `hasMore`, `limit=1..100`), action filtering (`status`, `priority`, `assigned`, `notes`), and inquiry filtering.
- **Activity Feed Page (`/admin/activity`)**:
  - Filter chips bar: All Activities, Status Changes, Priority Updates, Lead Assignments, Internal Notes.
  - Chronological grouping: Today, Yesterday, Earlier this week, Older.
  - Action-specific glass icon badges and human-readable event statements.
  - Inquiry reference pill with direct inspection navigation to `/admin?drawer=<id>`.
  - Cursor-based "Load More Activities" button.

### V6 Deliverables Summary (Documentation & Verification):
- **OpenAPI 3.0 Documentation**: Complete coverage for all 8 new/updated endpoints in `backend/src/docs/openapi.js`.
- **Test Suite**: 52/52 backend tests passing (unit + integration suites).
- **Frontend Production Build**: Zero TypeScript errors (`tsc -b; vite build` passing with optimized chunks).



