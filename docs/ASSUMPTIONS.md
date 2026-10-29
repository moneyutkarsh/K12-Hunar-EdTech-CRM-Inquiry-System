# Architectural and Product Assumptions

This document records sensible architectural decisions and domain assumptions made during the design and development of the **K12 Hunar CRM & Inquiry System**.

## 1. Database & Infrastructure Assumptions
- **Supabase Direct vs. Pooler Connection**: Supabase direct database hostnames are IPv6-only (`AAAA` DNS records). To ensure 100% interoperability with IPv4 networks, Node.js resolvers, and deployment platforms like Render and Vercel, the backend connects using the **Supabase AWS Session Pooler** (`port 5432` or `6543`).
- **Idempotent Migration Execution**: `schema.sql` uses `IF NOT EXISTS` guards and `CREATE OR REPLACE` for all extensions, tables, constraints, triggers, and indexes, allowing safe multiple runs without state corruption.
- **Strictly Vanilla Postgres**: The system adheres to Hard Constraint 1. No Supabase Auth, client SDKs, or RLS-based auth policies are used; authentication is entirely custom and managed through direct SQL tables via `pg`.

## 2. Authentication & Security Assumptions
- **Timing Attack Mitigation**: When login fails on an unknown or non-existent email, `bcrypt.compare` continues against a precomputed dummy hash to guarantee constant execution time, preventing email enumeration via timing side-channels.
- **Account Lockout Policy**: 5 failed login attempts for a specific email within a rolling 15-minute window results in temporary lockout (`429 ACCOUNT_LOCKED`) with retry countdown guidance.
- **Token Storage Strategy**: Admin JWT tokens are stored in memory and synchronized with `localStorage` for page reload resilience, coupled with an Axios 401 response interceptor. This avoids third-party cross-origin cookie blocking between independent Vercel and Render subdomains.

## 3. Inquiry Submission & Phone Normalization
- **Phone Number Formatting**: Input numbers may contain international prefixes (`+91`), spaces, hyphens, and parentheses. The backend strips non-digit formatting characters and stores an indexed, standardized representation while preserving an optional leading `+`.
- **Honeypot Protection**: An invisible input field (`website`) is included in the public form. Genuine users will leave it empty; automated bot submissions populating this field receive an immediate benign response without creating database entries.
- **Spam Idempotency Window**: Inquiries matching the same lowercased email, category, and message hash within a 10-minute window return HTTP 200 without creating duplicate database rows.

## 4. UI/UX Design System
- **Theme Constraints**: Built strictly on the Black & Yellow palette (`#050505`, `#FFD60A`) with subtle glassmorphism and ambient glow shadows.
- **Accessible Motion**: Animation layers (such as AeroShards WebGL) evaluate `prefers-reduced-motion` and viewport width (< 640px), gracefully falling back to a lightweight radial gradient.
