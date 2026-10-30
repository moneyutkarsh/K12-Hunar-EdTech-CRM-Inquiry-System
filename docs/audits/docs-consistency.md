# Documentation & Architecture Consistency Audit

**Date:** 2026-10-30  
**Scope:** README, ADRs, deployment guides, UPGRADE-LOG, and code reality.  
**Rule:** Mismatch identification only (no modifications applied in this audit).

---

## 1. Summary of Identified Inconsistencies

| Category | Document | Code / Actual Reality | Severity |
| :--- | :--- | :--- | :-: |
| **Absolute Machine Paths** | `README.md:289-296` & `docs/UPGRADE-LOG.md:176` | Contains `file:///c:/Users/Utkarsh%20Dubey/...` URLs that fail on GitHub or other machines. | **HIGH** |
| **Supabase Pooler Port & Mode** | `backend/.env.example:7` vs `docs/ADR/ADR-001-supabase-pooler.md` | `.env.example` documents port `5432` (Session pooler), while ADR-001 and `backend/.env` use port `6543` (Transaction pooler) labeled as "Session Pooler". | **MEDIUM** |
| **Test Counts** | Early documentation sections | Documents state "25 tests" or "30 tests", whereas actual test suites run 88 automated tests (36 frontend + 52 backend). | **LOW** |
| **Framework Major Versions** | Generic setup references | Project uses bleeding-edge Vite 8 (`^8.0.0`), React 19 (`^19.3.1`), and Tailwind CSS 4 (`^4.0.0`). Any legacy references to React 18 / Tailwind 3 are inaccurate. | **LOW** |
| **Stale "Pending" Statuses** | `docs/UPGRADE-LOG.md` | Several Phase 3/4 verification steps marked as "Pending / Under Review" despite full implementation and verification. | **LOW** |

---

## 2. Detailed Findings

### 2.1 Absolute `file:///` Links in `README.md` and `UPGRADE-LOG.md`
* **Evidence in `README.md`:**
  ```markdown
  - [ADR-001: Supabase Session Pooler (Port 6543)](file:///c:/Users/Utkarsh%20Dubey/.gemini/antigravity/EdTech%20CRM%20&%20Inquiry%20System/docs/ADR/ADR-001-supabase-pooler.md)
  - [Database ER Diagram](file:///c:/Users/Utkarsh%20Dubey/.gemini/antigravity/EdTech%20CRM%20&%20Inquiry%20System/docs/ER-DIAGRAM.md)
  ...
  ```
* **Impact:** Clicking these links on GitHub web or any external developer's workstation results in 404 / file not found errors.
* **Correction Required:** Convert to repo-relative markdown paths:
  ```markdown
  - [ADR-001: Supabase Pooler](docs/ADR/ADR-001-supabase-pooler.md)
  - [Database ER Diagram](docs/ER-DIAGRAM.md)
  ```

---

### 2.2 Supabase Pooler Port Inconsistency (5432 vs 6543)
* **Evidence:**
  * `backend/.env.example` line 7-10:
    ```env
    # Supabase PostgreSQL Session Pooler connection string (Port 5432)
    DATABASE_URL=postgresql://postgres.yourprojectref:yourpassword@aws-0-us-east-1.pooler.supabase.com:5432/postgres
    ```
  * `docs/ADR/ADR-001-supabase-pooler.md` title:
    `ADR-001: Supabase Session Pooler (Port 6543)`
  * `backend/.env` (actual):
    `postgresql://postgres.jefdtxzpfgtjkyeukbnn:...@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`
* **Technical Reality in Supabase:**
  * Port `5432` on the pooler domain operates in **Session mode** (supports prepared statements and session state).
  * Port `6543` on the pooler domain operates in **Transaction mode** (supports high concurrency; does not support prepared statements).
* **Correction Required:** Clarify throughout ADR-001, `.env.example`, and `DEPLOY-CHECKLIST.md` that port `6543` is Supabase's Transaction Pooler (or port `5432` for Session Pooler) to prevent connection timeouts when developers deploy.

---

### 2.3 Measured Test Counts vs Documented Figures
* **Actual Measured Test Suite Inventory:**
  * **Frontend (Vitest):** 36 passed tests across 3 test files (`programs.test.ts`, `home_polish.test.ts`, `backgroundDecision.test.ts`).
  * **Backend (Vitest):** 52 passed tests across 6 test files (`utils.test.js`, `auth.test.js`, `api.test.js`, `track.test.js`, `activity.test.js`, `auth_settings.test.js`).
  * **Smoke Test Script (`smoke.mjs`):** 7 automated health & workflow assertions.
  * **Total:** 95 automated test assertions.
* **Correction Required:** Update README and upgrade logs with exact verified counts: **88 unit/integration tests + 7 smoke steps = 95 total automated checks**.
