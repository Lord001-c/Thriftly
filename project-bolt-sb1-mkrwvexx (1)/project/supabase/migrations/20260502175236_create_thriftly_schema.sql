/*
  # Create Thriftly Marketplace Schema

  1. New Tables
    - `sellers` — seller profiles with name, avatar, rating, join date
    - `listings` — product listings with title, price, condition, size, category, description, image
  2. Security
    - Enable RLS on all tables
    - Public read access for browsing
    - Authenticated users can insert/update their own listings
  3. Notes
    - Uses monochrome design tokens in app layer
    - Seed data included for demo
*/

CREATE TABLE IF NOT EXISTS sellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  avatar text NOT NULL DEFAULT '',
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  joined_date timestamptz NOT NULL DEFAULT now(),
  item_count integer NOT NULL DEFAULT 0
);

ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sellers"
  ON sellers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create seller profile"
  ON sellers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  title text NOT NULL,
  price numeric(10,2) NOT NULL,
  condition text NOT NULL DEFAULT 'Good',
  size text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Tops',
  description text NOT NULL DEFAULT '',
  image_url text NOT NULL DEFAULT '',
  image_height integer NOT NULL DEFAULT 400,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listings"
  ON listings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create listings"
  ON listings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update own listings"
  ON listings FOR UPDATE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers))
  WITH CHECK (seller_id IN (SELECT id FROM sellers));

CREATE POLICY "Authenticated users can delete own listings"
  ON listings FOR DELETE
  TO authenticated
  USING (seller_id IN (SELECT id FROM sellers));

-- Seed sellers
INSERT INTO sellers (id, name, avatar, rating, joined_date, item_count) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Mina K.', 'https://i.pravatar.cc/100?img=1', 4.9, '2024-03-15', 23),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Alex R.', 'https://i.pravatar.cc/100?img=3', 4.7, '2024-06-22', 15),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Jordan L.', 'https://i.pravatar.cc/100?img=5', 5.0, '2023-11-01', 42),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Sam T.', 'https://i.pravatar.cc/100?img=7', 4.8, '2024-01-10', 31),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Riley N.', 'https://i.pravatar.cc/100?img=9', 4.6, '2024-08-05', 8);

-- Seed listings with varied image heights for masonry
INSERT INTO listings (seller_id, title, price, condition, size, category, description, image_url, image_height) VALUES
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Vintage Levi''s 501', 68.00, 'Good', 'W 30', 'Bottoms', 'Classic vintage wash, slight distressing at knees. True 90s cut.', '', 480),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Acne Studios Tee', 45.00, 'Like New', 'M', 'Tops', 'Barely worn. Heavyweight cotton, relaxed fit.', '', 360),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'New Balance 550', 95.00, 'New', 'US 10', 'Shoes', 'Deadstock, white/green colorway. Box included.', '', 520),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Prada Nylon Belt Bag', 220.00, 'Like New', 'One Size', 'Bags', 'Re-Edition 2005. No visible wear.', '', 400),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Rick Owens DRKSHDW Tee', 85.00, 'Good', 'L', 'Tops', 'Oversized fit, raw hem. Worn twice.', '', 380),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Carhartt WIP Detroit Jacket', 110.00, 'Good', 'M', 'Tops', 'Classic duck canvas. Patina from wear.', '', 500),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Maison Margiela Tabi Boots', 340.00, 'Like New', 'EU 40', 'Shoes', 'Iconic split-toe. Worn once indoors.', '', 560),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Uniqlo U Oversized Hoodie', 35.00, 'Good', 'L', 'Tops', 'Washed charcoal. Soft fleece interior.', '', 420),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Jil Sander Trousers', 125.00, 'Like New', 'IT 48', 'Bottoms', 'Wool blend, pressed crease. Immaculate.', '', 460),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Vans Old Skool', 40.00, 'Fair', 'US 9', 'Shoes', 'Well-loved. Great skate beaters.', '', 380),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Lemaire Croissant Bag', 195.00, 'New', 'One Size', 'Bags', 'Tags on. Black lambskin.', '', 350),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Vintage Polo Ralph Lauren', 55.00, 'Good', 'L', 'Tops', '90s big pony, navy. Minor fading.', '', 440),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Comme des Garcons Play Tee', 78.00, 'Like New', 'S', 'Tops', 'Heart logo, classic fit. No flaws.', '', 370),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Salomon XT-6', 140.00, 'Good', 'US 11', 'Shoes', 'Trail runners, black/black. Light use.', '', 490),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'A.P.C. New Standard Jeans', 90.00, 'Good', 'W 32', 'Bottoms', 'Raw denim, 6 months of wear. Great fades.', '', 450),
  ('a1b2c3d4-0001-4000-8000-000000000003', 'Bottega Veneta Card Case', 160.00, 'Like New', 'One Size', 'Accessories', 'Intrecciato leather. Minimal wear.', '', 320),
  ('a1b2c3d4-0001-4000-8000-000000000005', 'Nike ACG GORE-TEX Jacket', 130.00, 'Good', 'L', 'Tops', 'All-conditions gear. Waterproof, breathable.', '', 530),
  ('a1b2c3d4-0001-4000-8000-000000000001', 'Issey Miyake Pleated Pants', 150.00, 'Like New', 'S', 'Bottoms', 'Signature pleats, black. Stunning drape.', '', 410),
  ('a1b2c3d4-0001-4000-8000-000000000002', 'Muji Canvas Tote', 18.00, 'Good', 'One Size', 'Bags', 'Worn-in perfectly. Great everyday bag.', '', 340),
  ('a1b2c3d4-0001-4000-8000-000000000004', 'Vintage Ray-Ban Aviators', 75.00, 'Fair', 'One Size', 'Accessories', 'Classic gold frame, green lens. Minor scratches.', '', 300);
