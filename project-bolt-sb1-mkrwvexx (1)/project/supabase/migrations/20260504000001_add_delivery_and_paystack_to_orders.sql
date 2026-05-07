alter table orders
  add column if not exists paystack_ref text,
  add column if not exists delivery_method text default 'delivery',
  add column if not exists delivery_address text,
  add column if not exists delivery_city text,
  add column if not exists delivery_phone text;
