# Entity Relationship Diagram (ERD) - K12 Hunar CRM

This document describes the relational database schema implemented in `backend/schema.sql` for PostgreSQL on Supabase.

## Database Overview
- **Engine**: PostgreSQL 15+ (Supabase)
- **Extensions**: `pgcrypto` (UUID generation), `pg_trgm` (trigram substring and fuzzy indexing)
- **Design Philosophy**: Strict referential integrity (`CASCADE` / `SET NULL`), DB-level `CHECK` constraints, audit trails, and deterministic lowercase email storage.

```mermaid
erDiagram
    ADMINS ||--o{ INQUIRY_NOTES : writes
    ADMINS ||--o{ ACTIVITY_LOG : performs
    INQUIRIES ||--o{ INQUIRY_NOTES : contains
    INQUIRIES ||--o{ ACTIVITY_LOG : tracks

    ADMINS {
        uuid id PK "gen_random_uuid()"
        text email UK "lower(email) check"
        text password_hash "bcrypt cost 12"
        text role "check in ('admin', 'superadmin')"
        boolean is_active "default true"
        timestamptz last_login_at "nullable"
        timestamptz created_at "default now()"
    }

    INQUIRIES {
        uuid id PK "gen_random_uuid()"
        text user_type "check ('Parent', 'Student', 'School')"
        text category "check ('Scholarship', 'Concert', 'Admission', 'General Query')"
        text name "check (length between 2 and 100)"
        text email "check (length <= 254)"
        text phone "normalized phone string"
        text phone_digits "GENERATED ALWAYS AS regexp_replace(phone, '\D', '', 'g')"
        text message "check (length between 10 and 1000)"
        text status "check ('New', 'In Progress', 'Resolved') default 'New'"
        text source_ip_hash "SHA-256 hash of client IP"
        timestamptz created_at "default now()"
        timestamptz updated_at "set via before update trigger"
    }

    INQUIRY_NOTES {
        uuid id PK "gen_random_uuid()"
        uuid inquiry_id FK "references inquiries(id) on delete cascade"
        uuid admin_id FK "references admins(id) on delete restrict"
        text note "check (length between 1 and 1000)"
        timestamptz created_at "default now()"
    }

    ACTIVITY_LOG {
        uuid id PK "gen_random_uuid()"
        uuid inquiry_id FK "references inquiries(id) on delete cascade"
        uuid admin_id FK "references admins(id) on delete set null"
        text action "e.g. 'created', 'status_changed', 'note_added'"
        text from_value "previous state (nullable)"
        text to_value "new state (nullable)"
        timestamptz created_at "default now()"
    }

    LOGIN_ATTEMPTS {
        bigserial id PK
        text email "attempted email"
        text ip_hash "SHA-256 hash of client IP"
        boolean success "true if authenticated, false otherwise"
        timestamptz created_at "default now()"
    }
```

## Indexes and Performance Rationale

| Index Name | Target Table | Definition | Query Pattern Supported |
|---|---|---|---|
| `idx_inquiries_created_at` | `inquiries` | `(created_at DESC)` | Default timeline sorting and recency queries |
| `idx_inquiries_category` | `inquiries` | `(category)` | Filtering by inquiry type |
| `idx_inquiries_user_type` | `inquiries` | `(user_type)` | Filtering by persona (Parent, Student, School) |
| `idx_inquiries_status` | `inquiries` | `(status)` | Pipeline status grouping and board columns |
| `idx_inquiries_cat_ut_created` | `inquiries` | `(category, user_type, created_at DESC)` | Composite query optimization for filtered lists |
| `idx_inquiries_name_trgm` | `inquiries` | `USING gin (lower(name) gin_trgm_ops)` | High-performance substring search (`ILIKE '%query%'`) |
| `idx_inquiries_phone_digits` | `inquiries` | `(phone_digits)` | Exact/prefix phone search on normalized digits |
| `idx_notes_inquiry_created` | `inquiry_notes` | `(inquiry_id, created_at DESC)` | Instant reverse-chronological retrieval of inquiry notes |
| `idx_activity_inquiry_created`| `activity_log` | `(inquiry_id, created_at DESC)` | Audit trail timeline in inquiry details drawer |
| `idx_login_attempts_email_time`| `login_attempts` | `(email, created_at DESC)` | 15-minute brute-force lockout window checks |
