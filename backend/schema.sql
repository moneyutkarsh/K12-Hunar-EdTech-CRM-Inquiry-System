-- ==============================================================================
-- K12 Hunar CRM & Inquiry System - Database Schema (Advanced Edition)
-- Compatible with Supabase PostgreSQL (Port 6543 / 5432 via node-postgres pg)
-- Idempotent script: Safe to run multiple times
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. ADMINS TABLE
-- Custom authentication table with role-based access control (RBAC)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE CHECK (email = LOWER(email)),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migration for existing admin table versions
ALTER TABLE admins ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE admins ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Index for fast case-insensitive email lookup
CREATE INDEX IF NOT EXISTS idx_admins_email_lower ON admins (LOWER(email));

-- 3. INQUIRIES TABLE
-- Core inquiries repository with stored generated phone_digits and source_ip_hash
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type TEXT NOT NULL CHECK (user_type IN ('Parent', 'Student', 'School')),
    category TEXT NOT NULL CHECK (category IN ('Scholarship', 'Concert', 'Admission', 'General Query')),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
    email TEXT NOT NULL CHECK (char_length(email) <= 254),
    phone TEXT NOT NULL,
    phone_digits TEXT GENERATED ALWAYS AS (regexp_replace(phone, '\D', '', 'g')) STORED,
    message TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 1000),
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved')),
    source_ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotent migration for existing inquiries table versions
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS phone_digits TEXT GENERATED ALWAYS AS (regexp_replace(phone, '\D', '', 'g')) STORED;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS source_ip_hash TEXT;

-- 4. INQUIRY NOTES TABLE
-- Internal team collaboration notes tied to an inquiry
CREATE TABLE IF NOT EXISTS inquiry_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    note TEXT NOT NULL CHECK (char_length(note) BETWEEN 1 AND 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ACTIVITY LOG TABLE
-- Audit trail tracking status transitions, note creation, and inquiry submission
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    from_value TEXT,
    to_value TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. LOGIN ATTEMPTS TABLE
-- Audit log tracking brute-force attempts and triggering 15-minute lockouts
CREATE TABLE IF NOT EXISTS login_attempts (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    ip_hash TEXT,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PERFORMANCE & SEARCH INDEXES
-- Optimizes filtered list queries and sorting
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at_desc ON inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_composite_cat_type_date ON inquiries (category, user_type, created_at DESC);

-- Fast phone search on stripped digits
CREATE INDEX IF NOT EXISTS idx_inquiries_phone_digits ON inquiries (phone_digits);

-- Trigram GIN index for fast fuzzy / ILIKE name search
CREATE INDEX IF NOT EXISTS idx_inquiries_name_trgm ON inquiries USING gin (name gin_trgm_ops);

-- Notes and audit log indexes
CREATE INDEX IF NOT EXISTS idx_inquiry_notes_inquiry_date ON inquiry_notes (inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_inquiry_date ON activity_log (inquiry_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_date ON login_attempts (email, created_at DESC);

-- 8. TRIGGER: Automatic updated_at timestamp management
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_inquiries_updated_at ON inquiries;
CREATE TRIGGER trigger_inquiries_updated_at
BEFORE UPDATE ON inquiries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
