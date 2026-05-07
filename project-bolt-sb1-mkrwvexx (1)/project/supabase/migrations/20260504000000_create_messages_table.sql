create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete cascade not null,
  receiver_id uuid references auth.users(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete set null,
  content text not null,
  created_at timestamptz default now() not null
);

alter table messages enable row level security;

create policy "Users can read their own messages"
  on messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on messages for insert
  with check (auth.uid() = sender_id);

alter publication supabase_realtime add table messages;
