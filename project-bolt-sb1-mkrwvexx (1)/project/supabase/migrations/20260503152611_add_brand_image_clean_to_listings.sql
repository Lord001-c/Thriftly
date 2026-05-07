/*
  # Add brand and image_clean columns to listings

  1. Modified Tables
    - `listings`
      - `brand` (text, default '') — optional brand name for the listing
      - `image_clean` (text, default '') — URL of the background-removed image stored in Supabase storage
  2. Security
    - No new policies needed; existing listings policies cover these columns
  3. Notes
    - Both columns are optional with empty string defaults
    - image_clean stores the public URL from Supabase storage bucket 'listing-images'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'brand'
  ) THEN
    ALTER TABLE listings ADD COLUMN brand text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'image_clean'
  ) THEN
    ALTER TABLE listings ADD COLUMN image_clean text NOT NULL DEFAULT '';
  END IF;
END $$;
