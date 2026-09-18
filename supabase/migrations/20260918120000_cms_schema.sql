create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  slug text unique not null,
  summary text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  slug text not null,
  summary text,
  description text,
  sort_order int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(product_id, slug)
);

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  name text not null,
  slug text unique not null,
  sku text,
  summary text,
  description text,
  color_name text,
  color_slug text,
  color_hex text,
  finish text,
  dimensions text,
  thickness text,
  material text,
  usage text,
  technical_specs jsonb not null default '{}'::jsonb,
  installation_notes text,
  care_notes text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  canonical_path text,
  source_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  option_id uuid references public.product_options(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  original_source_path text,
  original_filename text,
  alt_text text,
  kind text not null check (kind in ('main', 'secondary', 'gallery', 'extra', 'technical')),
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  check (product_id is not null or variant_id is not null or option_id is not null),
  unique(storage_bucket, storage_path)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text,
  content text,
  category text,
  location text,
  year text,
  surface text,
  materials jsonb not null default '[]'::jsonb,
  challenge text,
  result text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_bucket text not null,
  storage_path text not null,
  alt_text text,
  kind text not null check (kind in ('main', 'gallery', 'before', 'after')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(storage_bucket, storage_path)
);

create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  type text,
  address text,
  schedule text,
  phone text,
  whatsapp_url text,
  maps_url text,
  latitude numeric,
  longitude numeric,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles','categories','products','product_variants','product_options','projects','locations'] loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I', table_name, table_name);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do update set public = excluded.public;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_options enable row level security;
alter table public.product_images enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.locations enable row level security;

create policy "Admins can read profiles" on public.profiles for select using (public.is_admin() or id = auth.uid());
create policy "Admins can manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

create policy "Published categories are public" on public.categories for select using (status = 'published');
create policy "Published products are public" on public.products for select using (status = 'published');
create policy "Published product variants are public" on public.product_variants for select using (status = 'published');
create policy "Published product options are public" on public.product_options for select using (status = 'published');
create policy "Images for published product options are public" on public.product_images for select using (
  option_id in (select id from public.product_options where status = 'published')
  or product_id in (select id from public.products where status = 'published')
  or variant_id in (select id from public.product_variants where status = 'published')
);
create policy "Published projects are public" on public.projects for select using (status = 'published');
create policy "Images for published projects are public" on public.project_images for select using (
  project_id in (select id from public.projects where status = 'published')
);
create policy "Published locations are public" on public.locations for select using (status = 'published');

create policy "Admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product variants" on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product options" on public.product_options for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage product images" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage project images" on public.project_images for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage locations" on public.locations for all using (public.is_admin()) with check (public.is_admin());

create policy "Public read site media" on storage.objects for select using (bucket_id = 'site-media');
create policy "Admins manage site media" on storage.objects for all using (bucket_id = 'site-media' and public.is_admin()) with check (bucket_id = 'site-media' and public.is_admin());
