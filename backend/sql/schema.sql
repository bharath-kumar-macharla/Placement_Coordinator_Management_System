-- ============================================================
-- Placement Drive Coordinator — Database Schema
-- Run this entire file in the Supabase SQL editor (once).
-- Uses gen_random_uuid() — ensure pgcrypto extension is enabled
-- (it is enabled by default in Supabase).
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'coordinator', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE drive_status AS ENUM (
    'draft', 'open', 'closed', 'shortlisting', 'scheduled', 'completed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM (
    'eligible', 'applied', 'shortlisted',
    'round_1', 'round_2', 'round_3',
    'selected', 'rejected', 'withdrawn'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE round_type AS ENUM (
    'aptitude', 'technical', 'hr', 'group_discussion', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE round_mode AS ENUM ('online', 'offline');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE slot_status AS ENUM (
    'scheduled', 'completed', 'no_show', 'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          user_role NOT NULL DEFAULT 'student',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role   ON users (role);

-- ── student_profiles ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_profiles (
  user_id          UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  roll_no          TEXT UNIQUE,
  branch           TEXT,
  year             INT,
  cgpa             NUMERIC(4, 2),
  backlogs         INT NOT NULL DEFAULT 0,
  skills           TEXT[] NOT NULL DEFAULT '{}',
  resume_text      TEXT,
  resume_url       TEXT,
  phone            TEXT,
  linkedin         TEXT,
  projects         JSONB NOT NULL DEFAULT '[]',
  certifications   TEXT[] NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sp_branch ON student_profiles (branch);
CREATE INDEX IF NOT EXISTS idx_sp_year   ON student_profiles (year);
CREATE INDEX IF NOT EXISTS idx_sp_cgpa   ON student_profiles (cgpa);

-- ── companies ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  website     TEXT,
  description TEXT,
  industry    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── drives ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drives (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
  created_by            UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  title                 TEXT NOT NULL,
  role_title            TEXT,
  jd_text               TEXT,
  ctc_lpa               NUMERIC(6, 2),
  location              TEXT,
  registration_deadline TIMESTAMPTZ,
  status                drive_status NOT NULL DEFAULT 'draft',
  criteria_confirmed    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drives_company_id ON drives (company_id);
CREATE INDEX IF NOT EXISTS idx_drives_status     ON drives (status);
CREATE INDEX IF NOT EXISTS idx_drives_created_by ON drives (created_by);

-- ── drive_criteria ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drive_criteria (
  drive_id         UUID PRIMARY KEY REFERENCES drives (id) ON DELETE CASCADE,
  min_cgpa         NUMERIC(4, 2),
  max_backlogs     INT,
  allowed_branches TEXT[] NOT NULL DEFAULT '{}',
  allowed_years    INT[]  NOT NULL DEFAULT '{}',
  required_skills  TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  mandatory_skills TEXT[] NOT NULL DEFAULT '{}',
  extra_rules      TEXT,
  ai_confidence    NUMERIC(4, 3),
  ai_raw           JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── applications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id             UUID NOT NULL REFERENCES drives (id) ON DELETE CASCADE,
  student_id           UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status               application_status NOT NULL DEFAULT 'eligible',
  match_score          INT,
  skill_gap            JSONB,
  resume_feedback      JSONB,
  ai_reason            TEXT,
  status_reason        TEXT,
  coordinator_approved BOOLEAN NOT NULL DEFAULT FALSE,
  reminders_sent       JSONB NOT NULL DEFAULT '{}',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (drive_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_drive_id   ON applications (drive_id);
CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications (student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status     ON applications (status);

-- ── application_events ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS application_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  from_status    application_status,
  to_status      application_status NOT NULL,
  reason         TEXT,
  actor_id       UUID REFERENCES users (id) ON DELETE SET NULL,
  at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_events_app_id ON application_events (application_id);

-- ── rounds ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rounds (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id         UUID NOT NULL REFERENCES drives (id) ON DELETE CASCADE,
  round_no         INT NOT NULL,
  name             TEXT NOT NULL,
  type             round_type NOT NULL DEFAULT 'other',
  duration_minutes INT NOT NULL DEFAULT 60,
  mode             round_mode NOT NULL DEFAULT 'offline',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (drive_id, round_no)
);

CREATE INDEX IF NOT EXISTS idx_rounds_drive_id ON rounds (drive_id);

-- ── schedule_slots ────────────────────────────────────────────
-- NOTE: Overlap enforcement is done at the application layer in schedulerService.js
-- because Supabase's managed Postgres may not have btree_gist enabled.
-- A database-level EXCLUDE USING GIST would require:
--   CREATE EXTENSION IF NOT EXISTS btree_gist;
--   EXCLUDE USING GIST (application_id WITH =, tstzrange(start_time, end_time) WITH &&)
-- This is documented in ASSUMPTIONS.md.
CREATE TABLE IF NOT EXISTS schedule_slots (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id            UUID NOT NULL REFERENCES rounds (id) ON DELETE CASCADE,
  application_id      UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
  room                TEXT,
  start_time          TIMESTAMPTZ NOT NULL,
  end_time            TIMESTAMPTZ NOT NULL,
  status              slot_status NOT NULL DEFAULT 'scheduled',
  clash_resolved_note TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT end_after_start CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_round_id       ON schedule_slots (round_id);
CREATE INDEX IF NOT EXISTS idx_slots_application_id ON schedule_slots (application_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time     ON schedule_slots (start_time);

-- ── notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  drive_id   UUID REFERENCES drives (id) ON DELETE SET NULL,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);

-- ── audit_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  before      JSONB,
  after       JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor      ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity     ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs (created_at DESC);

-- ── updated_at trigger helper ─────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to all tables with updated_at
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'users', 'student_profiles', 'companies',
    'drives', 'drive_criteria', 'applications', 'schedule_slots'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_set_updated_at ON %I;
       CREATE TRIGGER trg_set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;
