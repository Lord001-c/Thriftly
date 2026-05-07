DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'paystack_subaccount_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN paystack_subaccount_code text;
  END IF;
END $$;
