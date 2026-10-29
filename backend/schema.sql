-- ==============================================================================
-- K12 Hunar CRM & Inquiry System - Database Schema
-- Compatible with Supabase PostgreSQL (Standard Postgres Connection via pg)
-- Idempotent script: Safe to run multiple times
-- ==============================================================================

-- 1. Enable UUID and Trigram Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for case-insensitive email lookup
CREATE INDEX IF NOT EXISTS idx_admins_email_lower ON admins (LOWER(email));

-- 3. Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type TEXT NOT NULL CHECK (user_type IN ('Parent', 'Student', 'School')),
    category TEXT NOT NULL CHECK (category IN ('Scholarship', 'Concert', 'Admission', 'General Query')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for Fast Filtering & Sorting
CREATE INDEX IF NOT EXISTS idx_inquiries_category ON inquiries (category);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_type ON inquiries (user_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries (status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at_desc ON inquiries (created_at DESC);

-- 5. Trigram & Search Indexes for Fast Search
CREATE INDEX IF NOT EXISTS idx_inquiries_name_trgm ON inquiries USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_inquiries_name_lower ON inquiries (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_inquiries_phone ON inquiries (phone);

-- 6. Trigger to automatically keep updated_at in sync
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- Sample inquiries (uncomment if you wish to run a manual insert directly):
--
-- INSERT INTO inquiries (user_type, category, name, email, phone, message, status)
-- VALUES
-- ('Parent', 'Admission', 'Aarav Sharma', 'aarav.parent@example.com', '+91 98765 43210', 'Seeking admission details for Grade 9 student.', 'New'),
-- ('Student', 'Scholarship', 'Diya Patel', 'diya.student@example.com', '9811122233', 'Applying for merit-cum-means music scholarship.', 'In Progress'),
-- ('School', 'Concert', 'DPS International', 'coordinator@dpsdelhi.edu', '+91 11 2345 6789', 'Interested in hosting the annual inter-school Hunar choir concert.', 'Resolved');
-- ==============================================================================
