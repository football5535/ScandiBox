-- 1. INVENTORY ITEMS TABLE
create table if not exists public.inventory_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  quantity text,
  added_date timestamp with time zone default now(),
  expiry_date timestamp with time zone,
  days_until_expiry integer,
  status text check (status in ('active', 'consumed', 'wasted')) default 'active',
  created_at timestamp with time zone default now()
);

-- 2. SHOPPING LIST TABLE
create table if not exists public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_checked boolean default false,
  created_at timestamp with time zone default now()
);

-- 3. USER PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  subscription_tier text default 'Free', 
  household_size integer default 1,
  dietary_restrictions text[],
  stripe_customer_id text,
  updated_at timestamp with time zone
);

-- 4. ENABLE RLS (Row Level Security)
alter table public.inventory_items enable row level security;
alter table public.shopping_items enable row level security;
alter table public.profiles enable row level security;

-- 5. RLS POLICIES - STRICT ISOLATION
-- Users can ONLY access data where their auth.uid matches the record's user_id.

-- Inventory
do $$ begin
  drop policy if exists "Users can view own inventory" on public.inventory_items;
  create policy "Users can view own inventory" on public.inventory_items for select using (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can insert own inventory" on public.inventory_items;
  create policy "Users can insert own inventory" on public.inventory_items for insert with check (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can update own inventory" on public.inventory_items;
  create policy "Users can update own inventory" on public.inventory_items for update using (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can delete own inventory" on public.inventory_items;
  create policy "Users can delete own inventory" on public.inventory_items for delete using (auth.uid() = user_id);
end $$;

-- Shopping List
do $$ begin
  drop policy if exists "Users can view own shopping list" on public.shopping_items;
  create policy "Users can view own shopping list" on public.shopping_items for select using (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can insert own shopping list" on public.shopping_items;
  create policy "Users can insert own shopping list" on public.shopping_items for insert with check (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can update own shopping list" on public.shopping_items;
  create policy "Users can update own shopping list" on public.shopping_items for update using (auth.uid() = user_id);
end $$;

do $$ begin
  drop policy if exists "Users can delete own shopping list" on public.shopping_items;
  create policy "Users can delete own shopping list" on public.shopping_items for delete using (auth.uid() = user_id);
end $$;

-- Profiles
do $$ begin
  drop policy if exists "Users can view own profile" on public.profiles;
  create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
end $$;

do $$ begin
  drop policy if exists "Users can update own profile" on public.profiles;
  create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
end $$;

-- 6. TRIGGERS FOR NEW USERS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_tier)
  values (new.id, new.email, 'Free'); -- Default to 'Free' for new registrations
  return new;
end;
$$ language plpgsql security definer;

-- Remove trigger if exists to avoid duplication errors (Postgres doesn't support 'create trigger if not exists' directly easily)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();