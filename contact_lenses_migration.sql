-- ============================================================
-- LENZIFY MIGRATION: Contact Lenses Enhancements
-- 1. Adds pack_size to products
-- 2. Ensures specifications jsonb is present on products
-- 3. Ensures prescription_json is present on order_items
-- ============================================================

BEGIN;

-- 1. Add pack_size to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS pack_size text;

-- 2. Ensure specifications column exists on products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;

-- 3. Ensure prescription_json exists on order_items table
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS prescription_json jsonb DEFAULT NULL;

COMMIT;
