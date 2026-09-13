-- ============================================================
-- LENZIFY: ADD POWER RANGES TO LENSES TABLE
-- Run this script in the Supabase SQL Editor
-- ============================================================

ALTER TABLE lenses ADD COLUMN IF NOT EXISTS power_ranges jsonb DEFAULT '[]'::jsonb;

-- Force PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
