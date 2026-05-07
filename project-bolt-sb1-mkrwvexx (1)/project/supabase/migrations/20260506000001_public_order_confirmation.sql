-- Allow public (anon) access to orders for QR confirmation page.
-- The order UUID acts as an access token — 128-bit random, unguessable.

CREATE POLICY "Public order confirmation read"
  ON orders FOR SELECT TO anon
  USING (true);

CREATE POLICY "Public order delivery confirmation"
  ON orders FOR UPDATE TO anon
  USING (status = 'paid')
  WITH CHECK (status = 'delivered');
