
-- ==========================================
-- SCANDIBOX DATABASE SCHEMA - COMPLETE REPAIR
-- ==========================================

-- 1. PROFILES TABLE (Must come first for foreign keys)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  subscription_tier text default 'Free', 
  household_size integer default 1,
  dietary_restrictions text[],
  family_name text,
  language text default 'en',
  stripe_customer_id text,
  updated_at timestamp with time zone
);

-- Fix: Ensure 'language' column exists (for older deployments)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'language') then
    alter table public.profiles add column language text default 'en'; 
  end if; 
  if not exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'subscription_tier') then
    alter table public.profiles add column subscription_tier text default 'Free'; 
  end if;
end $$;

-- 2. INVENTORY ITEMS TABLE
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

-- Fix: Ensure snake_case columns exist for the API mapping
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'inventory_items' and column_name = 'days_until_expiry') then
    alter table public.inventory_items add column days_until_expiry integer; 
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'inventory_items' and column_name = 'expiry_date') then
    alter table public.inventory_items add column expiry_date timestamp with time zone; 
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'inventory_items' and column_name = 'added_date') then
    alter table public.inventory_items add column added_date timestamp with time zone default now(); 
  end if;
end $$;

-- 3. SHOPPING LIST TABLE
create table if not exists public.shopping_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  is_checked boolean default false,
  created_at timestamp with time zone default now()
);

-- Fix: Ensure is_checked exists
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'shopping_items' and column_name = 'is_checked') then
    alter table public.shopping_items add column is_checked boolean default false; 
  end if;
end $$;

-- 4. SAVED RECIPES TABLE
create table if not exists public.saved_recipes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  ingredients jsonb,
  instructions jsonb,
  time_estimate text,
  match_score integer,
  created_at timestamp with time zone default now()
);

-- ==========================================
-- SECURITY & PERMISSIONS (RLS)
-- ==========================================

-- Enable RLS on all tables
alter table public.inventory_items enable row level security;
alter table public.shopping_items enable row level security;
alter table public.profiles enable row level security;
alter table public.saved_recipes enable row level security;

-- Drop existing policies to ensure clean slate (Fixes permission errors)
drop policy if exists "Users can view own inventory" on public.inventory_items;
drop policy if exists "Users can insert own inventory" on public.inventory_items;
drop policy if exists "Users can update own inventory" on public.inventory_items;
drop policy if exists "Users can delete own inventory" on public.inventory_items;

drop policy if exists "Users can view own shopping list" on public.shopping_items;
drop policy if exists "Users can insert own shopping list" on public.shopping_items;
drop policy if exists "Users can update own shopping list" on public.shopping_items;
drop policy if exists "Users can delete own shopping list" on public.shopping_items;

drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

drop policy if exists "Users can view own recipes" on public.saved_recipes;
drop policy if exists "Users can insert own recipes" on public.saved_recipes;
drop policy if exists "Users can delete own recipes" on public.saved_recipes;

-- Re-create Policies

-- INVENTORY
create policy "Users can view own inventory" on public.inventory_items for select using (auth.uid() = user_id);
create policy "Users can insert own inventory" on public.inventory_items for insert with check (auth.uid() = user_id);
create policy "Users can update own inventory" on public.inventory_items for update using (auth.uid() = user_id);
create policy "Users can delete own inventory" on public.inventory_items for delete using (auth.uid() = user_id);

-- SHOPPING
create policy "Users can view own shopping list" on public.shopping_items for select using (auth.uid() = user_id);
create policy "Users can insert own shopping list" on public.shopping_items for insert with check (auth.uid() = user_id);
create policy "Users can update own shopping list" on public.shopping_items for update using (auth.uid() = user_id);
create policy "Users can delete own shopping list" on public.shopping_items for delete using (auth.uid() = user_id);

-- PROFILES
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
-- Allow users to insert their own profile (triggers usually handle this, but safe to add for robustness)
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- RECIPES
create policy "Users can view own recipes" on public.saved_recipes for select using (auth.uid() = user_id);
create policy "Users can insert own recipes" on public.saved_recipes for insert with check (auth.uid() = user_id);
create policy "Users can delete own recipes" on public.saved_recipes for delete using (auth.uid() = user_id);

-- ==========================================
-- AUTOMATION (TRIGGERS)
-- ==========================================

-- Function to handle new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, subscription_tier, language)
  values (new.id, new.email, 'Free', 'en')
  on conflict (id) do nothing; -- Prevent errors if profile already exists
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Ensure Supabase Realtime is on for these tables (Optional but good for UX)
alter publication supabase_realtime add table public.inventory_items;
alter publication supabase_realtime add table public.shopping_items;
