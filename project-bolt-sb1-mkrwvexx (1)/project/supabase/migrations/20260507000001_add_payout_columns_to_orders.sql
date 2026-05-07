alter table public.orders
  add column if not exists seller_payout numeric,
  add column if not exists platform_fee numeric,
  add column if not exists payout_status text default 'pending';
