-- Add WhatsApp number to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS whatsapp_number text;

-- Create order_notifications table
CREATE TABLE IF NOT EXISTS order_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  seller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_phone text NOT NULL,
  acknowledged boolean NOT NULL DEFAULT false,
  send_count integer NOT NULL DEFAULT 0,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE order_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can read own notifications"
  ON order_notifications FOR SELECT TO authenticated
  USING (seller_user_id = auth.uid());

CREATE POLICY "Sellers can update own notifications"
  ON order_notifications FOR UPDATE TO authenticated
  USING (seller_user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON order_notifications FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON order_notifications FOR UPDATE TO service_role
  USING (true);
