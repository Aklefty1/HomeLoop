-- ============================================================
-- HomeLoop Initial Database Schema
-- Run this in your Supabase SQL editor to create all tables.
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── HOMES ────────────────────────────────────────────────────
create table public.homes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'My Home',
  address text not null,
  city text not null default '',
  state text not null default '',
  zip text not null default '',
  year_built integer,
  square_feet integer,
  bedrooms integer,
  bathrooms numeric(3,1),
  lot_size text,
  home_type text not null default 'single_family'
    check (home_type in ('single_family', 'condo', 'townhouse', 'multi_family', 'other')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ── SYSTEMS ──────────────────────────────────────────────────
create table public.systems (
  id uuid default uuid_generate_v4() primary key,
  home_id uuid references public.homes(id) on delete cascade not null,
  name text not null,
  system_type text not null default 'other'
    check (system_type in (
      'hvac', 'roof', 'plumbing', 'electrical', 'water_heater',
      'gutters', 'appliance', 'foundation', 'exterior', 'interior',
      'landscaping', 'pool', 'security', 'other'
    )),
  manufacturer text,
  model text,
  install_date date,
  last_service_date date,
  lifespan_years integer,
  condition text not null default 'unknown'
    check (condition in ('excellent', 'good', 'fair', 'poor', 'unknown')),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ── MAINTENANCE TASKS ────────────────────────────────────────
create table public.maintenance_tasks (
  id uuid default uuid_generate_v4() primary key,
  home_id uuid references public.homes(id) on delete cascade not null,
  system_id uuid references public.systems(id) on delete set null,
  title text not null,
  description text,
  frequency_months integer,
  due_date date,
  completed_date date,
  status text not null default 'pending'
    check (status in ('pending', 'upcoming', 'overdue', 'completed', 'skipped')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  is_auto_generated boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ── DOCUMENTS ────────────────────────────────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  home_id uuid references public.homes(id) on delete cascade not null,
  system_id uuid references public.systems(id) on delete set null,
  name text not null,
  file_url text not null,
  file_type text,
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now() not null
);

-- ── VENDORS ──────────────────────────────────────────────────
create table public.vendors (
  id uuid default uuid_generate_v4() primary key,
  home_id uuid references public.homes(id) on delete cascade not null,
  name text not null,
  specialty text,
  phone text,
  email text,
  website text,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ── ROW LEVEL SECURITY ───────────────────────────────────────
-- Users can only see and modify their own data.

alter table public.homes enable row level security;
alter table public.systems enable row level security;
alter table public.maintenance_tasks enable row level security;
alter table public.documents enable row level security;
alter table public.vendors enable row level security;

-- Homes: user owns their homes
create policy "Users can view their own homes"
  on public.homes for select using (auth.uid() = user_id);
create policy "Users can create homes"
  on public.homes for insert with check (auth.uid() = user_id);
create policy "Users can update their own homes"
  on public.homes for update using (auth.uid() = user_id);
create policy "Users can delete their own homes"
  on public.homes for delete using (auth.uid() = user_id);

-- Systems: user owns via home
create policy "Users can view systems for their homes"
  on public.systems for select using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can create systems for their homes"
  on public.systems for insert with check (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can update systems for their homes"
  on public.systems for update using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can delete systems for their homes"
  on public.systems for delete using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );

-- Tasks: user owns via home
create policy "Users can view tasks for their homes"
  on public.maintenance_tasks for select using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can create tasks for their homes"
  on public.maintenance_tasks for insert with check (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can update tasks for their homes"
  on public.maintenance_tasks for update using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can delete tasks for their homes"
  on public.maintenance_tasks for delete using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );

-- Documents: user owns via home
create policy "Users can view documents for their homes"
  on public.documents for select using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can create documents for their homes"
  on public.documents for insert with check (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can delete documents for their homes"
  on public.documents for delete using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );

-- Vendors: user owns via home
create policy "Users can view vendors for their homes"
  on public.vendors for select using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can create vendors for their homes"
  on public.vendors for insert with check (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can update vendors for their homes"
  on public.vendors for update using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );
create policy "Users can delete vendors for their homes"
  on public.vendors for delete using (
    home_id in (select id from public.homes where user_id = auth.uid())
  );

-- ── AUTO-UPDATE TIMESTAMPS ───────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger homes_updated_at
  before update on public.homes
  for each row execute function public.handle_updated_at();

create trigger systems_updated_at
  before update on public.systems
  for each row execute function public.handle_updated_at();

create trigger tasks_updated_at
  before update on public.maintenance_tasks
  for each row execute function public.handle_updated_at();

create trigger vendors_updated_at
  before update on public.vendors
  for each row execute function public.handle_updated_at();
