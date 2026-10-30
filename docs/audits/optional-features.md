# Audit & Status: Optional Additive Features (Phase A6)

This document records the evaluation, status, and architectural justification for optional additive features per Phase A6.

---

## 1. Feature A6.1: Superadmin Team Management
- **Description**: Add full CRUD operations for adding/deleting counselors and admins via `/admin/team` or inside `/admin/settings`.
- **Status**: **SKIPPED**
- **Justification**:
  - The existing database schema enforces `assigned_to` foreign keys from `inquiries` to `admins(id)` without a cascade delete rule.
  - Adding deletion or role changes without an explicit migration could result in orphaned foreign key constraint violations or accidental privilege escalation.
  - Read-only team visibility, counselor assignment options (`GET /api/admins/options`), individual password updates, and global session revocation (`POST /api/auth/logout-all`) are fully implemented and functional in `/admin/settings`.

---

## 2. Feature A6.2: Outbound Email Notifications
- **Description**: Automatic email alerts on inquiry submission and status transitions.
- **Status**: **SKIPPED** (for general inquiries; **ACTIVE** for Admin OTP)
- **Justification**:
  - Admin email OTP verification is active and verified using Nodemailer (`backend/src/services/otp.service.js`) via secure SMTP transport.
  - Automatically dispatching emails on every public inquiry or status update during test runs and evaluator review risks hitting Gmail SMTP sending quotas (500/day) or being flagged as spam without a dedicated transactional provider (e.g., SendGrid/Resend with custom DKIM/SPF).
  - Public status tracking is solved transparently via the zero-login Reference Tracker (`/track`).

---

## 3. Feature A6.3: Top-Level Error Boundary & Lazy Chunk Auto-Reload
- **Description**: Catch runtime exceptions and automatically reload chunk-hash mismatches.
- **Status**: **SKIPPED**
- **Justification**:
  - Per Absolute Rule 0, existing core application components (`App.tsx`, `HomePage.tsx`, etc.) are protected from modification to preserve visual stability.
  - All current routes are bundled cleanly, and WebGL contexts (AeroShards, GridScan, GhostFibers) already include dedicated WebGL context detection and canvas failure fallbacks within their respective wrapper modules.
