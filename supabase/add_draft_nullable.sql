-- Run this in Supabase SQL Editor to support draft ads with partial data

-- 1. Allow NULL for fields that may be incomplete in a draft
ALTER TABLE public.ads
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN price       DROP NOT NULL,
  ALTER COLUMN condition   DROP NOT NULL;

-- 2. Regenerate search vector with COALESCE to handle NULLs
ALTER TABLE public.ads DROP COLUMN IF EXISTS search_vector;
ALTER TABLE public.ads ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('romanian',
      coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;
CREATE INDEX IF NOT EXISTS ads_search_idx ON public.ads USING GIN(search_vector);
