-- Add dispatch and delivery tracking columns
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS dispatched_by uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS delivered_by uuid REFERENCES public.profiles(id);

-- Remove old anon delivery policy (replaced with role-based authenticated policies)
DROP POLICY IF EXISTS "Public order delivery confirmation" ON orders;

-- Allow authenticated users to read any order (required for UPDATE to work in RLS)
DROP POLICY IF EXISTS "Authenticated can read orders" ON orders;
CREATE POLICY "Authenticated can read orders"
  ON orders FOR SELECT TO authenticated
  USING (true);

-- Seller can mark their own order as dispatched (paid → shipped)
DROP POLICY IF EXISTS "Seller can dispatch order" ON orders;
CREATE POLICY "Seller can dispatch order"
  ON orders FOR UPDATE TO authenticated
  USING (
    status = 'paid' AND
    seller_id IN (SELECT seller_id FROM seller_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (status = 'shipped');

-- Buyer can confirm delivery of their own order (shipped → delivered)
DROP POLICY IF EXISTS "Buyer can confirm delivery" ON orders;
CREATE POLICY "Buyer can confirm delivery"
  ON orders FOR UPDATE TO authenticated
  USING (status = 'shipped' AND buyer_id = auth.uid())
  WITH CHECK (status = 'delivered');
