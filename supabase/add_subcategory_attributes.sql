-- Add subcategory and attributes columns to ads table
ALTER TABLE ads ADD COLUMN IF NOT EXISTS subcategory TEXT;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS attributes JSONB DEFAULT NULL;
