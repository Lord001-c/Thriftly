/*
  # Create orders table and seller_profiles table

  1. New Tables
    - `seller_profiles` — links auth users to seller records
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `seller_id` (uuid, references sellers)
      - `created_at` (timestamptz)
    - `orders` — tracks purchases/sales
      - `id` (uuid, primary key)
      - `seller_id` (uuid, references sellers)
      - `buyer_id` (uuid, references auth.users)
      - `listing_id` (uuid, references listings)
      - `amount` (numeric, price in GHS)
      - `status` (text, default 'paid')
      - `created_at` (timestamptz)
  2. Security
    - Enable RLS on both tables
    - Sellers can view their own orders
    - Authenticated users can create orders
    - Seller profile: users can read their own, insert their own
  3. Notes
    - No seed orders since they require real auth.users
    - Orders will be created as users make purchases
*/

CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(seller_id)
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own seller profile"
  ON seller_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own seller profile"
  ON seller_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own seller profile"
  ON seller_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'paid',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    seller_id IN (SELECT seller_id FROM seller_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Buyers can view their own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (true);
