DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'status'
  ) THEN
    ALTER TABLE listings ADD COLUMN status text NOT NULL DEFAULT 'active';
  END IF;
END $$;
