-- ============================================================
-- LENZIFY HOUSE BRANDS MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create brands table
CREATE TABLE IF NOT EXISTS public.brands (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  logo_url    TEXT,
  is_featured BOOLEAN DEFAULT true,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "brands_public_read" ON public.brands;
CREATE POLICY "brands_public_read" ON public.brands FOR SELECT USING (true);

DROP POLICY IF EXISTS "brands_admin_write" ON public.brands;
CREATE POLICY "brands_admin_write" ON public.brands FOR ALL USING (true) WITH CHECK (true);

-- 2. Add brand_id and brand_name to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Backfill brand_name from legacy brand column if null
UPDATE public.products
SET brand_name = brand
WHERE brand_name IS NULL AND brand IS NOT NULL;

-- 3. Seed the 6 house brands
INSERT INTO public.brands (id, name, slug, logo_url, is_featured, sort_order)
VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Brat Emoji', 'brat-emoji', '/brands/brat-emoji.png', true, 1),
  ('b1000000-0000-0000-0000-000000000002', 'Glenn Parker', 'glenn-parker', '/brands/glenn-parker.png', true, 2),
  ('b1000000-0000-0000-0000-000000000003', 'Nikos Eleni', 'nikos-eleni', '/brands/nikos-eleni.png', true, 3),
  ('b1000000-0000-0000-0000-000000000004', 'Diana', 'diana', '/brands/diana.png', true, 4),
  ('b1000000-0000-0000-0000-000000000005', 'Jacky', 'jacky', '/brands/jacky.png', true, 5),
  ('b1000000-0000-0000-0000-000000000006', 'Le Lily', 'le-lily', '/brands/le-lily.png', true, 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  logo_url = EXCLUDED.logo_url,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order;

-- 4. Associate existing products with their brand_id if matching name
UPDATE public.products p
SET brand_id = b.id, brand_name = b.name
FROM public.brands b
WHERE lower(trim(p.brand)) = lower(b.name)
   OR lower(trim(p.brand_name)) = lower(b.name);
