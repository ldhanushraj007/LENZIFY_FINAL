BEGIN;

-- 1. Add tier column (silver, gold, platinum, or null)
ALTER TABLE lenses 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT NULL;

-- 2. Add field_of_view column (narrow, wide, widest, or null)
ALTER TABLE lenses 
ADD COLUMN IF NOT EXISTS field_of_view TEXT DEFAULT NULL;

-- 3. Add performance_ratings JSONB column
ALTER TABLE lenses 
ADD COLUMN IF NOT EXISTS performance_ratings JSONB DEFAULT NULL;

-- 4. Add parent_lens_id column referencing lenses(id)
ALTER TABLE lenses 
ADD COLUMN IF NOT EXISTS parent_lens_id UUID REFERENCES lenses(id) ON DELETE SET NULL DEFAULT NULL;

-- 5. Seed the 3 Progressive tier rows (linked to the existing Progressive lens as parent)
DO $$
DECLARE
  v_parent_id UUID;
BEGIN
  -- Find existing Progressive lens ID
  SELECT id INTO v_parent_id FROM lenses WHERE name = 'Progressive' LIMIT 1;

  -- Silver Tier
  IF NOT EXISTS (SELECT 1 FROM lenses WHERE name = 'Progressive Silver') THEN
    INSERT INTO lenses (
      name,
      description,
      price,
      base_price,
      category,
      is_enabled,
      is_active,
      tier,
      field_of_view,
      performance_ratings,
      parent_lens_id
    ) VALUES (
      'Progressive Silver',
      'Excellent all-purpose progressive design with fast adaptation and strong performance in all visual fields.',
      0,
      0,
      'type',
      true,
      true,
      'silver',
      'narrow',
      '{"distance": 7, "intermediate": 5, "reading": 6, "constant": 6}'::jsonb,
      v_parent_id
    );
  END IF;

  -- Gold Tier
  IF NOT EXISTS (SELECT 1 FROM lenses WHERE name = 'Progressive Gold') THEN
    INSERT INTO lenses (
      name,
      description,
      price,
      base_price,
      category,
      is_enabled,
      is_active,
      tier,
      field_of_view,
      performance_ratings,
      parent_lens_id
    ) VALUES (
      'Progressive Gold',
      'Recommended for presbyopes choosing their first progressive design.',
      0,
      0,
      'type',
      true,
      true,
      'gold',
      'wide',
      '{"distance": 8, "intermediate": 6, "reading": 7, "constant": 6}'::jsonb,
      v_parent_id
    );
  END IF;

  -- Platinum Tier
  IF NOT EXISTS (SELECT 1 FROM lenses WHERE name = 'Progressive Platinum') THEN
    INSERT INTO lenses (
      name,
      description,
      price,
      base_price,
      category,
      is_enabled,
      is_active,
      tier,
      field_of_view,
      performance_ratings,
      parent_lens_id
    ) VALUES (
      'Progressive Platinum',
      'Designed to excel in all visual departments, this is the ultra-premium everyday lens.',
      0,
      0,
      'type',
      true,
      true,
      'platinum',
      'widest',
      '{"distance": 9, "intermediate": 8, "reading": 8, "constant": 8}'::jsonb,
      v_parent_id
    );
  END IF;
END $$;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
