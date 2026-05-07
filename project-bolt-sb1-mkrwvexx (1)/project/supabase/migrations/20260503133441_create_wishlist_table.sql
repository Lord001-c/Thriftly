/*
  # Create wishlist table

  1. New Tables
    - `wishlist` — stores user's saved items
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `listing_id` (uuid, references listings)
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, listing_id)
  2. Security
    - Enable RLS on wishlist
    - Users can read/insert/delete only their own wishlist items
*/

CREATE TABLE IF NOT EXISTS wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wishlist"
  ON wishlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist item"
  ON wishlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist item"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
