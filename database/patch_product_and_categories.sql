-- ============================================================
-- LENZIFY PATCH: Add primary_image column + fix category types
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add primary_image column to products table (if it doesn't exist)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS primary_image text;

-- 2. Copy existing 'image' column data to 'primary_image' (if image column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image'
  ) THEN
    UPDATE public.products SET primary_image = image WHERE primary_image IS NULL;
  END IF;
END $$;

-- 3. Ensure all required product columns exist
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS is_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_trending boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_arrival boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_editors_choice boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS images_360 jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]',
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'frame',
ADD COLUMN IF NOT EXISTS frame_type text,
ADD COLUMN IF NOT EXISTS shape text,
ADD COLUMN IF NOT EXISTS material text,
ADD COLUMN IF NOT EXISTS gender text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS color text,
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS collection text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS colors text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_price numeric;

-- 4. Ensure categories table has 'type' column
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS type text DEFAULT 'product';

-- 5. Fix category types based on name patterns
UPDATE public.categories SET type = 'gender' 
WHERE lower(name) IN ('men', 'women', 'kids', 'unisex', 'boys', 'girls') AND (type IS NULL OR type = 'product');

UPDATE public.categories SET type = 'collection' 
WHERE lower(name) IN ('trending', 'new arrivals', 'best sellers', 'featured', 'premium collection', 'budget collection') AND (type IS NULL OR type = 'product');

UPDATE public.categories SET type = 'usage' 
WHERE lower(name) IN ('daily wear', 'office wear', 'gaming', 'driving', 'sports', 'fashion') AND (type IS NULL OR type = 'product');

-- Keep product-type categories: Eyeglasses, Sunglasses, Computer Glasses, Reading Glasses, Contact Lenses, Accessories
-- These are already type='product' by default, which is correct

-- 6. Insert missing categories if they don't exist
INSERT INTO public.categories (name, type, slug) VALUES
  ('Men', 'gender', 'men'),
  ('Women', 'gender', 'women'),
  ('Kids', 'gender', 'kids'),
  ('Eyeglasses', 'product', 'eyeglasses'),
  ('Sunglasses', 'product', 'sunglasses'),
  ('Reading Glasses', 'product', 'reading-glasses'),
  ('Computer Glasses', 'product', 'computer-glasses'),
  ('Contact Lenses', 'product', 'contact-lenses'),
  ('Accessories', 'product', 'accessories'),
  ('New Arrivals', 'collection', 'new-arrivals'),
  ('Trending', 'collection', 'trending'),
  ('Best Sellers', 'collection', 'best-sellers'),
  ('Premium Collection', 'collection', 'premium-collection')
ON CONFLICT DO NOTHING;

-- 7. Create product_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_images (safe to re-run)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Allow public read on product_images') THEN
    CREATE POLICY "Allow public read on product_images" ON public.product_images FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_images' AND policyname = 'Allow admin write on product_images') THEN
    CREATE POLICY "Allow admin write on product_images" ON public.product_images FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 8. Create product_categories junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  category_id integer REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, category_id)
);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow public read on product_categories') THEN
    CREATE POLICY "Allow public read on product_categories" ON public.product_categories FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'product_categories' AND policyname = 'Allow admin write on product_categories') THEN
    CREATE POLICY "Allow admin write on product_categories" ON public.product_categories FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 9. Setup Storage Bucket 'product-images' and enable public access
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access for product-images bucket') THEN
    CREATE POLICY "Public Access for product-images bucket" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Uploads to product-images bucket') THEN
    CREATE POLICY "Allow Uploads to product-images bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Admin Updates to product-images bucket') THEN
    CREATE POLICY "Allow Admin Updates to product-images bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow Admin Deletes from product-images bucket') THEN
    CREATE POLICY "Allow Admin Deletes from product-images bucket" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
  END IF;
END $$;

-- ============================================================
-- PATCH COMPLETE
-- ============================================================
